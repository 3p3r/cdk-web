const original = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/function");
const assert = require("assert");

class WebNodejsFunction extends original.NodejsFunction {
  static async Compose(self) {
    const { bundling } = self.code;
    const fetchFunction =
      "undefined" !== typeof window
        ? () => window.fetch(window.CDK_WEB_ESBUILD_WASM || "esbuild.wasm")
        : async () => {
            const nodeFs = eval('require("fs")');
            const nodeEnv = eval("process.env");
            return {
              arrayBuffer: async () => nodeFs.readFileSync(nodeEnv.CDK_WEB_ESBUILD_WASM || "esbuild.wasm"),
            };
          };
    await bundling.init(fetchFunction);
    const asset = self.node.children.filter((node) => node.assetPath).shift();
    assert.ok(asset, `Unable to find the asset of ${self.node.path}`);
    bundling.replaceArchive(asset.assetPath);
  }
}

module.exports = { ...original, NodejsFunction: WebNodejsFunction };
