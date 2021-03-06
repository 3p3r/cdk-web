it("should be able to capture logs with the emitter object", async () => {
  async function factory(CDK = globalThis.CDK) {
    CDK.require("process").stdout.write("coverage");
    CDK.require("process").stderr.write("coverage");
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
    await cli.synth();
    await new Promise((resolve, reject) => {
      CDK.emitter.once("console", (msg) => {
        if (msg === "There were no differences") resolve();
        else reject(`bad log: ${msg}`);
      });
      cli.diff();
    }).finally(() => {
      CDK.emitter.removeAllListeners("console");
    });
  }
  await chai.assert.isFulfilled(page.evaluate(factory));
});
