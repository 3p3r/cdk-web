const debug = require("debug")("CdkWeb:ModuleReplacePluginLoader");
const { getOptions } = require("loader-utils");
const { validate } = require("schema-utils");
const { ok } = require("assert");

const schema = {
  properties: { data: { type: "object" }, path: { type: "string" } },
  additionalProperties: false,
  type: "object",
};

module.exports = function modifyModuleSourceLoader(source) {
  const options = getOptions(this);
  debug("options: %o", options);
  validate(schema, options, { name: "ReplaceModulePlugin Loader" });
  const { symbol } = options.data;
  const modify = global[symbol] ? global[symbol][options.path] : null;
  ok(modify, "unable to lookup the modify function");
  const modified = modify(source, options.path);
  ok(modified != source, "nothing changed");
  return modified;
};
