it("should be able to synthesize a basic stack", async () => {
  const factory = async (CDK = globalThis.CDK) => {
    const cdk = CDK.require("aws-cdk-lib"),
      ec2 = CDK.require("aws-cdk-lib/aws-ec2"),
      sqs = CDK.require("aws-cdk-lib/aws-sqs"),
      sns = CDK.require("aws-cdk-lib/aws-sns"),
      s3 = CDK.require("aws-cdk-lib/aws-s3");
    const app = new cdk.App(),
      stack = new cdk.Stack(app, "BrowserStack");
    new ec2.Vpc(stack, "VPC");
    new sqs.Queue(stack, "Queue");
    new sns.Topic(stack, "Topic");
    new s3.Bucket(stack, "Bucket");
    const assembly = await app.synth();
    return assembly.getStackArtifact(stack.stackName).template;
  };
  const [pageTemplate, nodeTemplate] = await chai.assert.isFulfilled(Promise.all([factory(), page.evaluate(factory)]));
  chai.assert.deepEqual(pageTemplate, nodeTemplate);
});
