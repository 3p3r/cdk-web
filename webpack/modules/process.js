const original = require("../../node_modules/process/browser");
const path = require("./path");
module.exports = {
  ...original,
  chdir(dir) {
    original.cwd = () => {
      return path.resolve(dir);
    };
  },
};
