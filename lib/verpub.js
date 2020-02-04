const path = require('path');
const fs = require('fs');
const readPkg = require('read-pkg');
const writeJsonFile = require('write-json-file');
const semver = require('semver');
const replaceInFile = require('replace-in-file');
const chalk = require('chalk');
const deepmerge = require('deepmerge');

const createLogger = require('./log');
const createExecuter = require('./exec');

const getMinimumIncrease = require('./version').getMinimumIncrease;
const tagUtil = require('./util/tag');

const cwd = process.cwd();
const DEFAULT_OPT = {
  interact: false,
  increase: 'patch',
  usePkg: 'package.json',
  subPackage: {
    dir: 'packages'
  },
  publish: {
    client: 'npm'
  },
  tag: '{name}@{version}',
  debug: false
};

function tryLoad(file) {
  const p = path.join(cwd, file);
  if (fs.existsSync(p)) {
    return require(p);
  }
  return null;
}

function replaceFiles(logger, files, from, to) {
  let filesArr = [];
  let expected = {};

  files.forEach(file => {
    if (typeof file === 'string') {
      filesArr.push(file);
    } else {
      filesArr.push(file.file);
      expected[path.resolve(file.file)] = file.expected;
    }
  });

  logger.info('Writing version files');
  const replaceRst = replaceInFile.sync({
    files: filesArr,
    from,
    to,
    countMatches: true
  });

  replaceRst.forEach(rst => {
    const p = path.resolve(rst.file);
    if (expected[p] !== undefined) {
      if (expected[p] === rst.numMatches && expected[p] === rst.numReplacements) {
        logger.info(
          `In ${chalk.gray(rst.file)} ${chalk.red(rst.numMatches)} matched and ${chalk.green(
            rst.numReplacements
          )} replaced as expected`
        );
      } else {
        throw new Error(
          `In ${chalk.gray(rst.file)} ${chalk.red(rst.numMatches)} matched and ${chalk.green(
            rst.numReplacements
          )} replaced, but expected ${chalk.green(expected[p])}`
        );
      }
    } else {
      if (rst.hasChanged) {
        logger.info(
          `In ${chalk.gray(rst.file)} ${chalk.red(rst.numMatches)} matched and ${chalk.green(
            rst.numReplacements
          )} replaced`
        );
      } else {
        logger.warn(
          `In ${chalk.gray(rst.file)} ${chalk.red(rst.numMatches)} matched and ${chalk.green(
            rst.numReplacements
          )} replaced`
        );
      }
    }
  });
  return filesArr;
}

exports = module.exports = class VerPub {
  constructor(opt = {}) {
    this.cwd = cwd;

    let configOpt = tryLoad('verpub.config.js') || tryLoad('verpub.config.json');
    if (!configOpt) {
      this.pkg = tryLoad(DEFAULT_OPT.usePkg);
      if (this.pkg) {
        configOpt = this.pkg.verpub;
      }
    }
    this.opt = deepmerge.all([{}, DEFAULT_OPT, configOpt || {}, opt]);

    this.pkg = tryLoad(this.opt.usePkg);
    if (this.opt.subPackage.enable === undefined && this.opt.subPackage.dir) {
      if (!path.isAbsolute(this.opt.subPackage.dir)) {
        this.opt.subPackage.path = path.resolve(this.cwd, this.opt.subPackage.dir);
      } else {
        this.opt.subPackage.path = this.opt.subPackage.dir;
      }
      let enable = false;
      try {
        enable = fs.statSync(this.opt.subPackage.path).isDirectory();
      } catch (e) {
        if (e.code === 'ENOENT') {
          enable = false;
        }
      }
      this.opt.subPackage.enable = enable;
    }
    if (this.pkg) {
      this.opt.minIncrease = getMinimumIncrease(this.pkg.version);
    }

    this.logger = createLogger(this.opt.interact, this.opt.debug, this.opt.dryRun);
    this.executer = createExecuter(this.opt.debug, this.opt.dryRun);
  }

  publish(params = {}) {
    let pkg = this.pkg;
    params = Object.assign({}, this.opt.minIncrease || {}, params);

    if (params.pkg) {
      params.name = params.pkg.name;
      pkg = params.pkg;
    }

    if (params.increase && !params.version) {
      params.version = params.tag
        ? semver.inc(pkg.version, params.increase, params.tag)
        : semver.inc(pkg.version, params.increase);
    }
    return this.executer
      .isGitWorkTreeClean()
      .catch(e => {
        if (this.opt.dryRun) {
          return;
        } else {
          throw e;
        }
      })
      .then(() => {
        return this.executer.githash().then(hash => {
          let id = `${pkg.name}@${params.version}`;
          let changedFiles = [];
          const targetPkgJsonFile = path.join(params.cwd || process.cwd(), this.opt.usePkg);
          if (this.opt.files && this.opt.files.length) {
            changedFiles = replaceFiles(
              this.logger,
              this.opt.files,
              new RegExp(pkg.version.replace(/\\/g, '\\\\').replace(/\./g, '\\.'), 'g'),
              params.version
            );
          }
          this.logger.info('Writing ' + targetPkgJsonFile);
          changedFiles.push(targetPkgJsonFile);
          return writeJsonFile(
            targetPkgJsonFile,
            Object.assign({}, pkg, {
              version: params.version,
              _id: id,
              _commitid: hash
            }),
            {
              detectIndent: true,
              normalize: true
            }
          ).then(() => {
            const tag = tagUtil.loadTag(this.opt.tag, {
              name: pkg.name,
              version: params.version,
              tag: params.tag,
              increase: params.increase
            });
            this.logger.info('Tag: ' + tag);
            this.executer
              .gitadd(changedFiles)
              .then(() => {
                return this.executer.gitcommit('release: ' + tag);
              })
              .then(() => {
                return this.executer.gittag(tag);
              })
              .then(() => {
                return this.executer.gitpush();
              })
              .then(() => {
                return this.executer.gitpushtag();
              })
              .then(() => {
                if (this.opt.publish && this.opt.publish.client && this.pkg) {
                  this.logger.info('Pushing to ' + this.opt.publish.client);
                  let cwd = process.cwd();
                  if (this.opt.subPackage.path && params.dir) {
                    cwd = path.join(this.opt.subPackage.path, params.dir);
                  }
                  if (params.tag && params.tag !== 'release') {
                    return this.executer.npmpublish(this.opt.publish.client, params.tag, this.opt.publish.options, {
                      cwd
                    });
                  } else {
                    return this.executer.npmpublish(this.opt.publish.client, null, this.opt.publish.options, { cwd });
                  }
                }
              })
              .then(() => {
                this.logger.success('done');
                return true;
              })
              .catch(e => {
                this.logger.error('Error: ' + e.message);
              })
          });
        });
      });
  }
};
