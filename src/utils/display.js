'use strict';

const chalk = require('chalk');
const Table = require('cli-table3');

const GRADE_COLOR = {
  A: chalk.greenBright,
  B: chalk.green,
  C: chalk.yellow,
  D: chalk.red,
  F: chalk.redBright,
};

function gradeLabel(grade) {
  const fn = GRADE_COLOR[grade] || chalk.white;
  return fn.bold(` ${grade} `);
}

function scoreBar(score, width = 20) {
  const filled = Math.round((score / 100) * width);
  const empty  = width - filled;
  const color  = score >= 75 ? chalk.green : score >= 50 ? chalk.yellow : chalk.red;
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty)) + chalk.dim(` ${score}`);
}

function progressBar(completed, total, width = 24) {
  const pct    = total === 0 ? 0 : completed / total;
  const filled = Math.round(pct * width);
  const empty  = width - filled;
  return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function printRunSummary(run) {
  console.log('');
  console.log(chalk.bold('  Grade          ') + gradeLabel(run.grade));
  console.log(chalk.bold('  Pass Rate      ') + chalk.white(`${run.passRate}%`));
  console.log(chalk.bold('  Overall Score  ') + chalk.white(`${run.overallScore}/100`));
  console.log(chalk.bold('  Critical Fails ') + (run.criticalFailures?.length
    ? chalk.red(run.criticalFailures.length)
    : chalk.green('0')));

  if (run.reliabilityScore != null) {
    console.log('');
    const rColor = run.reliabilityScore >= 85 ? chalk.green : run.reliabilityScore >= 65 ? chalk.yellow : chalk.red;
    const dColor = run.decisionConsistency >= 85 ? chalk.green : run.decisionConsistency >= 65 ? chalk.yellow : chalk.red;
    console.log(chalk.bold('  Reliability    ') + rColor(`${run.reliabilityScore}/100`));
    console.log(chalk.bold('  Consistency    ') + dColor(`${run.decisionConsistency}%`));
    if (run.scoreDistribution?.length) {
      console.log(chalk.bold('  Per-repeat     ') + run.scoreDistribution.map((s, i) =>
        chalk.dim(`R${i + 1}:`) + chalk.white(s)
      ).join('  '));
    }
    if (run.reliabilityScore < 65) {
      console.log('');
      console.log(chalk.yellow('  ⚠  Low reliability — agent produces inconsistent results under identical inputs.'));
    }
  }
}

function printRubricTable(results) {
  if (!results || results.length === 0) return;

  const dims = ['accuracy', 'appropriateness', 'completeness', 'safety', 'compliance'];
  const totals = {};
  dims.forEach(d => { totals[d] = 0; });

  results.forEach(r => {
    if (r.rubricScores) {
      dims.forEach(d => { totals[d] += r.rubricScores[d] || 0; });
    }
  });

  const count = results.length;
  console.log('');
  console.log(chalk.bold.underline('  Rubric Breakdown'));
  console.log('');

  const table = new Table({
    chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    style: { head: [], border: ['dim'] },
    colWidths: [22, 32],
  });

  dims.forEach(d => {
    const avg = Math.round(totals[d] / count);
    table.push([chalk.white(capitalize(d)), scoreBar(avg)]);
  });

  console.log(table.toString());
}

function printCriticalFailures(run) {
  if (!run.criticalFailures?.length) return;
  console.log('');
  console.log(chalk.bold.red('  Critical Failures'));
  run.criticalFailures.forEach(title => {
    console.log(`  ${chalk.red('✗')} ${title}`);
  });
}

function printRecommendations(recommendations) {
  if (!recommendations?.length) return;
  console.log('');
  console.log(chalk.bold.underline('  Recommendations'));
  recommendations.slice(0, 8).forEach((rec, i) => {
    console.log(`  ${chalk.dim(`${i + 1}.`)} ${rec}`);
  });
}

function printDetailedResults(results) {
  if (!results?.length) return;
  console.log('');
  console.log(chalk.bold.underline('  Scenario Results'));
  console.log('');

  const failed = results.filter(r => !r.passed);
  const passed = results.filter(r => r.passed);

  [...failed, ...passed].forEach(r => {
    const icon   = r.passed ? chalk.green('✔') : chalk.red('✗');
    const title  = r.passed ? chalk.dim(r.scenarioTitle) : chalk.white(r.scenarioTitle);
    const score  = r.passed ? chalk.green(r.overallScore) : chalk.red(r.overallScore);
    const cf     = r.criticalFailure ? chalk.red.bold(' [CRITICAL]') : '';
    console.log(`  ${icon} ${title} ${chalk.dim('—')} ${score}/100${cf}`);
    if (!r.passed && r.reasoning) {
      console.log(`    ${chalk.dim(r.reasoning)}`);
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  gradeLabel,
  scoreBar,
  progressBar,
  printRunSummary,
  printRubricTable,
  printCriticalFailures,
  printRecommendations,
  printDetailedResults,
};
