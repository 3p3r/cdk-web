it("should have a working virtual filesystem after CDK.require", async () => {
  async function factory(CDK = globalThis.CDK) {
    CDK.free();
    CDK.require("aws-cdk-lib");
    return CDK.dump();
  }
  const out = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.assert.isObject(out);
  chai.assert.isNotEmpty(out);
  chai.expect(out).to.include.keys("/tmp", "/cdk/cdk.json");
});
