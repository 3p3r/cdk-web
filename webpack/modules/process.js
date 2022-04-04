const process = require("process");

const webProcess = {
  ...process,
  version: "CDK_WEB_NODE_VERSION",
  versions: {
    node: "CDK_WEB_NODE_VERSION",
  },
};

module.exports = { ...webProcess };
