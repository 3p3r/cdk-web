const fs = require("fs");
const path = require("path");
const CDK_WEB_URL = `file://${path.resolve(__dirname, "dist/index.html")}`;

describe("cdk-web tests", () => {
  describe("basic sanity tests", () => {
    beforeAll(async () => {
      await page.goto(CDK_WEB_URL);
    });

    afterAll(async () => {
      await page.reload();
    });

    it("should pass a basic truthy sanity test (node)", () => {
      expect(true).toEqual(true);
    });

    it("should pass a basic sanity test in browser (puppeteer)", async () => {
      await expect(page.title()).resolves.toMatch("cdk-web");
    });

    it("should be able to synthesize a basic stack", async () => {
      const factory = async () => {
        const cdk = require("aws-cdk-lib"),
          ec2 = require("aws-cdk-lib/aws-ec2"),
          sqs = require("aws-cdk-lib/aws-sqs"),
          sns = require("aws-cdk-lib/aws-sns"),
          s3 = require("aws-cdk-lib/aws-s3");
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

  describe("tests for patches and fixes", () => {
    describe("CDK_WEB_REQUIRE override", () => {
      beforeAll(async () => {
        await page.reload();
        await page.setContent(`<!DOCTYPE html>
        <html>
          <body>
            <script>window.CDK_WEB_REQUIRE = "_require_"</script>
            <script src="cdk-web.js"></script>
          </body>
        </html>`);
      });

      it("should be able to override the default 'require'", async () => {
        const factory = async () => {
          const cdk = require("aws-cdk-lib");
          const app = new cdk.App(),
            stack = new cdk.Stack(app, "BrowserStack"),
            assembly = app.synth();
          return assembly.getStackArtifact(stack.stackName).template;
        };
        const [pageTemplate, nodeTemplate] = await Promise.all([
          factory(),
          page.evaluate(async () => {
            const cdk = _require_("aws-cdk-lib");
            const app = new cdk.App(),
              stack = new cdk.Stack(app, "BrowserStack"),
              assembly = app.synth();
            return assembly.getStackArtifact(stack.stackName).template;
          }),
        ]);
        expect(pageTemplate).toMatchObject(nodeTemplate);
      });
    });

    describe("CfnInclude runtime JSON asset", () => {
      beforeAll(async () => {
        await page.reload();
        await page.setContent(`<!DOCTYPE html>
        <html>
          <body>
            <script src="cdk-web.js"></script>
          </body>
        </html>`);
      });

      it("should be able to synthesize a stack with CfnInclude", async () => {
        const factory = async () => {
          const fs = require("fs");
          fs.writeFileSync(
            "/tmp/input.yaml",
            JSON.stringify({
              Resources: {
                Bucket: {
                  Type: "AWS::S3::Bucket",
                  Properties: {
                    BucketName: "some-bucket-name",
                  },
                },
              },
            })
          );
          const cdk = require("aws-cdk-lib");
          const cfnInc = require("aws-cdk-lib/cloudformation-include");
          const app = new cdk.App();
          const stack = new cdk.Stack(app, "Stack");
          new cfnInc.CfnInclude(stack, "Template", {
            templateFile: "/tmp/input.yaml",
          });
          const assembly = app.synth();
          return assembly.getStackArtifact(stack.stackName).template;
        };
        const [pageTemplate, nodeTemplate] = await Promise.all([
          factory(),
          page.evaluate(factory),
        ]);
        expect(pageTemplate).toMatchObject(nodeTemplate);
      });
    });
  });
});
