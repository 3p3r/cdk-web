it("should throw when asked to render in an unsupported format", async () => {
  async function factory(CDK = globalThis.CDK) {
    const cdk = CDK.require("aws-cdk-lib");
    const s3 = CDK.require("aws-cdk-lib/aws-s3");
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "BrowserStack");
    new s3.Bucket(stack, "Bucket");
    const cli = new CDK.PseudoCli({ stack });
    await cli.render({ type: "invalid" });
  }
  await chai.assert.isRejected(page.evaluate(factory));
});

it("should be able to render vis.js format nodes", async () => {
  async function factory(CDK = globalThis.CDK) {
    const cdk = CDK.require("aws-cdk-lib");
    const s3 = CDK.require("aws-cdk-lib/aws-s3");
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "BrowserStack");
    new s3.Bucket(stack, "Bucket");
    const cli = new CDK.PseudoCli({ stack });
    const data = await cli.render({ type: "vis.js" });
    return data;
  }
  const data = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.assert.isObject(data);
  chai.assert.isNotEmpty(data);
  chai.assert.hasAllKeys(data, ["nodes", "edges"]);
  chai.assert.isArray(data.nodes);
  chai.assert.isNotEmpty(data.nodes);
  chai.assert.isArray(data.edges);
  chai.assert.isNotEmpty(data.edges);
});

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
