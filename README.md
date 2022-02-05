# cdk-web

![cdk-web CI badge](https://github.com/3p3r/cdk-web/actions/workflows/ci.yml/badge.svg)

AWS CDK in your browser! (experimental)

## usage

load `cdk-web.js` into your HTML file and start writing CDK apps like you would normally do in Node:

```JS
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const sqs = require("aws-cdk-lib/aws-sqs");
const sns = require("aws-cdk-lib/aws-sns");
const s3 = require("aws-cdk-lib/aws-s3");
const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");
const vpc = new ec2.Vpc(stack, "VPC");
const queue = new sqs.Queue(stack, "Queue");
const topic = new sns.Topic(stack, "Topic");
const bucket = new s3.Bucket(stack, "Bucket");
const assembly = app.synth();
console.log(assembly);
```

output of `app.synth()` contains all you need to get your generated stack.

## build

executing `npm run build` builds CDK for web. everything is bundled in `dist/cdk-web.js`. you may open up `dist/index.html` in your browser if you want to just play with the compiled bundle.

## testing

testing is done by Puppeteer. the actual generated bundle is loaded into Puppeteer and tests are executed against it. run `npm test` to execute them.

## exports

a global `require` function is exposed that can resolve the following modules in a browser environment:

- `aws-cdk-lib`: core CDK library
- `aws-cdk-lib/*`: core scoped CDK modules
- `constructs`: the AWS constructs library
- `path`: node path utilities to be used with `fs`
- `fs`: in-memory and in-browser file system API

after you call `app.synth()` you can investigate what normally goes into your `cdk.out` by calling `require('fs').vol.toJSON()` which returns everything on "disk" within your browser.

## known issues

- CDK Bootstrap is not available
  - Complicated stacks that require a context and a CDK Bootstrap stack most likely will not work
  - _Workaround_: This tool is not for managing complicated stacks :) use the native CDK instead
- Nothing from the `aws-cdk` npm package (CDK CLI) is available
  - CLI commands (`cdk synth`, `cdk deploy`, etc.) are not offered
  - _Workaround_: You can use the AWS SDK in your browser to implement the same functionality
- Anything that has to do with CDK Assets is not supported
  - Limited support for CDK Assets might be added later
  - Obviously anything that has to do with shelling (e.g. Docker, Lambda Bundles, etc.) does not work natively in browser
  - _Workaround_: Use the combination of AWS SDK and memfs to handle simple assets in browser
- Anything that has to do with CDK Context is not supported
  - Context by itself technically works and writes in your browser's localStorage
  - Constructs that use Context (e.g. AMI Lookup) most likely will not work
  - _Workaround_: You can use the AWS SDK in your browser to implement the same functionality
- Found a new one? Open up a GitHub issue.
