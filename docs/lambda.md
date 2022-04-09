# Lambda Functions

AWS lambda functions in cdk have been patched in order to support web bundling and assets. In order to create a lambda function in CDK web you must use the [included filesystem](./fs.md) and [async synth/deploy](./async.md) methods.

## Supported Lambda Constructs

- aws-cdk-lib/aws-lambda
- aws-cdk-lib/aws-lambda-nodejs

## Example Nodejs Lambda

```JS
// AWS CDK sample stack
const fs = CDK.require("fs");
const cdk = CDK.require("aws-cdk-lib");
const { NodejsFunction } = CDK.require("aws-cdk-lib/aws-lambda-nodejs");
const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");

// Some shared file we'll include in the lambda entrypoint
const lib = `\
const lib = 'some value';
module.exports = {
  lib,
}
`;
// An entrypoint file
const code = `\
const lib = require('./lib');
module.exports = function handler(event, context) {
console.log(event, lib);
}
`;
// Sample empty package.json contents
const packageJson = {};
// Sample empty package-lock.json file
const packageLock = {
  name: "sample-web-construct",
  version: "1.0.0",
  lockfileVersion: 2,
  requires: true,
  packages: {},
};
// Write all the files
fs.mkdirSync("./lambda", { recursive: true });
fs.writeFileSync("./lambda/lib.js", lib);
fs.writeFileSync("./lambda/index.js", code);
fs.writeFileSync("./package-lock.json", JSON.stringify(packageLock));
fs.writeFileSync("./package.json", JSON.stringify(packageJson));

(async () => {
  new NodejsFunction(stack, "Lambda", {
    entry: "./lambda/index.js",
  });
  const assembly = await app.synth();
  console.log(assembly.getStackArtifact("BrowserStack").template);
})();
```
