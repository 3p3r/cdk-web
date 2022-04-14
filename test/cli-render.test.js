it("should be able to render a basic stack", async () => {
  async function factory(CDK = globalThis.CDK) {
    const cdk = CDK.require("aws-cdk-lib");
    const ec2 = CDK.require("aws-cdk-lib/aws-ec2");
    const sqs = CDK.require("aws-cdk-lib/aws-sqs");
    const sns = CDK.require("aws-cdk-lib/aws-sns");
    const s3 = CDK.require("aws-cdk-lib/aws-s3");
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "BrowserStack");
    new ec2.Vpc(stack, "VPC");
    new sqs.Queue(stack, "Queue");
    new sns.Topic(stack, "Topic");
    new s3.Bucket(stack, "Bucket");
    const cli = new CDK.PseudoCli({ stack });
    const html = await cli.render();
    return html;
  }
  const output = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.assert.isString(output);
  chai.assert.isNotEmpty(output);
});
