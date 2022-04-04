# `CDK.require('fs')`

cdk-web uses an in-memory filesystem to simulate an actual hard disk that native cdk usually uses.

this module implements a subset of Node's fs API. you can use this to inspect what cdk-web is doing to "disk".

you can access it by `CDK.require('fs')`. most \*Sync methods are available.

`CDK.require('path')` is also available as Node's path module substitute.

three main important virtual in-memory directories are:

- `/cdk`
- `/cdk.out`
- `/tmp`

`CDK.require('fs').vol.toJSON()` dumps the entire virtual "disk" as a JSON object.
