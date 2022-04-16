it("should support async constructs with a 'compose' method", async () => {
  const factory = async (CDK = globalThis.CDK) => {
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
