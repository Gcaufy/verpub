const { prompt } = require('enquirer');
const readPkg = require('read-pkg');
const writeJsonFile = require('write-json-file');
const path = require('path');
const fs = require('fs');
const createLogger = require('../../lib/log');

const logger = createLogger(true);

const questions = [
  {
    name: 'client',
    type: 'select',
    required: true,
    message: 'Publish client',
    choices: ['npm', 'yarn', 'None']
  },
  {
    name: 'config',
    type: 'select',
    required: true,
    message: 'Configuration File',
    choices: ['verpub.config.js', 'package.json']
  }
];

function checkIsInitAlready(pkg) {
  if (pkg.scripts.release || pkg.scripts['release:dry']) {
    throw new Error('release[:dry] command already defined in package.json');
  }
  if (pkg.verpub) {
    throw new Error('verpub option is already defined in package.json');
  }
  return pkg;
}

function askQuestion(pkg) {
  return prompt(questions).then(res => {
    writeConfig(pkg, res);
    return pkg;
  });
}
function writePkg(pkg) {
  pkg.scripts.release = './node_modules/.bin/verpub publish';
  pkg.scripts['release:dry'] = './node_modules/.bin/verpub --dry-run';
  return writeJsonFile(path.join(process.cwd(), 'package.json'), pkg, {
    detectIndent: true,
    normalize: true
  }).then(() => {
    logger.success('Write package.json success');
  });
}
function writeConfig(pkg, opt) {
  let output = {};
  if (opt.client === 'none') {
    opt.publish = false;
  } else {
    output.publish = {
      client: opt.client
    };
  }
  output.tag = '{name}@{version}';

  if (opt.config === 'package.json') {
    pkg.verpub = output;
  } else {
    let outputStr = JSON.stringify(output, null, 2);
    if (path.parse(opt.config).ext === '.js') {
      outputStr = 'module.exports = ' + outputStr;
    }
    fs.writeFileSync(path.join(process.cwd(), opt.config), outputStr);
    logger.success('Write file success: ' + opt.config);
  }
  return output;
}
module.exports = function cmdInit() {
  readPkg()
    .then(checkIsInitAlready)
    .then(askQuestion)
    .then(writePkg)
    .catch(e => {
      logger.error('Failed: ' + e.message);
    });
};
