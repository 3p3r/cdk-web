const stage = require("../../node_modules/aws-cdk-lib/core/lib/stage");

class WebStage extends stage.Stage {
  async synth(...args) {
    const assembly = super.synth(...args);
    // await Promise.all(
    //   this.node
    //     .findAll()
    //     .map((construct) =>
    //       construct.constructor.PostSynthesize
    //         ? construct.constructor.PostSynthesize(construct, assembly)
    //         : Promise.resolve()
    //     )
    // );
    return assembly;
  }
}

module.exports = { ...stage, Stage: WebStage };
