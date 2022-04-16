# cdk logs and console redirection

cdk-web captures all logs emitted from cdk into an [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter).
you can use this object to access all logs from the main library like so:

```JS
const CDK = require("cdk-web")
CDK.emitter.on('console.log', message => {
  // do something with the logs emitted
});
```

wildcard subscription to all events is also possible thanks to [EventEmitter2](https://github.com/EventEmitter2/EventEmitter2).
take a look at their official API. `CDK.emitter` is an instance of `EventEmitter2`.

all the captured logs are also redirected to [debug](https://www.npmjs.com/package/debug). if you want to see cdk logs
in your browser dev console, you need to have `localStorage.debug = 'CdkWeb*'` somewhere.

to see logs from all packages using debug, you need `localStorage.debug = '*'`.

for example, you can execute these in Chrome's dev console once and forget about it. `localStorage` is semi permanent. refresh the page after that.

> by default you should not see anything logged in console in your browser. if you need logs, enable [debug](https://www.npmjs.com/package/debug)
