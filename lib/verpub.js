const path = require('path');
const fs = require('fs');
const readPkg = require('read-pkg');
const writePkg = require('write-pkg');
const semver = require('semver');

const createLogger = require('./log');
const createExecuter = require('./exec');

const getMinimumIncrease = require('./version').getMinimumIncrease;

const cwd = process.cwd();

const DEFAULT_OPT = {
  interact: false,
  increase: 'patch',
  subPackage: {
    dir: 'packages',
  },
  publish: {
    client: 'npm',
  },
  debug: false,
}

function tryLoad (file) {
  const p = path.join(cwd, file);
  if (fs.existsSync(p)) {
    return require(p);
  }
  return null;
}



module = module.exports = class VerPub {
  constructor (opt = {}) {
    this.pkg = tryLoad('package.json');
    this.cwd = cwd;

    let configOpt = tryLoad('verpub.config.js') || tryLoad('verpub.config.json');
    if (!configOpt && this.pkg) {
      configOpt = this.pkg.verpub;
    }

    this.opt = Object.assign({}, DEFAULT_OPT, configOpt, opt);
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

  publish (params = {}) {
    let opt = this.opt;
    let pkg = this.pkg;
    params = Object.assign({}, this.opt.minIncrease || {}, params);

    if (params.pkg) {
      params.name = params.pkg.name;
      pkg = params.pkg;
    } else if (params.name && !params.pkg && this.opt.subPackage.enable) {
      const cwd = path.join(this.opt.subPackage.dir, params.name);
      process.chdir(cwd);
      pkg = readPkg.sync({ cwd: './' });
      params.pkg = pkg;
    }

    if (params.increase && !params.version) {
      params.version = params.tag ? semver.inc(pkg.version, params.increase, params.tag) : semver.inc(pkg.version, params.increase);
    }
    return this.executer.isGitWorkTreeClean().catch(e => {
      if (this.opt.dryRun) {
        return;
      } else {
        throw e;
      }
    }).then(() => {
      this.executer.githash().then(hash => {
        let id = `${pkg.name}@${params.version}`;
        this.logger.info('Writing package.json');
        return writePkg(Object.assign({}, pkg, { version: params.version, _id: id, _commitid: hash })).then(() => {
          this.logger.info('Tag: ' + id);
          this.executer.gitadd('package.json').then(() => {
            return this.executer.gitcommit('release: ' + id);
          }).then(() => {
            return this.executer.gittag(id);
          }).then(() => {
            return this.executer.gitpush();
          }).then(() => {
            return this.executer.gitpushtag();
          }).then(() => {
            if (this.opt.publish && this.opt.publish.client && this.pkg) {
              this.logger.info('Pushing to ' + this.opt.publish.client);
              if (params.tag && params.tag !== 'release') {
                return this.executer.npmpublish(this.opt.publish.client, params.tag, this.opt.publish.options);
              } else {
                return this.executer.npmpublish(this.opt.publish.client, null, this.opt.publish.options);
              }
            }
          }).then(() => {
            this.logger.success('done');
            return true;
          });
        });
      });
    })
  }
}
