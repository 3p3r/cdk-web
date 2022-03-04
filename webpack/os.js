const os = require("os-browserify");

module.exports = {
  ...os,
  userInfo: () => ({
    uid: 1000,
    gid: 1000,
    username: "cdk-web",
    homedir: "/",
  }),
};

module.exports.Module = __filename;
