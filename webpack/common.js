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
  do(searchValue, replaceValue) {
    MakeSureReplaced.debug("trying to replace %o with %o", searchValue, replaceValue);
    MakeSureReplaced.debug("input: %s", _.truncate(this.value));
    const processed = this.value.replace(searchValue, replaceValue);
    assert.ok(
      processed !== this.value && typeof processed === typeof this.value,
      `failed for: ${JSON.stringify({ inputValue: this.value, searchValue, replaceValue })}`
    );
    return new MakeSureReplaced(processed);
  }
}

module.exports = { ...Constants, MakeSureReplaced };
