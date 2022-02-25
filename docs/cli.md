## Classes

<dl>
<dt><a href="#PseudoCli">PseudoCli</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#PseudoCliParams">PseudoCliParams</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="PseudoCli"></a>

## PseudoCli
**Kind**: global class  

* [PseudoCli](#PseudoCli)
    * [new PseudoCli(options)](#new_PseudoCli_new)
    * [.opts](#PseudoCli+opts) : [<code>PseudoCliParams</code>](#PseudoCliParams)
    * [.synth(opts)](#PseudoCli+synth) ⇒ <code>Object</code>
    * [.deploy(opts)](#PseudoCli+deploy)
    * [.destroy(opts)](#PseudoCli+destroy)


* * *

<a name="new_PseudoCli_new"></a>

### new PseudoCli(options)
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


| Param | Type |
| --- | --- |
| options | [<code>PseudoCliParams</code>](#PseudoCliParams) | 


* * *

<a name="PseudoCli+opts"></a>

### pseudoCli.opts : [<code>PseudoCliParams</code>](#PseudoCliParams)
**Kind**: instance property of [<code>PseudoCli</code>](#PseudoCli)  

* * *

<a name="PseudoCli+synth"></a>

### pseudoCli.synth(opts) ⇒ <code>Object</code>
just like native "cdk synth". it synthesizes your stack.

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  
**Returns**: <code>Object</code> - the template JSON.  

| Param | Type |
| --- | --- |
| opts | <code>cdk.StageSynthesisOptions</code> \| <code>undefined</code> | 

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

### pseudoCli.deploy(opts)
just like native "cdk deploy". it deploys your stack to a live AWS account

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  

| Param | Type |
| --- | --- |
| opts | <code>DeployStackOptions</code> \| <code>undefined</code> | 

**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({stack, credentials: { ... }});
// just like executing "cdk deploy"
await cli.deploy();
```

* * *

<a name="PseudoCli+destroy"></a>

### pseudoCli.destroy(opts)
just like native "cdk destroy". it destroys your previously deployed stack in a live AWS account

**Kind**: instance method of [<code>PseudoCli</code>](#PseudoCli)  

| Param | Type |
| --- | --- |
| opts | <code>DestroyStackOptions</code> \| <code>undefined</code> | 

**Example**  
```JS
const PseudoCli = require("aws-cdk");
const cli = new PseudoCli({stack, credentials: { ... }});
// just like executing "cdk destroy"
await cli.destroy();
```

* * *

<a name="PseudoCliParams"></a>

## PseudoCliParams : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| stack | <code>cdk.Stack</code> | 
| credentials | <code>AWS.Credentials</code> \| <code>undefined</code> | 


* * *

