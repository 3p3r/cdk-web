const { getOptions } = require("loader-utils");
const { validate } = require("schema-utils");
const { ok } = require('assert');

const schema = {
  type: "object",
  properties: {
    path: {
      type: "string",
    },
  },
  additionalProperties: false,
};

module.exports = function modifyModuleSourceLoader(source) {
  const options = getOptions(this);

  validate(schema, options, {
    name: "ModuleReplacementPlugin Loader",
  });

  const modify = global.modify ? global.modify[options.path] : null;
  ok(modify);

  return modify(source, options.path);
};
