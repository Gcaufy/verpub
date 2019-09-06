const sempub = require('./lib/sempub');

module = module.exports = function semverPublish (params) {
  return new sempub().publish(params);
}
