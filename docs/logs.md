# cdk logs and console redirection

cdk-web captures all logs emitted from cdk into an [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter).
you can use this object to access all logs from the main library like so:

```JS
const CDK = require("cdk-web")
CDK.emitter.on('console', message => {
  // do something with the logs emitted
});
CDK.emitter.on('stderr', message => {
  // do something with the logs emitted
});
CDK.emitter.on('stdout', message => {
  // do something with the logs emitted
});
```

wildcard subscription to all events is also possible thanks to [EventEmitter2](https://github.com/EventEmitter2/EventEmitter2).
take a look at their official API. `CDK.emitter` is an instance of `EventEmitter2`.

> by default you should not see anything logged in console in your browser. if you do see logs, please open up an issue.

Stderr and stderr may contain stream chunks that need to be reconstituted. A simple example would be waiting for newline characters to log.

```JS
let line = "";
CDK.emitter.on("stderr", (message) => {
  if (message instanceof Uint8Array) {
    const decoded = new TextDecoder().decode(message);
    line += decoded;
    if (decoded.match(/\n/)) {
      console.log(line);
      line = "";
    }
    return;
  }
  console.log(message);
});
```
