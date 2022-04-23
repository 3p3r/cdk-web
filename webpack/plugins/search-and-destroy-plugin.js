// originally from https://stackoverflow.com/a/50029942/388751
const { ReplaceSource } = require("webpack-sources");
const PLUGIN_NAME = "search-and-destroy-plugin";

// https://stackoverflow.com/a/274094/388751
function regexIndexOf(string, regex, startPos) {
  let indexOf = string.substring(startPos || 0).search(regex);
  return indexOf >= 0 ? indexOf + (startPos || 0) : indexOf;
}

// returns all indices a search and replace will happen
function getAllIndices(str, searchStr) {
  let i = -1;
  const indices = [];
  while ((i = "string" === typeof str ? str.indexOf(searchStr, i + 1) : regexIndexOf(str, searchStr, i + 1)) !== -1) {
    indices.push(i);
  }
  return indices;
}

// resolves a regular expression search into a string exact match
function resolveSearchExpression(str, searchStr, startPos) {
  const subStr = str.substring(startPos);
  const nuked = subStr.replace(searchStr, "");
  const length = subStr.length - nuked.length;
  const chunk = subStr.substring(0, length);
  return chunk;
}

// this plugin does a global search and replace after everything is concatenated
module.exports = class SearchAndDestroyPlugin {
  constructor(opts = {}) {
    /** @type {[(string|RegExp),string][]} */
    this.plan = Object.entries(opts.plan || {});
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.optimizeChunkAssets.tapAsync(PLUGIN_NAME, (chunks, callback) => {
        chunks.forEach((chunk) => {
          chunk.files.forEach((file) => {
            let source;
            const originalSource = compilation.assets[file];
            this.plan.forEach(([fromCode, toCode]) => {
              const indices = getAllIndices(originalSource.source(), fromCode);
              if (!indices.length) return;
              if (!source) source = new ReplaceSource(originalSource);
              indices.forEach((startPos) => {
                const from = resolveSearchExpression(originalSource.source(), fromCode, startPos);
                const endPos = startPos + from.length - 1;
                source.replace(startPos, endPos, toCode);
              });
            });
            if (source) compilation.assets[file] = source;
            callback();
          });
        });
      });
    });
  }
};
