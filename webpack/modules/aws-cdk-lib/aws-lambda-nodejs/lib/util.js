const fs = require("fs");
const path = require("path");

/**
 * Get callsites from the V8 stack trace API
 *
 * https://github.com/sindresorhus/callsites
 */
export function callsites() {
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const err = new Error();
  const stack = err.stack && err.stack.slice(1);
  Error.prepareStackTrace = _prepareStackTrace;
  return stack;
}

/**
 * Find the lowest of multiple files by walking up parent directories. If
 * multiple files exist at the same level, they will all be returned.
 */
export function findUpMultiple(names, directory) {
  if (!directory) {
    directory = process.cwd();
  }
  const absoluteDirectory = path.resolve(directory);

  const files = [];
  for (const name of names) {
    const file = path.join(directory, name);
    if (fs.existsSync(file)) {
      files.push(file);
    }
  }

  if (files.length > 0) {
    return files;
  }

  const { root } = path.parse(absoluteDirectory);
  if (absoluteDirectory === root) {
    return [];
  }

  return findUpMultiple(names, path.dirname(absoluteDirectory));
}

export function tryGetModuleVersionFromRequire(mod) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`${mod}/package.json`).version;
  } catch (err) {
    return undefined;
  }
}
