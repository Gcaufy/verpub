const chalk = require('chalk');

module = module.exports = function createLogger (interact, debug, dryRun) {
  if (interact || debug) {
    return {
      info (msg) {
        console.log(chalk.yellow('⦿ ') + msg);
      },
      success (msg) {
        console.log(chalk.green('✔ ') + msg);
      },
      error (e) {
        console.error(chalk.red('✘ ') + e);
      }
    };
  } else {
    return {
      info () {},
      success () {},
      error (e) {
        console.error(chalk.red('✘ ') + e);
      }
    }
  }
}
