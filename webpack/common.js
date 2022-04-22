const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const cxapi = require("@aws-cdk/cx-api");
const debug = require("debug")("CdkWeb:Common");
const { default: ignore } = require("ignore");

const __ROOT = path.resolve(__dirname, "..");
const __DEBUG = process.env.CDK_WEB_DEBUG !== undefined;
const __SERVER = process.env.WEBPACK_DEV_SERVER !== undefined;
const Constants = { __ROOT, __DEBUG, __SERVER };
debug("constants: %o", JSON.stringify(Constants));

const ig = ignore().add(
  fs.readFileSync(path.resolve(__ROOT, "bundle.ignore"), { encoding: "utf-8" }).trim().split("\n")
);

class MakeSureReplaced {
  static debug = require("debug")("CdkWeb:MakeSureReplaced");
  constructor(inputValue = "") {
    this.value = inputValue;
  }
  do = (searchValue, replaceValue) => {
    MakeSureReplaced.debug("trying to replace %o with %o", searchValue, replaceValue);
    MakeSureReplaced.debug("input: %s", _.truncate(this.value));
    const processed =
      "function" === typeof replaceValue ? replaceValue(this.value) : this.value.replace(searchValue, replaceValue);
    assert.ok(
      processed !== this.value && typeof processed === typeof this.value,
      `failed for: ${JSON.stringify({ inputValue: this.value, searchValue, replaceValue })}`
    );
    return new MakeSureReplaced(processed);
  };
}

class PathTracker {
  static debug = require("debug")("CdkWeb:PathTracker");
  patterns = [];

  track = (patterns) => {
    if (patterns) {
      patterns = _.isArray(patterns) ? patterns : [patterns];
      PathTracker.debug("tracking: %o", patterns);
      this.patterns = this.patterns.concat(...patterns);
      return patterns;
    } else {
      PathTracker.debug("patterns: %o", this.patterns);
      assert.ok(this.patterns.length === 0, "tracker is dirty");
    }
  };

  check = (resourcePath) => {
    PathTracker.debug("checking for: %o against %o", resourcePath, this.patterns);
    if (this.patterns.length > 0)
      this.patterns = this.patterns.filter((pattern) =>
        "string" === typeof pattern ? resourcePath === pattern : resourcePath.search(pattern) < 0
      );
  };
}

const getAllModules = _.memoize(() => {
  const exports = Object.keys(require("aws-cdk-lib/package.json").exports);
  const allModules = [
    "fs",
    "path",
    "process",
    "constructs",
    ...exports.map((p) => p.replace(/^\.(\/?)/, "aws-cdk-lib$1")),
  ].filter((m) => {
    try {
      require(m);
      debug("[x] %s", m);
      return true;
    } catch (err) {
      debug("[ ] %s", m);
      return false;
    }
  });
  return allModules;
});

const getModules = _.memoize(() => {
  const allModules = getAllModules();
  const includedModules = allModules.filter((m) => !ig.ignores(m));
  return includedModules;
});

const getExcludedModules = _.memoize(() => {
  const allModules = getAllModules();
  const includedModules = getModules();
  const excludedModules = allModules.filter((m) => !includedModules.includes(m));
  return excludedModules;
});

getExcludedModules();

const getAssets = _.memoize(() => {
  const assets = [];
  const context = { ...cxapi.NEW_PROJECT_DEFAULT_CONTEXT };
  Object.entries(cxapi.FUTURE_FLAGS)
    .filter(([k, _]) => !cxapi.FUTURE_FLAGS_EXPIRED.includes(k))
    .forEach(([k, v]) => (context[k] = v));
  assets.push({ path: "/cdk/cdk.json", code: JSON.stringify({ app: "index.html", context }) });
  assets.push({
    path: "/cdk/bootstrap-template.yaml",
    code: fs.readFileSync("node_modules/aws-cdk/lib/api/bootstrap/bootstrap-template.yaml", "utf8"),
  });
  return assets;
});

const crossPlatformPathSepehr = "(\\/|\\|\\\\)";
const crossPlatformPathRegExp = (path = "node_modules/...") =>
  new RegExp(`${path.split("/").join(crossPlatformPathSepehr)}$`);
crossPlatformPathRegExp.SEP = crossPlatformPathSepehr;

module.exports = {
  ...Constants,
  MakeSureReplaced,
  PathTracker,
  getAssets,
  getModules,
  getAllModules,
  getExcludedModules,
  crossPlatformPathRegExp,
};
