const path = require('path');
const readPkg = require('read-pkg');
const semver = require('semver');
const chalk = require('chalk');
const { prompt, Select, Input } = require('enquirer');

const VerPub = require('../lib/verpub');

/*
 * interact publish a npm package
 */
module.exports = function interactPublish(name, opt) {
  const verpub = new VerPub({ interact: opt.interact, dryRun: opt.dryRun });

  let flow = Promise.resolve(name);

  if (verpub.opt.subPackage.enable) {
    if (!name) {
      const util = require('util');
      const fs = require('fs');
      const readdir = util.promisify(fs.readdir);

      flow = readdir(verpub.opt.subPackage.dir)
        .then(dirs => {
          return dirs.filter(dir => fs.statSync(path.join(verpub.opt.subPackage.dir, dir)).isDirectory());
        })
        .then(dirs => {
          return new Select({
            name: 'package',
            message: 'Pick a package:',
            choices: dirs
          }).run();
        });
    }
    flow = flow.then(name => {
      // Enter directory
      let cwd = path.join(verpub.opt.subPackage.dir, name);
      process.chdir(cwd);

      let pkg = readPkg.sync({ cwd: './' });
      return pkg;
    });
  } else {
    flow = Promise.resolve(verpub.pkg);
  }

  return flow.then(pkg => {
    if (pkg) {
      verpub.logger.info('Publish package: ' + chalk.cyan(`${pkg.name}@${pkg.version}`));
    }

    let publishOpt = {
      version: opt.ver || '',
      tag: opt.tag || '',
      pkg: pkg
    };

    return new Select({
      name: 'tag',
      message: 'Pick a tag:',
      choices: ['release', 'alpha', 'beta', 'custom']
    })
      .run()
      .then(tag => {
        if (tag === 'custom') {
          return new Input({
            message: 'Input custom tag'
          }).run();
        }
        publishOpt.tag = tag;
        return tag;
      })
      .then(tag => {
        let choices = [];
        choices = ['patch', 'minor', 'major'].map(v => {
          if (tag !== 'release') {
            v = 'pre' + v;
          }
          let version = semver.inc(pkg.version, v, tag === 'release' ? '' : tag);
          return {
            message: `${v} (${version})`,
            value: version
          };
        });
        if (tag !== 'release') {
          let prerelease = semver.inc(pkg.version, 'prerelease', tag);
          choices.push({
            message: `prerelease (${prerelease})`,
            value: prerelease
          });
        }
        return new Select({
          name: 'version',
          message: 'Chooice a publish version:',
          choices: choices
        }).run();
      })
      .then(version => {
        publishOpt.version = version;
        return verpub.publish(publishOpt);
      });
  });
};
