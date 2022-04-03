# development

notes below might be of interest if you are trying to either fix something in the core framework or trying to write a
consumer app or even a cdk web custom construct.

## debugging the core framework

if you encounter errors emitted inside `cdk-web.js`, it might be time to build the core framework in debug mode and
trying to fix cdk web itself. to do so, after you `npm install`, run:

```bash
npm run dev:framework
```

this fires up `webpack-dev-server` and any changes to `index.generated.js` or any other bundled files
causes an automatic recompile and you can open up `dist/index.html` in a browser and just refresh after recompile.

## debugging the playground app

if you are trying to work on the playground app or see an example of a sample integration into a react app, you can run
the same setup pretty much. run `npm install && npm run build` and then:

```bash
npm run dev:playground
```

## creating web-compatible constructs

following methods come to mind when developing web-compatible cdk constructs:

1. you can `npm install --save-dev cdk-web` and then write your constructs against it like you would normally do and
   replace all `require("aws-cdk-lib/*")`, `require("constructs")`, `require("fs")`, and `require("path")` imports
   with `CDK.require` where `CDK` is `require("cdk-web")`;

1. you can write your construct against native cdk and use a build tool such as `esbuild` or `webpack` and have your
   sources to use `cdk-web` as [alias](https://v4.webpack.js.org/configuration/resolve/#resolvealias) to `aws-cdk-lib`.
   `constructs`, `path`, and `fs` must be aliased too IFF you use them directly in your construct.

you can write tests for both methods with [jest-puppeteer](https://jestjs.io/docs/puppeteer) and running your code in
browser. just like tests in this repo. switch puppeteer to windowed mode and you have access to breakpoints as well.
