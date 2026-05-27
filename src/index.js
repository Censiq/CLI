'use strict';

const { Command } = require('commander');
const { login }   = require('./commands/login');
const { init }    = require('./commands/init');
const { run }     = require('./commands/run');
const { report }  = require('./commands/report');

const program = new Command();

program
  .name('censiq')
  .description('Test AI agents against industry security standards')
  .version('0.1.0');

program
  .command('login')
  .description('Authenticate with your Censiq account')
  .action(login);

program
  .command('init')
  .description('Scaffold an arena.yaml config in the current directory')
  .action(init);

program
  .command('run')
  .description('Run an evaluation from arena.yaml')
  .option('-c, --config <path>', 'Path to config file', 'arena.yaml')
  .option('--json', 'Output results as JSON')
  .action(run);

program
  .command('report')
  .description('Display results from a completed run')
  .option('-r, --run <runId>', 'Run ID (defaults to last run)')
  .option('--json', 'Output results as JSON')
  .action(report);

program.parse(process.argv);
