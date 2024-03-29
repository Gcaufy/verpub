#!/usr/bin/env node

const commander = require('commander');

commander.command('init').action(require('./cmd/init'));

commander
  .command('view [name]')
  .option('-l, --list', 'show changed file list')
  .action(require('./cmd/view'));

commander
  .command('publish [name]')
  .option('-t, --tag <tag>', 'publish tag')
  .option('-v, --version <ver>', 'publish version')
  .option('-i, --increase <increase>', 'version increase')
  .option('-d, --desc <description>', 'tag description')
  .option('-q, --no-interact', 'with out interact')
  .option('--dry-run', 'dry run test')
  .action(require('./cmd/publish'));

commander.parse(process.argv);
