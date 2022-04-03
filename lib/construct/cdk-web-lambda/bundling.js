const cdk = require("aws-cdk-lib");
const fs = require("fs");
const { EsBuild } = require("./esbuild");
const { WebAsset } = require("./asset");

class Bundling {
  /**
   * esbuild bundled Lambda asset code
   *
   * @param {(AssetOptions | BundlingOptions)} options
   */
  static bundle(options) {
    const bundling = new Bundling(options);
    return {
      bundling,
      code: new WebAsset(options.projectRoot, {
        assetHash: options.assetHash,
        assetHashType: options.assetHash
          ? cdk.AssetHashType.CUSTOM
          : cdk.AssetHashType.OUTPUT,
        bundling,
      }),
    };
  }

  constructor(props) {
    // Docker bundling
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
  }

  async init() {
    fs.mkdirSync("/tmp/web-bundle/source", { recursive: true });
    fs.mkdirSync("/tmp/web-bundle/dist", { recursive: true });
    const bundleOut = fs.mkdtempSync("/tmp/web-bundle/source/");
    const archiveDir = fs.mkdtempSync("/tmp/web-bundle/dist/");
    const esbuild = new EsBuild();
    await esbuild.load();
    await esbuild.build({
      entryPoints: [this.entrypoint],
      outdir: bundleOut,
      bundle: true,
    });
    this._archive = await archivePackage(bundleOut, archiveDir);
    return this._archive;
    // this.local = this.getLocalBundlingProvider();
  }

  getLocalBundlingProvider() {
    return {
      tryBundle: (outputDir, _) => {
        // fs.renameSync(this._archive, `${outputDir}/bundle.zip`);
        fs.writeFileSync(`${outputDir}/bundle.zip`, "");
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
  for (name of sources) {
    const contents = fs.readFileSync(`${source}/${name}`, { encoding: "utf8" });
    zip.file(name, contents);
  }
  const content = await zip.generateAsync({ type: "blob" });
  fs.writeFileSync(outFile, content);
  return outFile;
}

module.exports = {
  Bundling,
};
