// this is our actual construct. this is both node and browser compatible.
// for browser you can run "npx webpack" and grab the output "bundle.js".
// for nodejs, you can require(".../index.js") of this package as usual.

const path = require("path");
const lambda = require("aws-cdk-lib/aws-lambda");
const fs = require("fs");
const { Bundling } = require("./bundling");
const { LockFile } = require("./package-manager");
const { callsites, findUpMultiple } = require("./util");

class NodejsFunction extends lambda.Function {
  constructor(scope, id, props) {
    // Entry and defaults
    const handler = props.handler || "handler";
    const runtime = props.runtime || lambda.Runtime.NODEJS_14_X;
    const entry = path.resolve(findEntry(id, props.entry));
    const architecture = props.architecture || lambda.Architecture.X86_64;
    const depsLockFilePath = findLockFile(props.depsLockFilePath);
    const projectRoot = props.projectRoot || path.dirname(depsLockFilePath);

    const { bundling, code } = Bundling.bundle({
      ...(props.bundling || {}),
      entry,
      runtime: props.runtime,
      architecture,
      depsLockFilePath,
      projectRoot,
    });

    super(scope, id, {
      ...props,
      runtime,
      code,
      handler: `index.${handler}`,
    });
    this._bundling = bundling;
    this._ready = false;
    bundling.init().then((archive) => this.ready(archive));

    // Enable connection reuse for aws-sdk
    if (props.awsSdkConnectionReuse != false) {
      this.addEnvironment("AWS_NODEJS_CONNECTION_REUSE_ENABLED", "1", {
        removeInEdge: true,
      });
    }
  }

  ready() {
    const asset = this.node.children.filter((node) => node.assetPath).shift();
    if (!asset) {
      throw new Error(`Unable to find the asset of ${this.node.path}`);
    }
    this._bundling.replaceArchive(asset.assetPath);
    this._ready = true;
  }

  static async Compose(self) {
    // do async stuff here
    const ready = async (tries = 0) => {
      if (self._ready) {
        return;
      }
      if (tries > 300) {
        throw new Error("TimeoutError: Compose failed to reach ready state");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      await ready(++tries);
    };
    await ready();
  }
}

/**
 * Checks given lock file or searches for a lock file
 */
function findLockFile(depsLockFilePath) {
  if (depsLockFilePath) {
    if (!fs.existsSync(depsLockFilePath)) {
      throw new Error(`Lock file at ${depsLockFilePath} doesn't exist`);
    }

    if (!fs.statSync(depsLockFilePath).isFile()) {
      throw new Error("`depsLockFilePath` should point to a file");
    }

    return path.resolve(depsLockFilePath);
  }

  const lockFiles = findUpMultiple([
    LockFile.PNPM,
    LockFile.YARN,
    LockFile.NPM,
  ]);

  if (lockFiles.length === 0) {
    throw new Error(
      "Cannot find a package lock file (`pnpm-lock.yaml`, `yarn.lock` or `package-lock.json`). Please specify it with `depsFileLockPath`."
    );
  }
  if (lockFiles.length > 1) {
    throw new Error(
      `Multiple package lock files found: ${lockFiles.join(
        ", "
      )}. Please specify the desired one with \`depsFileLockPath\`.`
    );
  }

  return lockFiles[0];
}

function findEntry(id, entry) {
  if (entry) {
    if (!/\.(jsx?|tsx?|mjs)$/.test(entry)) {
      throw new Error(
        "Only JavaScript or TypeScript entry files are supported."
      );
    }
    if (!fs.existsSync(entry)) {
      throw new Error(`Cannot find entry file at ${entry}`);
    }
    return entry;
  }

  const definingFile = findDefiningFile();
  const extname = path.extname(definingFile);

  const tsHandlerFile = definingFile.replace(
    new RegExp(`${extname}$`),
    `.${id}.ts`
  );
  if (fs.existsSync(tsHandlerFile)) {
    return tsHandlerFile;
  }

  const jsHandlerFile = definingFile.replace(
    new RegExp(`${extname}$`),
    `.${id}.js`
  );
  if (fs.existsSync(jsHandlerFile)) {
    return jsHandlerFile;
  }

  const mjsHandlerFile = definingFile.replace(
    new RegExp(`${extname}$`),
    `.${id}.mjs`
  );
  if (fs.existsSync(mjsHandlerFile)) {
    return mjsHandlerFile;
  }

  throw new Error(
    `Cannot find handler file ${tsHandlerFile}, ${jsHandlerFile} or ${mjsHandlerFile}`
  );
}

/**
 * Finds the name of the file where the `NodejsFunction` is defined
 */
function findDefiningFile() {
  let definingIndex;
  const sites = callsites();
  for (const [index, site] of sites.entries()) {
    if (site.getFunctionName() === "NodejsFunction") {
      // The next site is the site where the NodejsFunction was created
      definingIndex = index + 1;
      break;
    }
  }

  if (!definingIndex || !sites[definingIndex]) {
    throw new Error("Cannot find defining file.");
  }

  return sites[definingIndex].getFileName();
}

module.exports = {
  NodejsFunction,
};
