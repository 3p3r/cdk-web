const stage = require("../../../../../node_modules/aws-cdk-lib/core/lib/stage");
const emitter = require("../../../emitter");

/** WebStage overrides Stage to make its synth() method asynchronous */
class WebStage extends stage.Stage {
  /**
   * async synth() override over cdk's sync synth()
   * @param {stage.StageSynthesisOptions} options
   * @param  {...any} args
   * @returns CloudAssembly (sync version) or a Promise<CloudAssembly> in case tree contains async constructs
   */
  synth(options, ...args) {
    const emitAndReturn = (assembly) => {
      emitter.emit("synth", assembly, this);
      return assembly;
    };
    const assembly = super.synth(options, ...args);
    const allNodes = this.node.findAll();
    const compositeNodes = allNodes.filter((construct) => "function" === typeof construct.constructor.Compose);
    if (compositeNodes.length > 0) {
      return Promise.all(compositeNodes.map((construct) => construct.constructor.Compose(construct))).then(() =>
        emitAndReturn(assembly)
      );
    } else {
      return emitAndReturn(assembly);
    }
  }
}

module.exports = { ...stage, Stage: WebStage };
