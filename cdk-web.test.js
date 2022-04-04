const path = require("path");
const { __ROOT } = require("./webpack/common");

const CDK = { require }; // simulate in node
const CDK_WEB_URL = `file://${path.resolve(__ROOT, "dist/index.html")}`;

expect.extend({
  toEvaluateWithoutExceptions(received, expression = () => false) {
    try {
      expression(received);
      return {
        message: () => `expression did not throw for ${received}`,
        pass: true,
      };
    } catch (err) {
      return {
        message: () => `expression thrown for ${received} error: ${err.message}`,
        pass: false,
      };
    }
  },
});

describe("cdk-web tests", () => {
  beforeEach(async () => {
    await page.goto(CDK_WEB_URL);
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
      const cdk = CDK.require("aws-cdk-lib"),
        ec2 = CDK.require("aws-cdk-lib/aws-ec2"),
        sqs = CDK.require("aws-cdk-lib/aws-sqs"),
        sns = CDK.require("aws-cdk-lib/aws-sns"),
        s3 = CDK.require("aws-cdk-lib/aws-s3");
      const app = new cdk.App(),
        stack = new cdk.Stack(app, "BrowserStack"),
        vpc = new ec2.Vpc(stack, "VPC"),
        queue = new sqs.Queue(stack, "Queue"),
        topic = new sns.Topic(stack, "Topic"),
        bucket = new s3.Bucket(stack, "Bucket"),
        assembly = await app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    await expect(Promise.all([factory(), page.evaluate(factory)])).resolves.toEvaluateWithoutExceptions(
      ([pageTemplate, nodeTemplate]) => {
        expect(pageTemplate).toMatchObject(nodeTemplate);
      }
    );
  });

  it("should be able to synthesize a stack with CfnInclude", async () => {
    const factory = async () => {
      const fs = CDK.require("fs");
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
      const cdk = CDK.require("aws-cdk-lib");
      const cfnInc = CDK.require("aws-cdk-lib/cloudformation-include");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "Stack");
      new cfnInc.CfnInclude(stack, "Template", {
        templateFile: "/tmp/input.yaml",
      });
      const assembly = await app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    await expect(Promise.all([factory(), page.evaluate(factory)])).resolves.toEvaluateWithoutExceptions(
      ([pageTemplate, nodeTemplate]) => {
        expect(pageTemplate).toMatchObject(nodeTemplate);
      }
    );
  });

  it("should be able to synthesize a basic stack with PseudoCli", async () => {
    const nodeFactory = () => {
      const cdk = require("aws-cdk-lib");
      const cfn = require("aws-cdk-lib/aws-cloudformation");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
      new cfn.CfnWaitConditionHandle(stack, "NullResource");
      const assembly = app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const pageFactory = () => {
      const cdk = CDK.require("aws-cdk-lib");
      const cfn = CDK.require("aws-cdk-lib/aws-cloudformation");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
      new cfn.CfnWaitConditionHandle(stack, "NullResource");
      const cli = new CDK.PseudoCli({ stack });
      return cli.synth();
    };
    await expect(
      Promise.all([Promise.resolve(nodeFactory()), page.evaluate(pageFactory)])
    ).resolves.toEvaluateWithoutExceptions(([pageTemplate, nodeTemplate]) => {
      expect(pageTemplate).toMatchObject(nodeTemplate);
    });
  });

  it("should be able to deploy and destroy a basic stack with PseudoCli", async () => {
    const factory = async (accessKeyId, secretAccessKey, sessionToken = undefined) => {
      const tic = Date.now();
      const cdk = CDK.require("aws-cdk-lib");
      const cfn = CDK.require("aws-cdk-lib/aws-cloudformation");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
      new cfn.CfnWaitConditionHandle(stack, "NullResource");
      const cli = new CDK.PseudoCli({ stack, credentials: { accessKeyId, secretAccessKey, sessionToken } });
      console.log(" >> DEPLOYING...");
      const deployResult = await cli.deploy();
      console.log(" >> WAITING...");
      await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
      console.log(" >> DESTROYING...");
      await cli.destroy();
      const toc = Date.now();
      const took = toc - tic;
      console.log(` >> TOOK: ${took}ms`);
      return { deployResult, took };
    };
    await expect(
      process.env.AWS_SESSION_TOKEN
        ? page.evaluate(
            factory,
            process.env.AWS_ACCESS_KEY_ID,
            process.env.AWS_SECRET_ACCESS_KEY,
            process.env.AWS_SESSION_TOKEN
          )
        : page.evaluate(factory, process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY)
    ).resolves.toEvaluateWithoutExceptions(({ deployResult, took }) => {
      expect(deployResult).toBeDefined();
      expect(deployResult.noOp).toBe(false);
      expect(deployResult.stackArn).toMatch(/arn:aws:cloudformation:.*/);
      expect(took).toBeGreaterThan(1000);
    });
  });

  it("should support async constructs with a 'compose' method", async () => {
    const factory = async () => {
      const constructs = CDK.require("constructs");
      const cdk = CDK.require("aws-cdk-lib");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "BrowserStack");
      let test = false;
      class AsyncConstruct extends constructs.Construct {
        static async Compose() {
          await new Promise((resolve) => setTimeout(resolve, 100));
          test = true;
        }
      }
      new AsyncConstruct(stack, "AsyncConstruct");
      await app.synth();
      return test;
    };
    await expect(page.evaluate(factory)).resolves.toEvaluateWithoutExceptions((result) => {
      expect(result).toEqual(true);
    });
  });

  it("should support async constructs with a sync 'compose' method", async () => {
    const factory = async () => {
      const constructs = CDK.require("constructs");
      const cdk = CDK.require("aws-cdk-lib");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "BrowserStack");
      let test = false;
      class AsyncConstruct extends constructs.Construct {
        static Compose() {
          test = true;
        }
      }
      new AsyncConstruct(stack, "AsyncConstruct");
      await app.synth();
      return test;
    };
    await expect(page.evaluate(factory)).resolves.toEvaluateWithoutExceptions((result) => {
      expect(result).toEqual(true);
    });
  });

  it("should be able to execute diff over two iterations of the same stack", async () => {
    async function factory(change = false) {
      change || CDK.free();
      change || CDK.init();
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
    await expect(page.evaluate(factory, 0)).resolves.toBeUndefined();
    await expect(page.evaluate(factory, 1)).rejects.toThrow(/evaluation failed/gi);
  });

  it("should only touch '/cdk', '/tmp', and '/cdk.out' in memory", async () => {
    async function factory() {
      const cdk = CDK.require("aws-cdk-lib");
      const ec2 = CDK.require("aws-cdk-lib/aws-ec2");
      const sqs = CDK.require("aws-cdk-lib/aws-sqs");
      const sns = CDK.require("aws-cdk-lib/aws-sns");
      const s3 = CDK.require("aws-cdk-lib/aws-s3");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "BrowserStack");
      new ec2.Vpc(stack, "VPC");
      new sqs.Queue(stack, "Queue");
      const cli = new CDK.PseudoCli({ stack });
      await cli.synth();
    }

    await expect(
      page.evaluate(async () => {
        CDK.free();
        const fs = CDK.require("fs"); // calls init() internally
        const dirs = ["/cdk.out", "/tmp"];
        for (const dir of dirs) if (fs.readdirSync(dir).length !== 0) throw Error(`${dir} is not empty`);
      })
    ).resolves.toBeUndefined();
    await expect(page.evaluate(factory)).resolves.toBeUndefined();
    await expect(
      page.evaluate(async () => {
        const vol = CDK.require("fs").vol.toJSON();
        const dirs = ["/cdk", "/cdk.out", "/tmp"];
        const files = Object.keys(vol);
        if (files.length < dirs.length && files.some((file) => !dirs.some((dir) => file.startsWith(dir))))
          throw Error(JSON.stringify(files));
        CDK.free();
      })
    ).resolves.toBeUndefined();
  });

  it("should be able to capture logs with the logger object", async () => {
    async function factory() {
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
        CDK.logger.once("console.log", (msg) => {
          if (msg === "There were no differences") resolve();
          else reject(`bad log: ${msg}`);
        });
        cli.diff();
      }).finally(() => {
        CDK.logger.removeAllListeners("console.log");
      });
    }
    await expect(page.evaluate(factory, 0)).resolves.toBeUndefined();
  });
});
