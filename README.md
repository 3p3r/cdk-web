# cdk-web

AWS CDK in your browser! (experimental)

## usage

load `cdk-web.js` into your HTML file and start writing CDK apps like you would normally do in Node:

```JS
const cdk = require("aws-cdk-lib");
const { aws_ec2: ec2, aws_sqs: sqs, aws_sns: sns, aws_s3: s3 } = cdk;
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

executing `npm run build` builds CDK for web. everything is bundled in `dist/cdk-web.js`;

## reference

a global `require` function is exposed that can resolve the following modules in a browser environment:

- `aws-cdk-lib`: code CDK library
- `constructs`: the AWS constructs library
- `fs`: in-memory and in-browser file system API

after you call `app.synth()` you can investigate what normally goes into your `cdk.out` by calling `require('fs').vol.toJSON()` which returns everything on "disk" within your browser.

## known issues

- scoped `require`ing CDK does not work (e.g. `require("aws-cdk-lib/aws-sqs")`)
  - workaround: use `const { aws_sqs: sqs } = require("aws-cdk-lib")` syntax instead.
- CLI commands (`cdk synth`, `cdk deploy`, etc.) are not offered (yet)
- nothing from the `aws-cdk` npm package is available
- anything that has to do with CDK Assets is not supported
- anything that has to do with CDK Context is not supported
