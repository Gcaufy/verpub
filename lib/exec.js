const execa = require('execa');

module = module.exports = function createExecuter (debug, dryRun) {
  let exec = execa;
  if (debug) {
    exec = function (client, params) {
      console.debug('DEBUG: ', client + ' ' + params.join(' '));
      return execa(client, params);
    }
  }
  if (dryRun) {
    exec = function (client, params) {
      if (['add', 'commit', 'tag', 'push', 'publish'].indexOf(params[0]) > -1) {
        console.debug('DRY RUN: ', client + ' ' + params.join(' '));
        return Promise.resolve(true);
      } else {
        console.debug('EXEC: ', client + ' ' + params.join(' '));
        return execa(client, params);
      }
    }
  }
  return {
    isGitWorkTreeClean () {
      return exec('git', ['status', '-s']).then(rst => {
        let output = rst.stderr || rst.stdout;
        if (rst.stderr) {
          throw new Error(rst.stderr);
        } else if (rst.stdout) {
          throw new Error('Work tree is not clean, check "git status"');
        }
        return true;
      });
    },
    githash () {
      return  exec('git', ['rev-parse', '--short', 'HEAD']).then(rst => rst.stdout);
    },
    gitadd (files) {
      return exec('git', ['add'].concat(files));
    },
    gitcommit (msg) {
      return exec('git', ['commit', '-m', `${msg}` , '--no-verify']);
    },
    gittag (msg) {
      return exec('git', ['tag', `${msg}`]);
    },
    gitpush () {
      return exec('git', ['push']);
    },
    gitpushtag () {
      return exec('git', ['push', '--tags']);
    },
    npmpublish (client, tag, option) {
      const publishParams = ['publish'].concat(option);
      return exec(client, tag ? publishParams.concat(['--tag', tag]) : publishParams);
    },
  }
};

