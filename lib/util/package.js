const path = require('path');
const readPkg = require('read-pkg');
const util = require('util');
const fs = require('fs');
const { checkUpdates } = require('./check');

let pkgCache = {};

function check(vp, pkg, dir) {
  return checkUpdates(vp, pkg, dir).then(check => {
    let rst = {
      pkg,
      check
    };
    if (dir) {
      rst.dir = dir;
    }
    pkgCache[dir] = rst;
    return rst;
  });
}

module.exports = {
  loadPackages(vp, dir, useCache) {
    let pkg;
    if (useCache && pkgCache[dir]) {
      return pkgCache[dir];
    }
    pkgCache = {};
    if (vp.opt.subPackage.enable) {
      if (!dir) {
        const readdir = util.promisify(fs.readdir);

        return readdir(vp.opt.subPackage.dir)
          .then(dirs => {
            return dirs.filter(dir => fs.statSync(path.join(vp.opt.subPackage.dir, dir)).isDirectory());
          })
          .then(dirs => {
            return Promise.all(
              dirs.map(dir => check(vp, readPkg.sync({ cwd: path.join(vp.opt.subPackage.dir, dir) }), dir))
            );
          });
      } else {
        pkg = readPkg.sync({ cwd: path.join(vp.opt.subPackage.dir, dir) });
      }
    }
    return check(vp, pkg || vp.pkg, dir).then(res => [res]);
  }
};
