const semver = require('semver');

exports = module.exports = {
  getMinimumIncrease(version) {
    const rst = {
      increase: 'prerelease',
      tag: null
    };
    const parsed = semver.parse(version);
    if (parsed.prerelease.length === 0) {
      rst.increase = 'patch';
    } else if (parsed.prerelease.length >= 1) {
      for (let i = 0; i < parsed.prerelease.length; i++) {
        if (typeof parsed.prerelease[i] === 'string') {
          rst.tag = parsed.prerelease[i];
          break;
        }
      }
    }
    rst.version = semver.inc(version, rst.increase, rst.tag);
    return rst;
  }
};
