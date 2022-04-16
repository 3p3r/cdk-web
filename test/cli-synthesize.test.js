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
  const pageFactory = (CDK = globalThis.CDK) => {
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
