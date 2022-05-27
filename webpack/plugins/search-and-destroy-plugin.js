// originally from https://stackoverflow.com/a/50029942/388751

const { ok } = require("assert");
const { Compilation } = require("webpack");
const { ReplaceSource } = require("webpack-sources");
const { __SERVER } = require("../common");
const debug = require("debug")("CdkWeb:SearchAndDestroyPlugin");

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
  while (
    (i =
      "string" === typeof str
        ? str.indexOf(searchStr, i + 1)
        : regexIndexOf(str, searchStr, i + 1)) !== -1
  ) {
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
      compilation.hooks.processAssets.tap(
        {
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
          name: PLUGIN_NAME,
        },
        () => {
          const chunks = compilation.chunks;
          ok(chunks.size > 0, "no chunks");
          chunks.forEach((chunk) => {
            ok(chunk.files.size > 0, "no files");
            chunk.files.forEach((file) => {
              compilation.assets[file] = _replace(compilation.assets[file]);
            });
          });
        }
      );

      const _replace = (originalSource) => {
        const newSource = new ReplaceSource(originalSource);
        this.plan.forEach(([fromCode, toCode]) => {
          const indices = getAllIndices(originalSource.source(), fromCode);
          if (!__SERVER) {
            ok(indices.length > 0, `nothing to replace for ${fromCode}`);
          }
          indices.forEach((startPos) => {
            const from =
              "string" === typeof fromCode
                ? fromCode
                : resolveSearchExpression(
                    originalSource.source(),
                    fromCode,
                    startPos
                  );
            const endPos = startPos + from.length - 1;
            newSource.replace(startPos, endPos, toCode);
          });
        });
        return newSource;
      };
    });
  }
};
