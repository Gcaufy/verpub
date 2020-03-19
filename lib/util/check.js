const path = require('path');
const tagUtil = require('./tag');
const execa = require('execa');
const pt = require('promise-timeout');

function gitChangesSince(tag, grep) {
  return execa('/bin/sh', ['-c', `git log ${tag}..@ --oneline --pretty="format:" --name-status ${grep}`])
    .then(res => {
      const lines = res.stdout.split('\n');
      return lines.map(line => {
        const arr = line.split('\t');
        return {
          status: arr[0],
          file: arr[1]
        };
      });
    })
    .catch(() => {
      return [];
    });
}

function npmViewPkg(name) {
  return pt
    .timeout(execa('/bin/sh', ['-c', `npm view ${name} --json`]), 1000)
    .then(res => {
      return JSON.parse(res.stdout);
    })
    .catch(() => {
      return {};
    });
}

module.exports = {
  checkUpdates(vp, pkg, subDir) {
    let withGrep = '';
    if (vp.opt.subPackage.enable && subDir) {
      let subPath = path.join(vp.opt.subPackage.dir, subDir);
      withGrep = ' | grep ' + subPath;
    }

    pkg = pkg || vp.pkg;
    const currentTag = tagUtil.getPackageTag(pkg, vp.opt.tag);
    const rst = {
      name: pkg.name,
      tag: currentTag
    };
    return gitChangesSince(currentTag, withGrep)
      .then(changes => (rst.changes = changes))
      .then(() => npmViewPkg(pkg.name))
      .then(remote => (rst.remote = remote))
      .then(() => rst);
  }
};
