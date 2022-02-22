# cdk-web :rocket: [**DEMO**](https://3p3r.github.io/cdk-web)

:muscle: &nbsp;AWS CDK in your browser! (experimental)

![Dependabot](https://img.shields.io/badge/dependabot-025E8C?style=for-the-badge&logo=dependabot&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/githubactions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white) ![cdk-web CI badge](https://github.com/3p3r/cdk-web/actions/workflows/ci.yml/badge.svg)

> this package is also mirrored on NPM under [aws-cdk-web](https://www.npmjs.com/package/aws-cdk-web). read about the differences [below](#cdk-web-vs-aws-cdk-web).

## why?

- it's fun.
- you might be limited in tooling (e.g. Node is not allowed)
- you might be behind a corporate proxy and a browser is all you get reliably
- you might not have time for native tooling because you just want to deploy a damn bucket!

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

## pseudo cli reference

### Classes

<dl>
<dt><a href="#PseudoCli">PseudoCli</a></dt>
<dd><p>PseudoCli
you can simulate the functionality of the native CDK CLI by <code>require()</code>ing it via <code>require(&quot;aws-cdk&quot;)</code>.</p>
<blockquote>
<p>@note for this to work, the cdk bucket must have a respectable CORS policy attached to it.
you can change the CORS policy in [ Properties &gt; Permissions &gt; Edit CORS Configuration ].
a sample policy to wildcard-allow everything looks like this:</p>
<pre><code class="language-JSON">[
  {
    &quot;AllowedHeaders&quot;: [&quot;*&quot;],
    &quot;AllowedMethods&quot;: [&quot;HEAD&quot;,&quot;GET&quot;,&quot;POST&quot;,&quot;PUT&quot;,&quot;DELETE&quot;],
    &quot;AllowedOrigins&quot;: [&quot;*&quot;]
  }
]
</code></pre>
</blockquote>
</dd>
</dl>

### Typedefs

<dl>
<dt><a href="#PseudoCliParams">PseudoCliParams</a> : <code>Object</code></dt>
<dd><p>Parameters to create a PseudoCli with.</p>
</dd>
</dl>

<a name="PseudoCli"></a>

### PseudoCli
PseudoCli
you can simulate the functionality of the native CDK CLI by `require()`ing it via `require("aws-cdk")`.
> @note for this to work, the cdk bucket must have a respectable CORS policy attached to it.
you can change the CORS policy in [ Properties > Permissions > Edit CORS Configuration ].
a sample policy to wildcard-allow everything looks like this:
> ```JSON
> [
>   {
>     "AllowedHeaders": ["*"],
>     "AllowedMethods": ["HEAD","GET","POST","PUT","DELETE"],
>     "AllowedOrigins": ["*"]
>   }
> ]
> ```

**Kind**: global class  

* [PseudoCli](#PseudoCli)
    * [new PseudoCli(options)](#new_PseudoCli_new)
    * [.app](#PseudoCli+app) ⇒ <code>cdk.App</code>
    * [.stack](#PseudoCli+stack) ⇒ <code>cdk.Stack</code>
    * [.credentials](#PseudoCli+credentials) ⇒ <code>AWS.Credentials</code> \| <code>undefined</code>
    * [.synth()](#PseudoCli+synth) ⇒ <code>Object</code>
    * [.deploy()](#PseudoCli+deploy)
    * [.destroy()](#PseudoCli+destroy)


* * *

<a name="new_PseudoCli_new"></a>

#### new PseudoCli(options)
Providing "credentials" is optional but you won't be able to take live actions (e.g deploy and destroy)


| Param | Type |
| --- | --- |
| options | [<code>PseudoCliParams</code>](#PseudoCliParams) | 


* * *

<a name="PseudoCli+app"></a>

#### pseudoCli.app ⇒ <code>cdk.App</code>
**Kind**: instance property of [<code>PseudoCli</code>](#PseudoCli)  

* * *

<a name="PseudoCli+stack"></a>

#### pseudoCli.stack ⇒ <code>cdk.Stack</code>
**Kind**: instance property of [<code>PseudoCli</code>](#PseudoCli)  

* * *

<a name="PseudoCli+credentials"></a>

#### pseudoCli.credentials ⇒ <code>AWS.Credentials</code> \| <code>undefined</code>
**Kind**: instance property of [<code>PseudoCli</code>](#PseudoCli)  

* * *

<a name="PseudoCli+synth"></a>

#### pseudoCli.synth() ⇒ <code>Object</code>
just like native "cdk synth". it synthesizes your stack.

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**Returns**: <code>Object</code> - the template JSON.  
**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({
  stack,
  credentials: {
    accessKeyId: "your AWS access key goes here",
    secretAccessKey: "your AWS secret goes here",
    // sessionToken: "in case you have a session token",
  },
});
// just like executing "cdk synth"
const template = cli.synth();
console.log(template);
```

* * *

<a name="PseudoCli+deploy"></a>

#### pseudoCli.deploy()
just like native "cdk deploy". it deploys your stack to a live AWS account

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({stack, credentials: { ... }});
// just like executing "cdk deploy"
await cli.deploy();
```

* * *

<a name="PseudoCli+destroy"></a>

#### pseudoCli.destroy()
just like native "cdk destroy". it destroys your previously deployed stack in a live AWS account

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({stack, credentials: { ... }});
// just like executing "cdk destroy"
await cli.destroy();
```

* * *

<a name="PseudoCliParams"></a>

### PseudoCliParams : <code>Object</code>
Parameters to create a PseudoCli with.

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| stack | <code>cdk.Stack</code> | 
| credentials | <code>AWS.Credentials</code> \| <code>undefined</code> | 


* * *

## build

executing `npm run build` builds CDK for web. everything is bundled in `dist/cdk-web.js`. you may open up `dist/index.html` in your browser if you want to just play with the compiled bundle.

## testing

testing is done by Puppeteer. the actual generated bundle is loaded into Puppeteer and tests are executed against it. run `npm test` to execute them.

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
