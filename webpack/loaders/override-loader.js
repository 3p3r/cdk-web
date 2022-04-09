// watered down version of string-replace-loader

const { getOptions } = require("loader-utils");
const { MakeSureReplaced, PathTracker } = require("../common");

const tracker = new PathTracker();
const defaultOptions = { search: null, replace: null };

function getOptionsArray(config) {
  const rawOptions = getOptions(config);
  const rawOptionsArray = typeof rawOptions.multiple !== "undefined" ? rawOptions.multiple : [rawOptions];
  const optionsArray = [];
  for (const optionsIndex in rawOptionsArray) {
    optionsArray[optionsIndex] = Object.assign({}, defaultOptions, rawOptionsArray[optionsIndex]);
  }
  return optionsArray;
}

function replace(source, options, context) {
  const { search } = options;
  let replace;
  if (typeof options.replace === "function") {
    replace = options.replace.bind(context);
  } else {
    replace = options.replace;
  }
  let newSource = "";
  if (!options.relax) {
    const { value } = new MakeSureReplaced(source).do(search, replace);
    newSource = value;
  } else {
    newSource = "function" === typeof replace ? replace(source) : source.replace(search, replace);
  }
  tracker.check(context.resourcePath);
  return newSource;
}

function override(source, map) {
  this.cacheable();
  const optionsArray = getOptionsArray(this);
  let newSource = source;
  for (const options of optionsArray) {
    newSource = replace(newSource, options, this);
  }
  this.callback(null, newSource, map);
}

override.Loader = __filename;
override.KeepTrack = tracker.track;
module.exports = override;
