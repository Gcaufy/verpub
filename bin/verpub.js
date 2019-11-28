#!/usr/bin/env node

const commander = require('commander');

commander
  .command('init')
  .action(require('./cmd/init'))
  .command('publish [name]')
  .option('-t, --tag <tag>', 'publish tag')
  .option('-v, --version <ver>', 'publish version')
  .option('-i, --increase <increase>', 'version increase')
  .option('-q, --no-interact', 'with out interact')
  .option('--dry-run', 'dry run test')
  .action(require('./cmd/publish'));

commander.parse(process.argv);
