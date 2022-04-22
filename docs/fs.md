# `CDK.require('fs')`

cdk-web uses an [in-memory filesystem](https://github.com/streamich/memfs) to simulate a hard disk cdk would usually use.

this module implements a subset of Node's fs API. you can use this to inspect what cdk-web is doing to "disk".

you can access it by `CDK.require('fs')`. most \*Sync methods are available.

`CDK.require('path')` and `CDK.require('process')` are also available as Node core's module substitutes.

three virtual in-memory directories of interest are:

- `/cdk`
- `/cdk.out`
- `/tmp`

`CDK.require('fs').vol.toJSON()` dumps the entire virtual "disk" as a JSON object.

> if you reset the disk, you need to reinitialize it yourself with `cdk.json` and the bootstrap stack template.
