const os = require("os");
const fs = require("fs");
const AWS = require("aws-sdk");
const cdk = require("aws-cdk-lib");
const equal = require("fast-deep-equal");
const assert = require("assert");

const { SdkProvider } = require("aws-cdk/lib/api/aws-auth");
const { Bootstrapper, BootstrapEnvironmentOptions } = require("aws-cdk/lib/api/bootstrap");
const {
  DeployStackOptions,
  DestroyStackOptions,
  CloudFormationDeployments,
} = require("aws-cdk/lib/api/cloudformation-deployments");

const { numberFromBool } = require("aws-cdk/lib/util");
const { deserializeStructure } = require("aws-cdk/lib/serialize");
const { printSecurityDiff, printStackDiff, RequireApproval } = require("aws-cdk/lib/diff");

/**
 * @typedef {Object} CloudFormationTemplate
 * @description JSON representation of a CloudFormation stack
 */

/**
 * @typedef {Object} DeployStackResult
 * @description see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
 * for full reference for this interface (look for `DeployStackResult` interface in `aws-cdk`)
 */

/**
 * @typedef {Object} PseudoCliOptions
 * @description parameters to create a cdk-web pseudo cli
 * @property {cdk.Stack} [stack]=undefined stack is optional for bootstrapping
 * @property {AWS.Credentials} [credentials]=undefined credentials is optional for synthesizing
 */

/**
 * @typedef {Object} PseudoCliDiffOptions
 * @description parameters to execute a cli diff operation with
 * @property {string} [templatePath]="<last-template-in-cdk.out>" template to compare current stack with
 * @property {number} [contextLines]=3 number of contexts per line
 * @property {boolean} [strict]=false strict mode
 * @property {boolean} [fail]=false fail if differences are detected
 * @property {boolean} [securityOnly]=false only security changes to be noted
 * @property {boolean} [synthOptions]=undefined optional synth options passed to generate the new stack
 */

/**
 * @typedef {Object} BootstrapEnvironmentOptionsExtra
 * @description extensions of cdk bootstrap options, adapted to suit cdk-web's needs
 * @property {string} [account]="<account-bound-to-credentials>" the AWS account to be bootstrapped (no-op if already done)
 * @property {string} [region]="us-east-1" the AWS region in your account to be bootstrapped
 * @property {Object} [cors]="[{"AllowedHeaders":["*"],"AllowedMethods":["HEAD","GET","POST","PUT","DELETE"],"AllowedOrigins":["*"]}]"
 * CORS policy on the CDK assets bucket. this is needed for cdk-web to work correctly in browser. native cdk does not require this.
 * @see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/bootstrap/bootstrap-props.ts)
 * for additional parameters acceptable for this object (look for `BootstrapEnvironmentOptions` interface in `aws-cdk`)
 *
 * @typedef {BootstrapEnvironmentOptions|BootstrapEnvironmentOptionsExtra} BootstrapWebEnvironmentOptions
 * @description parameters to bootstrap an AWS account for cdk-web
 */

class PseudoCli {
  /**
   * > **NOTE 1:** for this to work, the cdk bucket must have a respectable CORS policy attached to it.
   * you can change the CORS policy in [ Properties > Permissions > Edit CORS Configuration ].
   * a sample policy to wildcard-allow everything looks like this:
   * > ```JSON
   * > [
   * >   {
   * >     "AllowedHeaders": ["*"],
   * >     "AllowedMethods": ["HEAD","GET","POST","PUT","DELETE"],
   * >     "AllowedOrigins": ["*"]
   * >   }
   * > ]
   * > ```
   *
   * > **NOTE 2:** Providing "credentials" is optional but you won't be able to take live actions (e.g deploy and destroy)
   * @param {PseudoCliOptions} [opts]=undefined options for cdk-web's pseudo cli
   */
  constructor(opts) {
    /**
     * @type {PseudoCliOptions}
     * @private
     */
    this.opts = opts;
  }

