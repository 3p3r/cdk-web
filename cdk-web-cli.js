const fs = require("fs");
const AWS = require("aws-sdk");
const cdk = require("aws-cdk-lib");
const { SdkProvider } = require("aws-cdk/lib/api/aws-auth");
const { CloudFormationDeployments } = require("aws-cdk/lib/api/cloudformation-deployments");

/**
 * @note for this to work, the cdk bucket must have a respectable CORS policy attached to it.
 * you can change the CORS policy in [ Properties > Permissions > Edit CORS Configuration ].
 * a sample policy to wildcard-allow everything looks like this:
 * [
 *   {
 *     "AllowedHeaders": ["*"],
 *     "AllowedMethods": ["HEAD","GET","POST","PUT","DELETE"],
 *     "AllowedOrigins": ["*"]
 *   }
 * ]
 */
module.exports = class PseudoCli {
  /** @param {{stack:cdk.Stack,credentials:AWS.Credentials|undefined}} options */
  constructor(options) {
    this.opts = options;
  }
  /** @type {cdk.App} */
  get app() {
    return this.opts.stack.node.root;
  }
  get stack() {
    return this.opts.stack;
  }
  get credentials() {
    return this.opts.credentials;
  }

  synth() {
    const assembly = this.app.synth();
    return assembly.getStackArtifact(stack.stackName).template;
  }

  async deploy() {
    const agent = await createDeployAgent(this.stack, this.app, this.credentials);
    return agent.deployment.deployStack({ stack: agent.artifact, quiet: true });
  }

  async destroy() {
    const agent = await createDeployAgent(this.stack, this.app, this.credentials);
    return agent.deployment.destroyStack({ stack: agent.artifact, quiet: true });
  }
};

/** @param {AWS.Credentials} credentials */
const overrideGlobalPermissions = (credentials, region = "us-east-1") => {
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

const createDeployAgent = async (stack, app, credentials) => {
  overrideGlobalPermissions(credentials, app.region);
  const artifact = app.synth().getStackByName(stack.stackName);
  const sdkProvider = new SdkProvider(AWS.config.credentialProvider, AWS.config.region, { credentials });
  const { Account } = await new AWS.STS().getCallerIdentity().promise();
  sdkProvider.defaultAccount = () => Promise.resolve({ accountId: Account, partition: "aws" });
  const deployment = new CloudFormationDeployments({ sdkProvider });
  return { deployment, artifact };
};
