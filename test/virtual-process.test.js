it("should have a working 'listenerCount'", async () => {
  async function factory(CDK = globalThis.CDK) {
    const proc = CDK.require("process");
    return proc.listenerCount("random");
  }
  const out = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.assert.isNumber(out);
  chai.assert.equal(out, 0);
});