  /**
   * just like native "cdk synth". it synthesizes your stack.
   * @param {cdk.StageSynthesisOptions} [opts]=undefined options for stack synthage
   * @returns {Promise<CloudFormationTemplate>} the cloudformation template JSON.
   * @example
   * ```JS
   * const cli = new CDK.PseudoCli({
   *   stack,
   *   credentials: {
   *     accessKeyId: "your AWS access key goes here",
   *     secretAccessKey: "your AWS secret goes here",
   *     // sessionToken: "in case you have a session token",
   *   },
   * });
   * // just like executing "cdk synth"
   * const template = await cli.synth();
   * console.log(template);
   * ```
   * @see [native-cdk](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.StageSynthesisOptions.html)
   * for additional parameters acceptable for this object (look for `StageSynthesisOptions` interface in `aws-cdk`)
   */
  async synth(opts) {
    const { template } = await createStackArtifact(this.opts.stack, opts);
    return template;
  }

  /**
   * bootstraps a live AWS account and takes "special care" for cdk-web
   * @param {BootstrapWebEnvironmentOptions} [opts]=undefined options for bootstrapage
   * @returns {Promise<DeployStackResult>}
   */
  async bootstrap(opts) {
    opts = {
      region: "us-east-1",
      cors: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["HEAD", "GET", "POST", "PUT", "DELETE"],
          AllowedOrigins: ["*"],
        },
      ],
      ...opts,
    };
    overrideGlobalPermissions(this.opts.credentials, opts.region);
    const sdkProvider = await createProvider(this.opts.credentials);
    const account = opts.account || (await sdkProvider.defaultAccount()).accountId;
    const bootstrapper = new Bootstrapper({ source: "default" });
    const result = await bootstrapper.bootstrapEnvironment({ account, region: opts.region }, sdkProvider, opts);
    try {
      const Bucket = result.outputs.BucketName;
      const s3 = new AWS.S3();
      const { CORSRules: currentCorsRules } = await s3.getBucketCors({ Bucket }).promise();
      if (!equal(currentCorsRules, opts.cors))
        await s3.putBucketCors({ Bucket, CORSConfiguration: { CORSRules: opts.cors } }).promise();
    } catch (err) {
      console.error(err, "failed to apply CORS policy to CDK assets bucket");
      throw err;
    }
    return result;
  }

  /**
   * detects changes between the current stack and the previous run of synth()
   * @note executes synth() internally to generate the new stack template
   * @param {PseudoCliDiffOptions} options
   * @returns {Promise<void>} prints diff to console. rejects IFF "fail" is true and changes are detected
   */
  async diff(options = {}) {
    const stack = this.opts.stack;
    const app = stack.node.root;

    assert.ok(stack, "a stack is required for this operation");
    const currentTemplateDir = app.outdir;
    const currentTemplateFile = stack.templateFile;
    const currentTemplatePath = `${currentTemplateDir}/${currentTemplateFile}`;

    const templatePath = options.templatePath || currentTemplatePath;
    const contextLines = options.contextLines || 3;
    const strict = !!options.strict;
    const fail = !!options.fail;

    if (fs.existsSync(templatePath)) {
      let diffs = 0;
      const template = deserializeStructure(fs.readFileSync(templatePath, { encoding: "utf-8" }));
      if (fs.existsSync(os.tmpdir())) fs.rmdirSync(os.tmpdir());
      await this.synth(options.synthOptions);
      const stackArtifact = app.assembly.getStackArtifact(stack.artifactId);
      diffs = options.securityOnly
        ? numberFromBool(printSecurityDiff(template, stackArtifact, RequireApproval.Broadening))
        : printStackDiff(template, stackArtifact, strict, contextLines, { write: console.log });
      return diffs && fail ? Promise.reject() : Promise.resolve();
    } else {
      return fail ? Promise.reject() : Promise.resolve();
    }
  }

  /**
   * just like native "cdk deploy". it deploys your stack to a live AWS account
   * @param {DeployStackOptions} [opts]=undefined options for stack deployage
   * @example
   * ```JS
   * const cli = new CDK.PseudoCli({stack, credentials: { ... }});
   * // just like executing "cdk deploy"
   * await cli.deploy();
   * ```
   * @see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
   * for additional parameters acceptable for this object (look for `DeployStackOptions` interface in `aws-cdk`)
   * @returns {Promise<DeployStackResult>}
   */
  async deploy(opts) {
    overrideGlobalPermissions(this.opts.credentials, this.opts.stack.node.root.region);
    const agent = await createDeployAgent(this.opts.credentials);
    const stack = await createStackArtifact(this.opts.stack);
    return agent.deployStack({ stack, quiet: true, ...opts });
  }

  /**
   * just like native "cdk destroy". it destroys your previously deployed stack in a live AWS account
   * @param {DestroyStackOptions} [opts]=undefined options for stack destroyage
   * @example
   * ```JS
   * const cli = new CDK.PseudoCli({stack, credentials: { ... }});
   * // just like executing "cdk destroy"
   * await cli.destroy();
   * ```
   * @see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
   * for additional parameters acceptable for this object (look for `DestroyStackOptions` interface in `aws-cdk`)
   * @returns {Promise<void>}
   */
  async destroy(opts) {
    overrideGlobalPermissions(this.opts.credentials, this.opts.stack.node.root.region);
    const agent = await createDeployAgent(this.opts.credentials);
    const stack = await createStackArtifact(this.opts.stack);
    return agent.destroyStack({ stack, quiet: true, ...opts });
  }
}

