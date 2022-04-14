it("should be able to deploy and destroy a basic stack with PseudoCli", async () => {
  const factory = async (accessKeyId, secretAccessKey, sessionToken = undefined, CDK = globalThis.CDK) => {
    const tic = Date.now();
    const cdk = CDK.require("aws-cdk-lib");
    const cfn = CDK.require("aws-cdk-lib/aws-cloudformation");
    const app = new cdk.App();
    const stack = new cdk.Stack(app, `CdkWebTestStack${Date.now()}`);
    new cfn.CfnWaitConditionHandle(stack, "NullResource");
    const cli = new CDK.PseudoCli({ stack, credentials: { accessKeyId, secretAccessKey, sessionToken } });
    const deployResult = await cli.deploy();
    await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    await cli.destroy();
    const toc = Date.now();
    const took = toc - tic;
    return { deployResult, took };
  };
  const { deployResult, took } = await chai.assert.isFulfilled(
    page.evaluate(
      factory,
      process.env.AWS_ACCESS_KEY_ID,
      process.env.AWS_SECRET_ACCESS_KEY,
      process.env.AWS_SESSION_TOKEN
    )
  );
  chai.assert.isObject(deployResult);
  chai.assert.isNotEmpty(deployResult);
  chai.assert.isFalse(deployResult.noOp);
  chai.assert.match(deployResult.stackArn, /arn:aws:cloudformation:.*/);
  chai.expect(took).to.be.greaterThan(1000);
});
