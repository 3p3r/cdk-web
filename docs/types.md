# cdk types and cdk-web's `index.d.ts`

for your convenience, each cdk-web deployment package also includes a typings file (.d.ts) that allows you to have the
same auto-complete and debugging features available to the native cdk. `aws-cdk-lib`, `aws-sdk`, and `constructs` are
also bundled and automatically included when you reference the fiike .

to get types working you need to reference the type file that is shipped by `cdk-web` after `npm install`ing it.

```
/// <reference types="cdk-web" />

// this prints cdk version bundled with cdk-web
console.log(window.require.versions);

// you should have typings here
const cdk = window.require('aws-cdk-lib')
const ec2 = window.require('aws-cdk-lib/aws-ec2')
```

you also need to have the appropriate package versions installed for types to work correctly. **you just have to npm
install these packages. you do not need to use them in your code.** `cdk-web`'s typing file points to these packages
in your `node_modules` folder.

> make sure `aws-cdk-lib` and `constructs` match the version shipped with `cdk-web`. there's a "versions" object
> attached to the exported `require`-like function. example with `console.log` is shown above.

```
npm install --save aws-cdk-lib constructs aws-sdk
```