module.exports = PseudoCli;

/**
 * @private
 * @param {AWS.Credentials} credentials
 * @param {string|undefined} region
 */
const overrideGlobalPermissions = (credentials, region = "us-east-1") => {
  assert.ok(credentials !== undefined, "credentials not set");
  const credentialProvider = new AWS.CredentialProviderChain();
  credentialProvider.providers.push(new AWS.Credentials(credentials));
  AWS.config.update({ credentials, credentialProvider, region });
  if (!fs.existsSync("/.aws")) fs.mkdirSync("/.aws");
  fs.writeFileSync("/.aws/config", [`[default]`, `region=${region}`, `output=json`].join("\n"), { encoding: "utf-8" });
  fs.writeFileSync(
    "/.aws/credentials",
    [
      "[default]",
      `aws_access_key_id=${credentials.accessKeyId}`,
      `aws_secret_access_key=${credentials.secretAccessKey}`,
      credentials.sessionToken ? `aws_session_token=${credentials.sessionToken}` : "",
    ].join("\n"),
    {
      encoding: "utf-8",
    }
  );
};

/**
 * @private
 * @param {cdk.Stack} stack
 * @param {cdk.StageSynthesisOptions} [opts]
 */
const createStackArtifact = async (stack, opts) => {
  const app = stack.node.root;
  assert.ok(app !== undefined, "stack is not bound to any apps");
  const assembly = await app.synth(opts);
  return assembly.getStackArtifact(stack.stackName);
};

/**
 * @private
 * @param {AWS.Credentials} credentials
 */
const createProvider = async (credentials) => {
  const sdkProvider = new SdkProvider(AWS.config.credentialProvider, AWS.config.region, { credentials });
  const { Account } = await new AWS.STS().getCallerIdentity().promise();
  sdkProvider.defaultAccount = () => Promise.resolve({ accountId: Account, partition: "aws" });
  return sdkProvider;
};

/**
 * @private
 * @param {AWS.Credentials} credentials
 */
const createDeployAgent = async (credentials) => {
  const sdkProvider = await createProvider(credentials);
  const deployment = new CloudFormationDeployments({ sdkProvider });
  return deployment;
};
