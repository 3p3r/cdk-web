/** this is true if a debugger is present. an example of a debugger is "ndb" by Chrome Labs or vscode's debugger. */
const isDebugger = process.env.NODE_OPTIONS && process.env.NODE_OPTIONS.search(/(ndb|vscode)/g) > 0;
module.exports = isDebugger;
