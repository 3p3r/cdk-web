# asynchronous constructs

cdk-web supports asynchronous logic during synthesis in a limited capacity. the original cdk has this philosophy that
everything must be sync, however in a web browser that's not possible as it blocks the main UI thread of the browser.

for that purpose, cdk-web supports asynchronous constructs in a limited capacity.

## the static `Compose` method

an optional `Compose` static method can be defined in your constructs like so:

```JS
class AsyncConstruct extends constructs.Construct {
  static async Compose(self: AsyncConstruct) {
    // do async stuff here
  }
}
```

keep these points in mind:

- > **`Compose` calls are made after `synth()` is called and the entire app has finished synthesizing**
- > **you MUST NOT alter or create new constructs in `Compose` (tree stays unchanged)**
- > order of execution for `Compose` calls is not guaranteed
- > `Compose` receives the construct itself as an argument
