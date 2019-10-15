const verpub = require('./lib/verpub');

module = module.exports = function semverPublish(params) {
  return new verpub().publish(params);
};
