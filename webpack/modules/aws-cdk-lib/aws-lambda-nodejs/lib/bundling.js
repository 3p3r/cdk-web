const original = require("../../../../../node_modules/aws-cdk-lib/aws-lambda-nodejs/lib/bundling");

const fs = require("fs");
const os = require("os");
const path = require("path");
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const { EsBuild } = require("./esbuild");

class WebAssetCode extends lambda.AssetCode {
  bind(scope) {
    scope.code = this;
    return super.bind(scope);
  }
}

class WebBundling {
  static bundle(options) {
    const bundling = new WebBundling(options);
    const code = new WebAssetCode(options.projectRoot, {
      bundling,
      assetHash: options.assetHash,
      assetHashType: options.assetHash ? cdk.AssetHashType.CUSTOM : cdk.AssetHashType.SOURCE,
      exclude: [],
      ignoreMode: cdk.IgnoreMode.GLOB,
    });
    code.bundling = bundling;
    return code;
  }

  constructor(props) {
    // docker bundling mocking
    this._archive = undefined;
    this.command = undefined;
    this.environment = undefined;
    this.local = undefined;
    this.outputType = undefined;
    this.securityOpt = undefined;
    this.volumes = undefined;
    this.workingDirectory = undefined;
    this.image = new cdk.DockerImage("noop");
    this.outputType = cdk.BundlingOutput.ARCHIVED;
    this.entrypoint = props.entry;
    this.local = this.getLocalBundlingProvider();
    this._outputDir = undefined;
  }

  async init(fetch = () => Promise.reject("not implemented")) {
    fs.mkdirSync(`${os.tmpdir()}/web-bundle/source`, { recursive: true });
    fs.mkdirSync(`${os.tmpdir()}/web-bundle/dist`, { recursive: true });
    const bundleOut = fs.mkdtempSync(`${os.tmpdir()}/web-bundle/source/`);
    const archiveDir = fs.mkdtempSync(`${os.tmpdir()}/web-bundle/dist/`);
    const esbuild = new EsBuild(fetch);
    await esbuild.build({
      entryPoints: [this.entrypoint],
      outdir: bundleOut,
      bundle: true,
    });
    this._archive = await archivePackage(bundleOut, archiveDir);
    return this._archive;
  }

  replaceArchive(filename) {
    const baseDir = path.dirname(this._outputDir);
    fs.renameSync(this._archive, `${baseDir}/${filename}`);
  }

  getLocalBundlingProvider() {
    return {
      tryBundle: (outputDir, _) => {
        fs.writeFileSync(`${outputDir}/bundle.zip`, "");
        this._outputDir = outputDir;
        return true;
      },
    };
  }
}

/**
 *
 * @param {string} source - Absolute path to the source files to archive
 * @param {string} outDir - Absolute path to a directory to build the archive into
 */
async function archivePackage(source, outDir) {
  const outFile = `${outDir}/out.zip`;
  const JSZip = require("jszip");
  var zip = new JSZip();

  const sources = fs.readdirSync(source);
  for (let name of sources) {
    const contents = fs.readFileSync(`${source}/${name}`, { encoding: "utf8" });
    zip.file(name, contents);
  }
  const content = await zip.generateAsync({ type: "blob" });
  fs.writeFileSync(outFile, content);
  return outFile;
}

module.exports = {
  ...original,
  Bundling: WebBundling,
};
