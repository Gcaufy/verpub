const verpub = require('./lib/verpub');

exports = module.exports = function semverPublish(params) {
  return new verpub().publish(params);
};
