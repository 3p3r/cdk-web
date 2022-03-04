const debug = require("debug")("CdkWeb:EmptyLoader");
const { PathTracker } = require("../common");

const tracker = new PathTracker();

function empty() {
  debug("emptying %s", this.resourcePath);
  tracker.check(this.resourcePath);
  return this.cacheable(), ";module.exports = {/* emptied by cdk-web */};";
}

empty.Loader = __filename;
empty.KeepTrack = tracker.track;

module.exports = empty;
module.exports.pitch = empty;
