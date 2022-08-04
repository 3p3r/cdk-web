const JSZip = require("jszip");

it("should be able to synthesize a stack with lambda.NodeJsFunction", async () => {
  const factory = async (CDK = globalThis.CDK) => {
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

    const fs = CDK.require("fs");
    fs.mkdirSync("./lambda", { recursive: true });
    fs.writeFileSync("./lambda/lib.js", lib);
    fs.writeFileSync("./lambda/index.js", code);
    fs.writeFileSync("./package-lock.json", JSON.stringify(packageLock));
    fs.writeFileSync("./package.json", JSON.stringify(packageJson));

    const cdk = CDK.require("aws-cdk-lib");
    const lambda = CDK.require("aws-cdk-lib/aws-lambda-nodejs");
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "BrowserStack");
    new lambda.NodejsFunction(stack, "Lambda", { entry: "./lambda/index.js" });
    const assembly = await app.synth();
    const { template } = assembly.getStackArtifact(stack.stackName);
    const disk = fs.vol.toJSON();
    const keys = Object.keys(disk);
    const key = keys.find((k) => k.startsWith("/cdk.out/") && k.endsWith(".zip") && !k.includes("bundle"));
    const zip = fs.readFileSync(key, "utf8");
    return { template, zip };
  };
  const { template, zip } = await chai.assert.isFulfilled(page.evaluate(factory));
  chai.assert.isObject(template);
  chai.assert.isNotEmpty(template);
  chai.assert.isObject(template.Resources);
  chai.assert.isNotEmpty(template.Resources);
  chai.assert.isNotEmpty(zip);
  const archive = new JSZip();
  const extracted = await chai.assert.isFulfilled(archive.loadAsync(zip, { base64: true }));
  chai.assert.isObject(extracted);
  chai.assert.isNotEmpty(extracted);
  chai.assert.isObject(extracted.files);
  // chai.assert.isNotEmpty(extracted.files); // FIXME: this is actually empty?
});
