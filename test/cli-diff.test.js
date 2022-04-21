it("should be able to execute diff over two iterations of the same stack", async () => {
  async function factory(change = false, CDK = globalThis.CDK) {
    const cdk = CDK.require("aws-cdk-lib");
    const ec2 = CDK.require("aws-cdk-lib/aws-ec2");
    const sqs = CDK.require("aws-cdk-lib/aws-sqs");
    const sns = CDK.require("aws-cdk-lib/aws-sns");
    const s3 = CDK.require("aws-cdk-lib/aws-s3");
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "BrowserStack");
    new ec2.Vpc(stack, "VPC");
    new sqs.Queue(stack, "Queue");
    change && new sns.Topic(stack, "Topic");
    change && new s3.Bucket(stack, "Bucket");
    const cli = new CDK.PseudoCli({ stack });
    await cli.diff({ fail: change });
    await cli.synth();
  }
  await chai.assert.isFulfilled(page.evaluate(factory, 0));
  await chai.assert.isRejected(page.evaluate(factory, 1));
});
