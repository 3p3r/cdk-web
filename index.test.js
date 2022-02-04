const path = require("path");
const CDK_WEB_URL = `file://${path.resolve(__dirname, "dist/index.html")}`;

describe("cdk-web tests", () => {
  beforeAll(async () => {
    await page.goto(CDK_WEB_URL);
  });

  it("sanity test", async () => {
    await expect(page.title()).resolves.toMatch("cdk-web");
  });

  it("should be able to synthesize a basic stack", async () => {
    const factory = async () => {
      const cdk = require("aws-cdk-lib");
      const { aws_ec2: ec2, aws_sqs: sqs, aws_sns: sns, aws_s3: s3 } = cdk;
      const app = new cdk.App(),
        stack = new cdk.Stack(app, "BrowserStack"),
        vpc = new ec2.Vpc(stack, "VPC"),
        queue = new sqs.Queue(stack, "Queue"),
        topic = new sns.Topic(stack, "Topic"),
        bucket = new s3.Bucket(stack, "Bucket"),
        assembly = app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const [pageTemplate, nodeTemplate] = await Promise.all([
      factory(),
      page.evaluate(factory),
    ]);
    expect(pageTemplate).toMatchObject(nodeTemplate);
  });
});
