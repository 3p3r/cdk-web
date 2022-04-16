const ternary = (condition, trueValue, falseValue) => (condition ? trueValue : falseValue);
const get = (value, defaultValue) => ternary(!!value, value, defaultValue);
const noop = () => {};
noop(); // leave here for coverage. Closure Compiler optimizes it out.
module.exports = { ternary, get, noop };
