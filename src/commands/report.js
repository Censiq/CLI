'use strict';

const chalk   = require('chalk');
const ora     = require('ora');
const { readAuth, readLastRun }         = require('../utils/config');
const { getRunResults }                 = require('../utils/api');
const {
  printRunSummary, printRubricTable,
  printCriticalFailures, printRecommendations, printDetailedResults,
} = require('../utils/display');

async function report(opts) {
  if (!readAuth()?.key) {
    console.error(chalk.red('\n  No API key found. Run "censiq login" or set CENSIQ_API_KEY.\n'));
    process.exit(1);
  }

  let runId = opts.run;

  if (!runId) {
    const last = readLastRun();
    if (!last?.runId) {
      console.error(chalk.red('\n  No recent run found. Run "censiq run" first, or pass --run <runId>.\n'));
      process.exit(1);
    }
    runId = last.runId;
  }

  const spinner = ora({ text: 'Fetching results...', prefixText: ' ' }).start();
  let data;
  try {
    data = await getRunResults(runId);
    spinner.succeed('Results loaded');
  } catch (err) {
    spinner.fail(`Failed to load results: ${err.message}`);
    process.exit(1);
  }

  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const run     = data.run     || data;
  const results = data.results || [];

  console.log('');
  console.log(chalk.bold(`  ${run.suiteName || run.testSuite}  /  ${run.intensity}`));
  if (run.completedAt) {
    console.log(chalk.dim(`  Completed ${new Date(run.completedAt).toLocaleString()}`));
  }

  printRunSummary(run);
  printRubricTable(results);
  printCriticalFailures(run);
  printRecommendations(run.recommendations);
  printDetailedResults(results);

  console.log('');
  console.log(chalk.dim(`  Run ID: ${runId}`));
  console.log('');
}

module.exports = { report };
