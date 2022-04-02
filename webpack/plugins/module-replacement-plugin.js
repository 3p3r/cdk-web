const fs = require("fs");
const path = require("path");
const hash = require("string-hash");
const debug = require("debug")("CdkWeb:ModuleReplacementPlugin");
const precinct = require("precinct");
const assert = require("assert");

global.modify = {};

function tryResolve(mod = "", root = "") {
  try {
    return require.resolve(mod);
  } catch {
    try {
      return require.resolve(path.resolve(root, mod));
    } catch {
      return "";
    }
  }
}

class ModuleReplacementPlugin {
  constructor(opts = { resourceRegExp: new RegExp(), newResource: "", oldResource: "" }) {
    this.resourceRegExp = opts.resourceRegExp;
    this.newResource = opts.newResource;
    this.oldResource = opts.oldResource;
    this.copyKey = hash(this.oldResource);

    assert.ok(path.isAbsolute(this.oldResource), "replacement must be absolute");
    debug(
      "replacing %s with %s and with pattern %s. copy key: %s",
      this.oldResource,
      this.newResource,
      this.resourceRegExp,
      this.copyKey
    );

    // copy the file that's being patched in case newResource is using it
    const ext = path.extname(this.oldResource);
    const src = path.basename(this.oldResource, ext ? ext : undefined);
    const dst = `${src}-copy-${this.copyKey}${ext ? ext : ""}`;
    const folder = path.dirname(this.oldResource);
    const oldResourceCopy = path.join(folder, dst);

    debug("making a copy of old resource to: %s", oldResourceCopy);
    fs.copyFileSync(this.oldResource, oldResourceCopy);
    this.oldResourceCopy = oldResourceCopy;

    global.modify[this.oldResource] = (source = "") => {
      debug("modifying the source of %s", this.oldResource);
      const dependencies = precinct(source);
      debug("dependencies: %o", dependencies);
      for (const dependency of dependencies) {
        const resolved = tryResolve(dependency, path.dirname(this.newResource));
        debug("resolved: %o", resolved);
        if (resolved === this.oldResource) {
          const newSource = source.replace(new RegExp(dependency, "gm"), this.oldResourceCopy);
          assert.ok(newSource !== source, "nothing changed");
          source = newSource;
        }
      }
      return source;
    };
  }

  apply(compiler) {
    compiler.hooks.compilation.tap("ModuleReplacementPlugin", (compilation) => {
      const modifiedModules = [];
      compilation.hooks.normalModuleLoader.tap("ModuleReplacementPlugin", (_, normalModule) => {
        if (modifiedModules.includes(normalModule.userRequest)) {
          debug("already processed %s", normalModule.userRequest);
          return;
        }
        debug("processing %s", normalModule.userRequest);
        if (normalModule.userRequest === this.oldResource) {
          debug("using modify loader to replace the original module with its copy");
          normalModule.loaders.push({
            loader: require.resolve("../loaders/modify-loader"),
            options: { path: this.oldResource },
          });
        }
        debug("done processing %s", normalModule.userRequest);
        modifiedModules.push(normalModule.userRequest);
      });
    });
    compiler.hooks.normalModuleFactory.tap("ModuleReplacementPlugin", (compilation) => {
      compilation.hooks.afterResolve.tap("ModuleReplacementPlugin", (result) => {
        if (!result) return;
        if (this.resourceRegExp.test(result.resource)) {
          const issuer = `${result.resourceResolveData.context.issuer}`;
          debug('afterResolve: replacing "%s" with "%s" inside "%s"', result.request, this.newResource, issuer);
          if (issuer === this.newResource) {
            debug("newResource is using oldResource, making it use the copy");
            result.resource = this.oldResourceCopy;
          } else {
            debug("oldResource is used outside of newResource, redirect to newResource");
            result.resource = this.newResource;
          }
        }
        return result;
      });
    });
  }
}

module.exports = ModuleReplacementPlugin;
