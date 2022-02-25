const fs = require("fs");
const AWS = require("aws-sdk");
const cdk = require("aws-cdk-lib");
const assert = require("assert");
const { SdkProvider } = require("aws-cdk/lib/api/aws-auth");
const {
  DeployStackOptions,
  DestroyStackOptions,
  CloudFormationDeployments,
} = require("aws-cdk/lib/api/cloudformation-deployments");

/**
 * @typedef {Object} PseudoCliParams
 * @property {cdk.Stack} stack
 * @property {AWS.Credentials|undefined} credentials
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
   * @param {PseudoCliParams} options
   */
  constructor(options) {
    /** @type {PseudoCliParams} */
    this.opts = options;
  }

  /**
   * just like native "cdk synth". it synthesizes your stack.
   * @param {cdk.StageSynthesisOptions|undefined} opts
   * @returns {Object} the template JSON.
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
   */
  synth(opts) {
    const { template } = createStackArtifact(this.opts.stack, opts);
    return template;
  }

  /**
   * just like native "cdk deploy". it deploys your stack to a live AWS account
   * @param {DeployStackOptions|undefined} opts
   * @example
   * ```JS
   * const PseudoCli = require("aws-cdk");
   * const cli = new PseudoCli({stack, credentials: { ... }});
   * // just like executing "cdk deploy"
   * await cli.deploy();
   * ```
   */
  async deploy(opts) {
    overrideGlobalPermissions(this.opts.credentials, this.opts.stack.node.root.region);
    const agent = await createDeployAgent(this.opts.credentials);
    return await agent.deployStack({ stack: createStackArtifact(this.opts.stack), quiet: true, ...opts });
  }

  /**
   * just like native "cdk destroy". it destroys your previously deployed stack in a live AWS account
   * @param {DestroyStackOptions|undefined} opts
   * @example
   * ```JS
   * const PseudoCli = require("aws-cdk");
   * const cli = new PseudoCli({stack, credentials: { ... }});
   * // just like executing "cdk destroy"
   * await cli.destroy();
   * ```
   */
  async destroy(opts) {
    overrideGlobalPermissions(this.opts.credentials, this.opts.stack.node.root.region);
    const agent = await createDeployAgent(this.opts.credentials);
    return agent.destroyStack({ stack: createStackArtifact(this.opts.stack), quiet: true, ...opts });
  }
}

module.exports = PseudoCli;

/**
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
 * @param {cdk.Stack} stack
 * @param {AWS.Credentials} credentials
 */
const createDeployAgent = async (credentials) => {
  const sdkProvider = new SdkProvider(AWS.config.credentialProvider, AWS.config.region, { credentials });
  const { Account } = await new AWS.STS().getCallerIdentity().promise();
  sdkProvider.defaultAccount = () => Promise.resolve({ accountId: Account, partition: "aws" });
  const deployment = new CloudFormationDeployments({ sdkProvider });
  return deployment;
};
