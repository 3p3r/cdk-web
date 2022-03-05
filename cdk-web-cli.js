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

/**
 * @typedef {DeployStackResult} DeployStackWebResult
 * @description see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
 * for full reference for this interface (look for `DeployStackResult` interface in `aws-cdk`)
 */

/**
 * @typedef {Object} PseudoCliOptions
 * @description parameters to create a cdk-web pseudo cli
 * @property {cdk.Stack|undefined} stack stack is optional for bootstrapping
 * @property {AWS.Credentials|undefined} credentials credentials is optional for synthesizing
 */

/**
 * @typedef {Object} BootstrapEnvironmentOptionsExtra
 * @description extensions of cdk bootstrap options, adapted to suit cdk-web's needs
 * @property {string|undefined} account=account-bound-to-credentials the AWS account to be bootstrapped (no-op if already done)
 * @property {string|undefined} region=us-east-1 the AWS region in your account to be bootstrapped
 * @property {Object|undefined} cors=[{"AllowedHeaders":["*"],"AllowedMethods":["HEAD","GET","POST","PUT","DELETE"],"AllowedOrigins":["*"]}]
 * CORS policy on the CDK assets bucket. this is needed for cdk-web to work correctly in browser. native cdk does not require this.
 * @see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/bootstrap/bootstrap-props.ts)
 * for additional parameters acceptable for this object (look for `BootstrapEnvironmentOptions` interface in `aws-cdk`)
 *
 * @typedef {BootstrapEnvironmentOptions | BootstrapEnvironmentOptionsExtra} BootstrapWebEnvironmentOptions
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
   * @param {PseudoCliOptions|undefined} opts options for cdk-web's pseudo cli
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
   * @param {cdk.StageSynthesisOptions|undefined} opts options for stack synthage
   * @returns {Object} the cloudformation template JSON.
   * @example
   * ```JS
   * const PseudoCli = require("aws-cdk");
   * const cli = new PseudoCli({
   *   stack,
   *   credentials: {
   *     accessKeyId: "your AWS access key goes here",
   *     secretAccessKey: "your AWS secret goes here",
   *     // sessionToken: "in case you have a session token",
   *   },
   * });
   * // just like executing "cdk synth"
   * const template = cli.synth();
   * console.log(template);
   * ```
   * @see [native-cdk](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.StageSynthesisOptions.html)
   * for additional parameters acceptable for this object (look for `StageSynthesisOptions` interface in `aws-cdk`)
   */
  synth(opts) {
    const { template } = createStackArtifact(this.opts.stack, opts);
    return template;
  }

  /**
   * bootstraps a live AWS account and takes "special care" for cdk-web
   * @param {BootstrapWebEnvironmentOptions|undefined} opts options for bootstrapage
   * @returns {Promise<DeployStackWebResult>}
   */
  async bootstrap(opts) {
    opts = {
      region: "us-east-1",
      account: (await sdkProvider.defaultAccount()).accountId,
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
    const bootstrapper = new Bootstrapper({ source: "default" });
    const result = await bootstrapper.bootstrapEnvironment(
      { account: opts.account, region: opts.region },
      sdkProvider,
      opts
    );
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
   * just like native "cdk deploy". it deploys your stack to a live AWS account
   * @param {DeployStackOptions|undefined} opts options for stack deployage
   * @example
   * ```JS
   * const PseudoCli = require("aws-cdk");
   * const cli = new PseudoCli({stack, credentials: { ... }});
   * // just like executing "cdk deploy"
   * await cli.deploy();
   * ```
   * @see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
   * for additional parameters acceptable for this object (look for `DeployStackOptions` interface in `aws-cdk`)
   * @returns {Promise<DeployStackWebResult>}
   */
  async deploy(opts) {
    overrideGlobalPermissions(this.opts.credentials, this.opts.stack.node.root.region);
    const agent = await createDeployAgent(this.opts.credentials);
    return agent.deployStack({ stack: createStackArtifact(this.opts.stack), quiet: true, ...opts });
  }

  /**
   * just like native "cdk destroy". it destroys your previously deployed stack in a live AWS account
   * @param {DestroyStackOptions|undefined} opts options for stack destroyage
   * @example
   * ```JS
   * const PseudoCli = require("aws-cdk");
   * const cli = new PseudoCli({stack, credentials: { ... }});
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
    return agent.destroyStack({ stack: createStackArtifact(this.opts.stack), quiet: true, ...opts });
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
 * @param {cdk.StageSynthesisOptions|undefined} opts
 */
const createStackArtifact = (stack, opts) => {
  const app = stack.node.root;
  assert.ok(app !== undefined, "stack is not bound to any apps");
  const assembly = app.synth(opts);
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
