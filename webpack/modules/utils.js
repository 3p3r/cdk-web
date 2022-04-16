const ternary = (condition, trueValue, falseValue) => (condition ? trueValue : falseValue);
const get = (value, defaultValue) => ternary(!!value, value, defaultValue);
module.exports = { ternary, get };
