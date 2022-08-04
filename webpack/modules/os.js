const fs = require("fs");
const os = require("os-browserify");

module.exports = {
  ...os,
  tmpdir: () => {
    const tmpdir = os.tmpdir();
    if (!fs.existsSync(tmpdir)) fs.mkdirSync(tmpdir);
    return tmpdir;
  },
  userInfo: () => ({
    uid: 1000,
    gid: 1000,
    username: "cdk-web",
    homedir: "/",
  }),
};
