"use strict";

/* global window*/

(function (window = {}) {
  const assert = require("assert");
  const mkdirp = require("mkdirp");
  const rimraf = require("rimraf");
  rimraf.sync("/tmp");
  mkdirp.sync("/tmp");
  const imports = {
    "aws-cdk-lib": require("aws-cdk-lib"),
    constructs: require("constructs"),
    path: require("path"),
    fs: require("fs"),
  };
  window.require = (name) => {
    assert.ok(!name.includes("/"), "Scoped modules are not supported.");
    assert.ok(Object.keys(imports).includes(name), "Module not found.");
    return imports[name];
  };
})(window);
