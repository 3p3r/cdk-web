it("should not throw on an already bootstrapped account", async function () {
  function shouldRun() {
    return process.env.AWS_ACCESS_KEY_ID !== undefined && process.env.AWS_SECRET_ACCESS_KEY !== undefined;
  }

  if (shouldRun()) {
    const factory = async (accessKeyId, secretAccessKey, sessionToken = undefined, CDK = globalThis.CDK) => {
      const cdk = CDK.require("aws-cdk-lib");
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "TestWebBootstrapStack");
      const cli = new CDK.PseudoCli({ stack, credentials: { accessKeyId, secretAccessKey, sessionToken } });
      await cli.bootstrap();
    };
    await chai.assert.isFulfilled(
      page.evaluate(
        factory,
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
        process.env.AWS_SESSION_TOKEN
      )
    );
  } else {
    this.skip();
  }
});
