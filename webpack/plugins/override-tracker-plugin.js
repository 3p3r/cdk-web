const _ = require("lodash");
const { crossPlatformPathRegExp } = require("../common");
const { Loader, KeepTrack } = require("../loaders/override-loader");

module.exports = class {
  apply(compiler) {
    const { rules } = compiler.options.module;
    const overrideRules = rules.filter(({ loader }) => loader === Loader);
    const overrideTests = [].concat(...overrideRules.map(({ test }) => test.toString()));
    const overridePaths = overrideTests.map((test) =>
      _.chain(test).split(crossPlatformPathRegExp.SEP).join("/").trimStart("/").trimEnd("$/").value()
    );
    for (const path of overridePaths) KeepTrack(path);
  }
};
