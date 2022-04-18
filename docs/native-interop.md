# native cdk compatibility

cdk-web can be used in places to interop with native cdk libraries and apps. one thing to keep in mind is that, when
used in these scenarios, version of the constructs package should match across. it's fairly fault tolerant if they do
not match but be aware! you are mixing interfaces that were never meant to be mixed. but what would be the point of JS?

```JS
const CDK = require("cdk-web");
CDK.init({ requireHook: true }); // enable global require hook
```

this snippet when executed, enables the compatibility layer and hooks into node's `require` and attempts to map all your
cdk related imports back to cdk-web internal in-memory mapped modules. that also includes `fs`, `path`, and `process`.
it enables compatibility with `aws-cdk-lib`, `monocdk`, and best effort `cdk v1`.

> this needs to be executed before your actual native cdk code. it does not work if native cdk is already `require`d.

with this compatibility mode on, you can leave the rest of your application untouched. here is an example of using an
external native cdk construct with cdk-web after the above patch is applied:

```JS
// npm i --save cdk-web aws-sdk
const CDK = require("cdk-web");
CDK.init({ requireHook: true }); // enable global require hook

// ....
// after this call and down, all native cdk related imports will go through cdk-web
// ....

// rest of your cdk app untouched
const cdk = require("aws-cdk-lib");
const app = new cdk.App();
const stack = new cdk.Stack(app, "BrowserStack");
// npm i --save cdk-monitoring-constructs
const Monitoring = require("cdk-monitoring-constructs");

new Monitoring.MonitoringScope(stack, "MonitoringScope");
new Monitoring.DefaultDashboardFactory(stack, "DefaultDashboardFactory", {
  createAlarmDashboard: true,
  createDashboard: true,
  createSummaryDashboard: true,
  dashboardNamePrefix: "CdkWeb",
  renderingPreference: "none",
});
new Monitoring.MonitoringFacade(stack, "MonitoringFacade", {
  alarmFactoryDefaults: {
    actionsEnabled: true,
    alarmNamePrefix: "prefix",
  },
  metricFactoryDefaults: {
    namespace: "test",
  },
});

const assembly = app.synth();
const { template } = assembly.getStackByName(stack.stackName);
console.log(template);
```

you will not be able to use the native aws cli with this. but the cdk-web cli api is available.
access to node's original require function is available through:

```JS
const Module = require("module");
Module.prototype.nodeRequire // <-- original node require prior to hooking
```