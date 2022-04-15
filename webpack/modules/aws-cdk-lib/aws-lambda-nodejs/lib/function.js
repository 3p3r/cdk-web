const assert = require("assert");
const original = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/function");

class WebNodejsFunction extends original.NodejsFunction {
  static async Compose(self) {
    let fetchFunction;
    const { bundling } = self.code;
    if ("undefined" !== typeof window) {
      const wasmPath = window.CDK_WEB_ESBUILD_WASM || "esbuild.wasm";
      fetchFunction = () => fetch(wasmPath);
    } else {
      const nodeFs = eval('require("fs")');
      const nodeEnv = eval("process.env");
      const wasmPath = nodeEnv.CDK_WEB_ESBUILD_WASM || "esbuild.wasm";
      fetchFunction = () => ({ arrayBuffer: () => nodeFs.readFileSync(wasmPath) });
    }
    await bundling.init(fetchFunction);
    const asset = self.node.children.filter((node) => node.assetPath).shift();
    assert.ok(asset, `Unable to find the asset of ${self.node.path}`);
    bundling.replaceArchive(asset.assetPath);
  }
}

module.exports = { ...original, NodejsFunction: WebNodejsFunction };
