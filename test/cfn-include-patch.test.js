it("should be able to synthesize a stack with CfnInclude", async () => {
  const factory = async (CDK = globalThis.CDK) => {
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
  const [pageTemplate, nodeTemplate] = await chai.assert.isFulfilled(Promise.all([factory(), page.evaluate(factory)]));
  chai.assert.deepEqual(pageTemplate, nodeTemplate);
});
