## Classes

<dl>
<dt><a href="#PseudoCli">PseudoCli</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#DeployStackResult">DeployStackResult</a> : <code>Object</code></dt>
<dd><p>see <a href="https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts">native-cdk</a>
for full reference for this interface (look for <code>DeployStackResult</code> interface in <code>aws-cdk</code>)</p>
</dd>
<dt><a href="#PseudoCliOptions">PseudoCliOptions</a> : <code>Object</code></dt>
<dd><p>parameters to create a cdk-web pseudo cli</p>
</dd>
<dt><a href="#BootstrapWebEnvironmentOptions">BootstrapWebEnvironmentOptions</a> : <code>Object</code></dt>
<dd><p>parameters to bootstrap an AWS account for cdk-web</p>
</dd>
</dl>

<a name="PseudoCli"></a>

## PseudoCli
**Kind**: global class  

* [PseudoCli](#PseudoCli)
    * [new PseudoCli(opts)](#new_PseudoCli_new)
    * [.synth(opts)](#PseudoCli+synth) ⇒ <code>Object</code>
    * [.bootstrap(opts)](#PseudoCli+bootstrap) ⇒ [<code>Promise.&lt;DeployStackResult&gt;</code>](#DeployStackResult)
    * [.deploy(opts)](#PseudoCli+deploy) ⇒ [<code>Promise.&lt;DeployStackResult&gt;</code>](#DeployStackResult)
    * [.destroy(opts)](#PseudoCli+destroy) ⇒ <code>Promise.&lt;void&gt;</code>


* * *

<a name="new_PseudoCli_new"></a>

### new PseudoCli(opts)
> **NOTE 1:** for this to work, the cdk bucket must have a respectable CORS policy attached to it.
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

> **NOTE 2:** Providing "credentials" is optional but you won't be able to take live actions (e.g deploy and destroy)


| Param | Type | Description |
| --- | --- | --- |
| opts | [<code>PseudoCliOptions</code>](#PseudoCliOptions) \| <code>undefined</code> | options for cdk-web's pseudo cli |


* * *

<a name="PseudoCli+synth"></a>

### pseudoCli.synth(opts) ⇒ <code>Object</code>
just like native "cdk synth". it synthesizes your stack.

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**Returns**: <code>Object</code> - the cloudformation template JSON.  
**See**: [native-cdk](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.StageSynthesisOptions.html)
for additional parameters acceptable for this object (look for `StageSynthesisOptions` interface in `aws-cdk`)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>cdk.StageSynthesisOptions</code> \| <code>undefined</code> | options for stack synthage |

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

<a name="PseudoCli+bootstrap"></a>

### pseudoCli.bootstrap(opts) ⇒ [<code>Promise.&lt;DeployStackResult&gt;</code>](#DeployStackResult)
bootstraps a live AWS account and takes "special care" for cdk-web

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  

| Param | Type | Description |
| --- | --- | --- |
| opts | [<code>BootstrapWebEnvironmentOptions</code>](#BootstrapWebEnvironmentOptions) \| <code>undefined</code> | options for bootstrapage |


* * *

<a name="PseudoCli+deploy"></a>

### pseudoCli.deploy(opts) ⇒ [<code>Promise.&lt;DeployStackResult&gt;</code>](#DeployStackResult)
just like native "cdk deploy". it deploys your stack to a live AWS account

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**See**: [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
for additional parameters acceptable for this object (look for `DeployStackOptions` interface in `aws-cdk`)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>DeployStackOptions</code> \| <code>undefined</code> | options for stack deployage |

**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({stack, credentials: { ... }});
// just like executing "cdk deploy"
await cli.deploy();
```

* * *

<a name="PseudoCli+destroy"></a>

### pseudoCli.destroy(opts) ⇒ <code>Promise.&lt;void&gt;</code>
just like native "cdk destroy". it destroys your previously deployed stack in a live AWS account

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**See**: [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
for additional parameters acceptable for this object (look for `DestroyStackOptions` interface in `aws-cdk`)  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>DestroyStackOptions</code> \| <code>undefined</code> | options for stack destroyage |

**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({stack, credentials: { ... }});
// just like executing "cdk destroy"
await cli.destroy();
```

* * *

<a name="DeployStackResult"></a>

## DeployStackResult : <code>Object</code>
see [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/deploy-stack.ts)
for full reference for this interface (look for `DeployStackResult` interface in `aws-cdk`)

**Kind**: global typedef  

* * *

<a name="PseudoCliOptions"></a>

## PseudoCliOptions : <code>Object</code>
parameters to create a cdk-web pseudo cli

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| stack | <code>cdk.Stack</code> \| <code>undefined</code> | stack is optional for bootstrapping |
| credentials | <code>AWS.Credentials</code> \| <code>undefined</code> | credentials is optional for synthesizing |


* * *

<a name="BootstrapWebEnvironmentOptions"></a>

## BootstrapWebEnvironmentOptions : <code>Object</code>
parameters to bootstrap an AWS account for cdk-web

**Kind**: global typedef  
**See**: [native-cdk](https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/lib/api/bootstrap/bootstrap-props.ts)
for additional parameters acceptable for this object (look for `BootstrapEnvironmentOptions` interface in `aws-cdk`)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| account | <code>string</code> \| <code>undefined</code> | <code>&quot;account-bound-to-credentials&quot;</code> | the AWS account to be bootstrapped (no-op if already done) |
| region | <code>string</code> \| <code>undefined</code> | <code>&quot;us-east-1&quot;</code> | the AWS region in your account to be bootstrapped |
| cors | <code>Object</code> \| <code>undefined</code> | <code>[{&quot;AllowedHeaders&quot;:[&quot;*&quot;],&quot;AllowedMethods&quot;:[&quot;HEAD&quot;,&quot;GET&quot;,&quot;POST&quot;,&quot;PUT&quot;,&quot;DELETE&quot;],&quot;AllowedOrigins&quot;:[&quot;*&quot;]}</code> | CORS policy on the CDK assets bucket. this is needed for cdk-web to work correctly in browser. native cdk does not require this. |


* * *

