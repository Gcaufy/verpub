const chalk = require('chalk');

exports = module.exports = function createLogger(interact, debug) {
  if (interact || debug) {
    return {
      info(msg) {
        console.log(chalk.blue('⦿ ') + msg);
      },
      warn(msg) {
        console.log(chalk.yellow('ϟ ') + msg);
      },
      success(msg) {
        console.log(chalk.green('✔ ') + msg);
      },
      error(e) {
        console.error(chalk.red('✘ ') + e);
      }
    };
  } else {
    return {
      info() {},
      warn() {},
      success() {},
      error(e) {
        console.error(chalk.red('✘ ') + e);
      }
    };
  }
};
