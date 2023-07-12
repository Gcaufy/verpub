const path = require('path');
const semver = require('semver');
const chalk = require('chalk');
const { Select, Input } = require('enquirer');

const VerPub = require('../../lib/verpub');
const { loadPackages } = require('../../lib/util/package');
const { checkUpdates } = require('../../lib/util/check');

function infoAndCheckUpdates(vp, pkgWithCheck) {
  const pkg = pkgWithCheck.pkg;
  vp.logger.info('Publish package: ' + chalk.cyan(`${pkg.name}@${pkg.version}`));
  return Promise.resolve()
    .then(() => {
      if (pkgWithCheck) {
        return pkgWithCheck.check;
      } else {
        return checkUpdates(vp, pkg);
      }
    })
    .then(check => {
      if (check.changes.length === 0) {
        vp.logger.warn('There are no changes since last publish');
      } else {
        vp.logger.info(`There are ${check.changes.length} changes since last publish`);
      }
      return pkg;
    });
}

function askQuestion(pkg) {
  const answers = {};
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
      answers.tag = tag;
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
      answers.version = version;
      return answers;
    });
}
/*
 * load package and check status
 */
function loadAndCheck(vp, name) {
  return loadPackages(vp, name).then(pkgWithCheck => {
    if (pkgWithCheck.length > 1) {
      return new Select({
        name: 'package',
        message: 'Pick a package:',
        choices: pkgWithCheck.map(dir => {
          if (typeof dir === 'string') {
            return dir;
          } else {
            const len = dir.check.changes.length;
            if (!len) {
              return dir.dir;
            } else {
              return dir.dir + ` (${len})`;
            }
          }
        })
      })
        .run()
        .then(name => {
          if (name.indexOf('(') > -1) {
            name = name.replace(/\(\d*\)/, '').trim();
          }
          return loadPackages(vp, name, true);
        });
    }
    return pkgWithCheck[0];
  });
}
/*
 * interact publish a npm package
 */
function interactPublish(name, opt) {
  const verpub = new VerPub({ interact: opt.interact, dryRun: opt.dryRun });
  let publishOpt = {};
  return loadAndCheck(verpub, name)
    .then(pkgWithCheck => {
      // subdir publish
      if (pkgWithCheck.dir) {
        publishOpt.dir = pkgWithCheck.dir;
        publishOpt.pkg = pkgWithCheck.pkg;
        publishOpt.check = pkgWithCheck.check;
        publishOpt.cwd = path.join(verpub.opt.subPackage.dir, pkgWithCheck.dir);
      }
      return infoAndCheckUpdates(verpub, pkgWithCheck);
    })
    .then(askQuestion)
    .then(answer =>
      verpub.publish({
        ...answer,
        ...publishOpt
      })
    );
}

module.exports = function(name, opt) {
  name = name || '';
  if (opt.interact) {
    interactPublish(name, opt).catch(e => {
      console.error(e);
    });
  } else {
    let verpub = new VerPub();
    let param = Object.assign(
      {},
      {
        name: name,
        tag: opt.tag,
        version: opt.version && typeof opt.version === 'string' ? opt.version : '',
        interact: false,
        dryRun: opt.dryRun,
        desc: opt.desc,
        commitMsg: opt.commitMsg,
        commitSuffix: opt.commitSuffix
      },
      opt.increase ? { increase: opt.increase } : {}
    );
    verpub.publish(param).catch(e => {
      verpub.logger.error(e);
    });
  }
};
