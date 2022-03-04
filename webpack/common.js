const _ = require("lodash");
const path = require("path");
const assert = require("assert");
const debug = require("debug")("CdkWeb:Common");

const __ROOT = path.resolve(__dirname, "..");
const __DEBUG = process.env.CDK_WEB_DEBUG !== undefined;
const __SERVER = process.env.WEBPACK_DEV_SERVER !== undefined;
const Constants = { __ROOT, __DEBUG, __SERVER };
debug("constants: %o", JSON.stringify(Constants));

class MakeSureReplaced {
  static debug = require("debug")("CdkWeb:MakeSureReplaced");
  constructor(inputValue = "") {
    this.value = inputValue;
  }
  do = (searchValue, replaceValue) => {
    MakeSureReplaced.debug("trying to replace %o with %o", searchValue, replaceValue);
    MakeSureReplaced.debug("input: %s", _.truncate(this.value));
    const processed = this.value.replace(searchValue, replaceValue);
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
    if (this.patterns.length > 0) this.patterns = this.patterns.filter((pattern) => resourcePath.search(pattern) < 0);
  };
}

module.exports = { ...Constants, MakeSureReplaced, PathTracker };
