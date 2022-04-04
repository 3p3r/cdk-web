# cdk-web :rocket: [**DEMO**](https://3p3r.github.io/cdk-web)

:muscle: &nbsp;AWS CDK in your browser!

[![npm](https://img.shields.io/npm/v/cdk-web.svg)](https://www.npmjs.com/package/cdk-web)&nbsp;
[![vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/cdk-web)](https://security.snyk.io/vuln/npm/?search=cdk-web)&nbsp;
[![continuos integration](https://github.com/3p3r/cdk-web/actions/workflows/ci.yml/badge.svg)](https://github.com/3p3r/cdk-web/actions)&nbsp;
[![downloads](https://img.shields.io/npm/dt/cdk-web.svg?label=cdk-web)](https://www.npmjs.com/package/cdk-web)&nbsp;![+](https://img.shields.io/badge/-%2B-blueviolet)&nbsp;[![downloads](https://img.shields.io/npm/dt/aws-cdk-web.svg?label=aws-cdk-web)](https://www.npmjs.com/package/aws-cdk-web)&nbsp;
[![types](https://img.shields.io/npm/types/cdk-web)](https://github.com/3p3r/cdk-web/blob/main/docs/types.md)&nbsp;

> [cdk-web](https://www.npmjs.com/package/cdk-web) and [aws-cdk-web](https://www.npmjs.com/package/aws-cdk-web) are functionally identical packages on `npm`. read about the differences [below](#cdk-web-vs-aws-cdk-web).

## index

| [usage](#usage) | [docs](#documentation) | [building](#building) | [testing](#testing) | [types](#types) |
| --------------- | ---------------------- | --------------------- | ------------------- | --------------- |

## usage

you need to load [`aws-sdk` v2](https://www.npmjs.com/package/aws-sdk) and `cdk-web` somewhere in your HTML:

### via `npm`

```bash
npm install --save cdk-web aws-sdk
```

### via `unpkg`

```HTML
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js"></script>
<script src="https://unpkg.com/cdk-web"></script>
```

### via `jsdelivr`

```HTML
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.1000.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cdk-web@latest/dist/cdk-web.min.js"></script>
```

then a global `CDK` variable is exposed in your web browser.
start writing CDK apps like you would normally do in NodeJS:

```JS
const cdk = CDK.require("aws-cdk-lib");
const ec2 = CDK.require("aws-cdk-lib/aws-ec2");
const sqs = CDK.require("aws-cdk-lib/aws-sqs");
const sns = CDK.require("aws-cdk-lib/aws-sns");
const s3 = CDK.require("aws-cdk-lib/aws-s3");
const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");
const vpc = new ec2.Vpc(stack, "VPC");
const queue = new sqs.Queue(stack, "Queue");
const topic = new sns.Topic(stack, "Topic");
const bucket = new s3.Bucket(stack, "Bucket");
const assembly = await app.synth();
console.log(assembly);
```

you just replace all calls to `require` for cdk with `CDK.require`.
output of `app.synth()` contains all you need to get your generated stack.

## documentation

documentation on various topics from bootstrapping, cli, asynchronous constructs and other subjects are located under
[docs/](docs/README.md).

## building

executing `npm run build` builds CDK for web. everything is bundled in `dist/cdk-web.js`.
you may open up `dist/index.html` in your browser if you want to just play with the compiled bundle.
you can build a dev bundle verbosely with `DEBUG='CdkWeb*'` and `CDK_WEB_DEBUG=1` environment variables set.

check out [docs/development.md](docs/development.md) if you are trying to use this in development.

## testing

testing is done by Puppeteer. the actual generated bundle is loaded into Puppeteer and tests are executed against it.
run `npm test` to execute them.

## types

`cdk-web` ships with a single `.d.ts` file that gives you the same typings as the native cdk. to get it to work, check
out [docs/types.md](docs/types.md). typings for `aws-cdk-lib` and `constructs` are all bundled.

## `cdk-web` vs `aws-cdk-web`

The two packages are identical, mirrored, and released to at the same time. You may use [the other mirror](https://www.npmjs.com/package/aws-cdk-web) if you are behind a corporate proxy and your NPM packages go through a third-party repository such as Artifactory. The mirror does not list any packages as dependencies in its package.json (neither dev, nor prod). This prevents `cdk-web` to be incorrectly flagged as vulnerable due to its outdated devDependencies. `cdk-web` is a compiled project. Its compiler and toolchain being outdated does not impact its runtime. It's all client side JavaScript anyway. The mirror is only provided for your convenience.
