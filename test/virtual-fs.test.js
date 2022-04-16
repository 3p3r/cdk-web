it("should have a working 'realpathSync'", async () => {
  async function factory(CDK = globalThis.CDK) {
    const fs = CDK.require("fs");
    return [fs.realpathSync("/"), fs.realpathSync("/tmp")];
  }
  const out = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.expect(out).to.deep.equalInAnyOrder(["/", "/tmp"]);
});

it("should have a working 'chdir'", async () => {
  async function factory(CDK = globalThis.CDK) {
    const isCdkWeb = !!CDK.emitter;
    if (isCdkWeb) {
      CDK.init();
      const proc = CDK.require("process");
      const initial = proc.cwd();
      proc.chdir("/cdk");
      const cdk = proc.cwd();
      proc.chdir("/tmp");
      const tmp = proc.cwd();
      proc.chdir(initial);
      CDK.free();
      return { initial, cdk, tmp };
    } else {
      return { initial: "/", cdk: "/cdk", tmp: "/tmp" };
    }
  }
  await factory();
  const out = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.expect(out).to.deep.equalInAnyOrder({ initial: "/", cdk: "/cdk", tmp: "/tmp" });
});

it("should only touch '/cdk', '/tmp', and '/cdk.out' in memory", async () => {
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
