# cdk-web :rocket: [**DEMO**](https://3p3r.github.io/cdk-web)

:muscle: &nbsp;AWS CDK in your browser!

![Dependabot](https://img.shields.io/badge/dependabot-025E8C?style=for-the-badge&logo=dependabot&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/githubactions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) ![cdk-web CI badge](https://github.com/3p3r/cdk-web/actions/workflows/ci.yml/badge.svg)

> this package is also mirrored on NPM under [aws-cdk-web](https://www.npmjs.com/package/aws-cdk-web). read about the differences [below](#cdk-web-vs-aws-cdk-web).

## table of content

- [usage](#usage)
- [pseudo cli](#bootstrapping-and-cli-functionality)
- [building](#building)
- [testing](#testing)
- [exports](#exports)
- [types](#types)
- [`cdk-web` vs `aws-cdk-web`](#cdk-web-vs-aws-cdk-web)

## usage

load [`cdk-web.js`](https://unpkg.com/cdk-web) somewhere into your HTML file:

```HTML
<script src="https://unpkg.com/cdk-web"></script>
```

and start writing CDK apps like you would normally do in Node:

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

## bootstrapping and cli functionality

if you are looking to use this against a live AWS account inside a browser, you may find these notes useful:

- [docs/bootstrap.md](docs/bootstrap.md)
- [docs/cli.md](docs/cli.md)

## building

executing `npm run build` builds CDK for web. everything is bundled in `dist/cdk-web.js`. you may open up `dist/index.html` in your browser if you want to just play with the compiled bundle.

## testing

testing is done by Puppeteer. the actual generated bundle is loaded into Puppeteer and tests are executed against it. run `npm test` to execute them.

## types

`cdk-web` ships with a single `.d.ts` file that gives you the same typings as the mainline cdk. to get it to work, check out [docs/types.md](docs/types.md).

## exports

### default behavior

a global `require` function is exposed that can resolve the following modules in a browser environment:

- `aws-cdk-lib`: core CDK library
- `aws-cdk-lib/*`: core scoped CDK modules
- `constructs`: the AWS constructs library
- `path`: node path utilities to be used with `fs`
- `fs`: in-memory and in-browser file system API

after you call `app.synth()` you can investigate what normally goes into your `cdk.out` by calling `require('fs').vol.toJSON()` which returns everything on "disk" within your browser.

### overriding behavior

you can override the default export behavior by defining `window.CDK_WEB_REQUIRE` to a string **before** loading `cdk-web.js` in your HTML. For example:

```HTML
<!DOCTYPE html>
<html>
  <body>
    <script>window.CDK_WEB_REQUIRE = "my_custom_cdk_require"</script>
    <script src="cdk-web.js"></script>
    <script>
      // window.require is now window.my_custom_cdk_require
      const cdk = my_custom_cdk_require('aws-cdk-lib');
    </script>
  </body>
</html>
```

## `cdk-web` vs `aws-cdk-web`

The two packages are identical, mirrored, and released to at the same time. You may use [the other mirror](https://www.npmjs.com/package/aws-cdk-web) if you are behind a corporate proxy and your NPM packages go through a third-party repository such as Artifactory. The mirror does not list any packages as dependencies in its package.json (neither dev, nor prod). This prevents `cdk-web` to be incorrectly flagged as vulnerable due to its outdated devDependencies. `cdk-web` is a compiled project. Its compiler and toolchain being outdated does not impact its runtime. It's all client side JavaScript anyway. The mirror is only provided for your convenience.
