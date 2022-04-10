const original = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/function");

class WebNodejsFunction extends original.NodejsFunction {
  static async Compose(self) {
    let fetchFunction;
    const { bundling } = self.code;
    if ("undefined" !== typeof window) {
      const wasmPath = window.CDK_WEB_ESBUILD_WASM || "esbuild.wasm";
      fetchFunction = () => fetch(wasmPath);
    } else {
      throw new Error("not implemented");
    }
    await bundling.init(fetchFunction);
    const asset = self.node.children.filter((node) => node.assetPath).shift();
    if (!asset) {
      throw new Error(`Unable to find the asset of ${this.node.path}`);
    }
    bundling.replaceArchive(asset.assetPath);
  }
}

module.exports = { ...original, NodejsFunction: WebNodejsFunction };
