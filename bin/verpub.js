#!/usr/bin/env node

const commander = require('commander');
const VerPub = require('../lib/verpub');

const interactPublish = require('./interact');


commander.command('publish [name]')
.option('-t, --tag <tag>', 'publish tag')
.option('-v, --version <ver>', 'publish version')
.option('-i, --increase <increase>', 'version increase')
.option('-q, --no-interact', 'with out interact')
.option('--dry-run', 'dry run test')
.action(function (name, opt) {
  name = name || '';

  if (opt.interact) {
    interactPublish(name, opt).catch(e => {
      console.error(e);
    });
  } else {
    let verpub = new VerPub();
    verpub.publish({
      name: name,
      tag: opt.tag,
      increase: opt.increase,
      interact: false,
      dryRun: opt.dryRun,
    }).catch(e => {
      verpub.logger.error(e);
    });
  }
});

commander.parse(process.argv);
