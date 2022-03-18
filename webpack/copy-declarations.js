// https://github.com/webcarrot/copy-declaration-ts/blob/master/index.js
// this is from there ^ but author does not export it :( hence the copy pasta
// + added overwrite flag to copy()

const fs = require("fs");
const { join } = require("path");
const debug = require("debug")("CdkWeb:CopyDeclarations");

const { stat, access, mkdir, writeFile, readFile, readdir } = fs.promises;
const DIR_CACHE = new Map();

const checkDir = async (path) => {
  if (!DIR_CACHE.has(path)) {
    try {
      const info = await stat(path);
      if (info.isDirectory()) {
        DIR_CACHE.set(path, true);
      } else {
        DIR_CACHE.set(path, false);
      }
    } catch {
      try {
        await mkdir(path, { recursive: true });
        DIR_CACHE.set(path, true);
      } catch {
        DIR_CACHE.set(path, false);
      }
    }
  }
  return DIR_CACHE.get(path);
};

const copyDeclarations = async (fromDir, toDir, overwrite = false) => {
  const data = await readdir(fromDir);
  await Promise.all(
    data.map(async (path) => {
      const fromPath = join(fromDir, path);
      const toPath = join(toDir, path);
      const info = await stat(fromPath);
      if (info.isDirectory()) {
        await copyDeclarations(fromPath, toPath, overwrite);
      } else if (info.isFile() && path.endsWith(".d.ts")) {
        if (await checkDir(toDir)) {
          const skip = await (async () => {
            try {
              await access(toPath, fs.constants.F_OK);
              return !overwrite;
            } catch {
              return false;
            }
          })();
          debug("[%s]: %s", skip ? " " : "x", toPath);
          if (!skip) await writeFile(toPath, await readFile(fromPath));
        } else {
          throw new Error(`Directory could not be created ${toDir}`);
        }
      }
    })
  );
};

module.exports = copyDeclarations;
