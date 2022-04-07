const fs = require("fs");
const path = require("path");
const assert = require("assert");
const hash = require("string-hash");
const precinct = require("precinct");
const debug = require("debug")("CdkWeb:ExtendedAliasPlugin");
const override = require("../loaders/override-loader");

const PLUGIN_NAME = "ExtendedAliasPlugin";

function tryResolve(mod = "", root = process.cwd()) {
  try {
    debug("try resolving %s", mod);
    return require.resolve(mod);
  } catch {
    try {
      debug("try resolving %s based at %s", mod, root);
      return require.resolve(path.resolve(root, mod));
    } catch {
      debug("resolving failed for %s", mod);
      return "";
    }
  }
}

class ExtendedAliasPlugin {
  #mods = {};
  #replacements = {};

  initialize(aliasedModules = {}) {
    debug("found this following aliased modules: %o", aliasedModules);
    Object.keys(aliasedModules).forEach((alias) => {
      const oldResource = tryResolve(alias);
      const newResource = tryResolve(aliasedModules[oldResource]);
      debug("alias: %s >> %s", oldResource, newResource);
      if (!oldResource || !newResource) return;
      if (path.isAbsolute(oldResource) && !newResource.includes("node_modules")) {
        debug("alias is pointing to a local source and needs module parsing");
        this.#replacements[oldResource] = newResource;
        this.createModification(oldResource);
      }
    });
  }

  createHashedCopyName(oldResource) {
    const ext = path.extname(oldResource);
    const src = path.basename(oldResource, ext ? ext : undefined);
    const dst = `${src}-copy-${hash(oldResource)}${ext ? ext : ""}`;
    const folder = path.dirname(oldResource);
    const oldResourceHashedCopyName = path.join(folder, dst);
    debug("hashed copy name generated %s=%s", oldResource, oldResourceHashedCopyName);
    return oldResourceHashedCopyName;
  }

  createSourceCopy(oldResource) {
    debug("copying old resource: %s", oldResource);
    const oldResourceCopy = this.createHashedCopyName(oldResource);
    debug("making a copy of old resource to: %s", oldResourceCopy);
    fs.copyFileSync(oldResource, oldResourceCopy);
    return oldResourceCopy;
  }

  createModification(oldResource) {
    this.#mods[oldResource] = (source = "") => {
      const oldSource = source;
      debug("modifying the source of %s", oldResource);
      const dependencies = precinct(source);
      debug("dependencies: %o", dependencies);
      for (const dependency of dependencies) {
        const resolved = tryResolve(dependency, path.dirname(this.#replacements[oldResource]));
        debug("resolved: %o", resolved);
        if (resolved === oldResource) {
          const newSource = source.replace(new RegExp(dependency, "gm"), this.createSourceCopy(oldResource));
          source = newSource;
        }
      }
      assert.ok(oldSource !== source, "module modify failed");
      return source;
    };
  }

  apply(compiler) {
    const { alias } = compiler.options.resolve;
    debug("webpack alias fields: %o", alias);
    this.initialize(alias);
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const modifiedModules = [];
      compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, (_, module) => {
        const request = module.userRequest;
        if (modifiedModules.includes(request)) {
          debug("already processed %s", request);
          return;
        }
        debug("processing %s", request);
        if (Object.values(this.#replacements).includes(request)) {
          const oldResource = Object.keys(this.#replacements).find(
            (oldResource) => this.#replacements[oldResource] === request
          );
          debug("using modify loader to replace the original module with its copy");
          override.KeepTrack(oldResource);
          module.loaders.push({
            loader: override.Loader,
            options: {
              replace: (source) => {
                const modified = this.#mods[oldResource](source);
                assert.ok(modified != source, "nothing changed");
                return modified;
              },
            },
          });
        }
        debug("done processing %s", request);
        modifiedModules.push(request);
      });
    });
  }
}

module.exports = ExtendedAliasPlugin;
