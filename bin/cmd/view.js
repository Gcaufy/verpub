const chalk = require('chalk');
const timeAgo = require('node-time-ago');
const VerPub = require('../../lib/verpub');
const { loadPackages } = require('../../lib/util/package');

function pad(s, l) {
  while (s.length < l) {
    s = s + ' ';
  }
  return s;
}

function standardOutput(item, showDetail) {
  const { changes, remote } = item.check;
  const latested = remote.versions ? remote.versions.pop() : null;
  const latestedDate = remote.time ? remote.time[latested] : null;
  const ago = latestedDate ? timeAgo(new Date(latestedDate)) : null;
  const len = changes.length;

  console.log(
    ' ' +
      (len ? chalk.red(len) : chalk.gray(len)) +
      ' ' +
      chalk.underline.green(item.pkg.name) +
      chalk.underline.white('@') +
      chalk.underline.green(item.pkg.version) +
      (latested ? ' | latest publish: ' + chalk.yellow(latested) + ` <${chalk.blue(ago)}>` : '')
  );

  if (showDetail) {
    changes.forEach(item => {
      if (item.status && item.file) {
        console.log(chalk.gray(`  ${pad(item.status, 5)}  ${item.file}`));
      }
    });
  }
}

module.exports = function cmdView(name, opt) {
  const verpub = new VerPub({ interact: opt.interact, dryRun: opt.dryRun });

  loadPackages(verpub, name).then(pkgWitchCheck => {
    pkgWitchCheck.forEach(item => {
      standardOutput(item, opt.list);
    });
  });
};
