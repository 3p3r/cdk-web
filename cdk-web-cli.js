const cdk = require("aws-cdk-lib");
const AWS = require("aws-sdk");
const { SdkProvider } = require("aws-cdk/lib/api/aws-auth");
const { CloudFormationDeployments } = require("aws-cdk/lib/api/cloudformation-deployments");

module.exports = {
  /** @param {cdk.Stack} stack */
  synth: function (stack) {
    const app = stack.node.root;
    const assembly = app.synth();
    return assembly.getStackArtifact(stack.stackName).template;
  },

  /** @param {cdk.Stack} stack @param {AWS.Credentials} credentials */
  deploy: function (stack, credentials) {
    /** @type {cdk.App} */
    const app = stack.node.root;
    const stackArtifact = app.synth().getStackByName(stack.stackName);
    const credentialProviderChain = new AWS.CredentialProviderChain(credentials);
    const sdkProvider = new SdkProvider(credentialProviderChain, app.region || "us-east-1", { credentials });
    const cloudFormation = new CloudFormationDeployments({ sdkProvider });
    return cloudFormation.deployStack({
      stack: stackArtifact,
      notificationArns: [notificationTopicArn],
      quiet: true,
    });
  },
};
