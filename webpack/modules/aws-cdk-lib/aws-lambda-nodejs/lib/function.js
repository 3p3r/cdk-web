const original = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/function");

class WebNodejsFunction extends original.NodejsFunction {
  static async Compose(self) {
    const { bundling } = self.code;
    await bundling.init();
    const asset = self.node.children.filter((node) => node.assetPath).shift();
    if (!asset) {
      throw new Error(`Unable to find the asset of ${this.node.path}`);
    }
    bundling.replaceArchive(asset.assetPath);
  }
}

module.exports = { ...original, NodejsFunction: WebNodejsFunction };
