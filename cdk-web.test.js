/// <reference path="./index.d.ts" />

const express = require("express");
const path = require("path");
const chai = require("chai");
const app = express();
const { __ROOT } = require("./webpack/common");

/** @type {typeof window.CDK} */
const CDK = { require }; // simulate in node
app.use(express.static(path.resolve(__ROOT, "dist")));
chai.use(require("chai-as-promised"));

describe("cdk-web tests", () => {
  let server;
  let hostUrl;
  beforeAll(async () => {
    console.log(`launching the test server on a random port`);
    await new Promise((resolve) => {
      server = app.listen(() => resolve());
      hostUrl = `http://localhost:${server.address().port}/`;
      console.log(`test server launched: ${hostUrl}`);
    });
  });

  afterAll(async () => {
    console.log(`shutting down the test server`);
    server.close();
  });

  beforeEach(async () => {
    await page.goto(hostUrl);
    await page.reload();
  });

  it("should pass a basic truthy sanity test (node)", async () => {
    await chai.assert.isFulfilled(Promise.resolve());
  });

  it("should pass a basic sanity test in browser (puppeteer)", async () => {
    const title = await chai.assert.isFulfilled(page.title());
    chai.assert.isString(title);
    chai.assert.equal(title, "cdk-web");
  });

  it("should be able to synthesize a basic stack", async () => {
    const factory = async () => {
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
      assembly = await app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const [pageTemplate, nodeTemplate] = await chai.assert.isFulfilled(
      Promise.all([factory(), page.evaluate(factory)])
    );
    chai.assert.deepEqual(pageTemplate, nodeTemplate);
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
    const [pageTemplate, nodeTemplate] = await chai.assert.isFulfilled(
      Promise.all([factory(), page.evaluate(factory)])
    );
    chai.assert.deepEqual(pageTemplate, nodeTemplate);
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
    const [pageTemplate, nodeTemplate] = await chai.assert.isFulfilled(
      Promise.all([Promise.resolve(nodeFactory()), page.evaluate(pageFactory)])
    );
    chai.assert.deepEqual(pageTemplate, nodeTemplate);
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
    const { deployResult, took } = await chai.assert.isFulfilled(
      process.env.AWS_SESSION_TOKEN
        ? page.evaluate(
            factory,
            process.env.AWS_ACCESS_KEY_ID,
            process.env.AWS_SECRET_ACCESS_KEY,
            process.env.AWS_SESSION_TOKEN
          )
        : page.evaluate(factory, process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY)
    );
    chai.assert.isObject(deployResult);
    chai.assert.isNotEmpty(deployResult);
    chai.assert.isFalse(deployResult.noOp);
    chai.assert.match(deployResult.stackArn, /arn:aws:cloudformation:.*/);
    chai.expect(took).to.be.greaterThan(1000);
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
    const result = await chai.assert.isFulfilled(page.evaluate(factory));
    chai.assert.isTrue(result);
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
    const result = await chai.assert.isFulfilled(page.evaluate(factory));
    chai.assert.isTrue(result);
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
    await chai.assert.isFulfilled(page.evaluate(factory, 0));
    await chai.assert.isRejected(page.evaluate(factory, 1), /evaluation failed/gi);
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

    await chai.assert.isFulfilled(
      page.evaluate(async () => {
        CDK.free();
        const fs = CDK.require("fs"); // calls init() internally
        const dirs = ["/cdk.out", "/tmp"];
        for (const dir of dirs) if (fs.readdirSync(dir).length !== 0) throw Error(`${dir} is not empty`);
      })
    );
    await chai.assert.isFulfilled(page.evaluate(factory));
    await chai.assert.isFulfilled(
      page.evaluate(async () => {
        const vol = CDK.require("fs").vol.toJSON();
        const dirs = ["/cdk", "/cdk.out", "/tmp"];
        const files = Object.keys(vol);
        if (files.length < dirs.length && files.some((file) => !dirs.some((dir) => file.startsWith(dir))))
          throw Error(JSON.stringify(files));
        CDK.free();
      })
    );
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
    await chai.assert.isFulfilled(page.evaluate(factory));
  });

  it("should be able to render a basic stack", async () => {
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
      const html = await cli.render();
      return html;
    }
    const output = await chai.assert.isFulfilled(page.evaluate(factory));
    chai.assert.isString(output);
    chai.assert.isNotEmpty(output);
  });

  it("should be able to synthesize a stack with lambda.NodeJsFunction", async () => {
    const factory = async () => {
      const isBrowser = !!CDK.logger;
      // Some shared file we'll include in the lambda entrypoint
      const lib = "module.exports = { lib: 'some value' }";
      // An entrypoint file
      const code = `\
      const lib = require('./lib');
      module.exports = function handler(event, context) {
      console.log(event, lib);
      }`;
      // Sample empty package.json contents
      const packageJson = {};
      // Sample empty package-lock.json file
      const packageLock = {
        name: "sample-web-nodejs-function",
        version: "1.0.0",
        lockfileVersion: 2,
        requires: true,
        packages: {},
      };

      if (isBrowser) {
        const fs = CDK.require("fs");
        fs.mkdirSync("./lambda", { recursive: true });
        fs.writeFileSync("./lambda/lib.js", lib);
        fs.writeFileSync("./lambda/index.js", code);
        fs.writeFileSync("./package-lock.json", JSON.stringify(packageLock));
        fs.writeFileSync("./package.json", JSON.stringify(packageJson));
      } else {
        throw Error("not implemented");
      }

      const cdk = CDK.require("aws-cdk-lib");
      const lambda = CDK.require("aws-cdk-lib/aws-lambda-nodejs");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "BrowserStack");
      new lambda.NodejsFunction(stack, "Lambda", { entry: "./lambda/index.js" });
      const assembly = await app.synth();
      return assembly.getStackArtifact(stack.stackName).template;
    };
    const template = await chai.assert.isFulfilled(page.evaluate(factory));
    chai.assert.isObject(template);
    chai.assert.isNotEmpty(template);
    chai.assert.isObject(template.Resources);
    chai.assert.isNotEmpty(template.Resources);
  });
});
