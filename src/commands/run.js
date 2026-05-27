'use strict';

const chalk   = require('chalk');
const ora     = require('ora');
const {
  readArenaConfig, readAuth, writeLastRun, readDocumentFile,
} = require('../utils/config');
const {
  postArena, postRun, getRun,
} = require('../utils/api');
const {
  progressBar, printRunSummary, printRubricTable,
  printCriticalFailures, printRecommendations,
} = require('../utils/display');

const POLL_MS    = 2500;
const MAX_POLLS  = 360; // 15 min max

async function run(opts) {
  // Auth check
  if (!readAuth()?.key) {
    console.error(chalk.red('\n  No API key found. Run "censiq login" or set CENSIQ_API_KEY.\n'));
    process.exit(1);
  }

  // Load config
  let cfg;
  try {
    cfg = readArenaConfig(opts.config);
  } catch (err) {
    console.error(chalk.red(`\n  ${err.message}\n`));
    process.exit(1);
  }

  // Resolve documents
  const documents = [];
  if (cfg.documents?.length) {
    for (const doc of cfg.documents) {
      try {
        const content = doc.file ? readDocumentFile(doc.file) : (doc.content || '');
        documents.push({ name: doc.name, content });
      } catch (err) {
        console.error(chalk.yellow(`  ⚠ Skipping document "${doc.name}": ${err.message}`));
      }
    }
  }

  // Build arena payload
  const agentCfg   = cfg.agent || {};
  const arenaBody  = {
    name:           cfg.name,
    purpose:        cfg.purpose,
    agentType:      'security_ai',
    riskLevel:      cfg.risk_level || 'medium',
    allowedActions: cfg.allowed_actions || [],
    connectionType: agentCfg.type || 'prompt',
    ...(agentCfg.type === 'api'
      ? {
          apiEndpoint: agentCfg.endpoint,
          apiKey:      agentCfg.key || '',
          apiHeaders:  agentCfg.headers || {},
        }
      : {
          systemPrompt: agentCfg.system_prompt || '',
        }),
    documents,
    status: 'ready',
  };

  const runBody = {
    testSuite:   cfg.suite,
    intensity:   cfg.intensity  || 'standard',
    repeatCount: cfg.repeats    || 1,
  };

  console.log('');
  console.log(chalk.bold(`  ${cfg.name}`));
  console.log(chalk.dim(`  ${cfg.suite} / ${runBody.intensity}`) +
    (runBody.repeatCount > 1 ? chalk.dim(` × ${runBody.repeatCount} repeats`) : ''));
  console.log('');

  // Create arena
  const createSpinner = ora({ text: 'Creating arena...', prefixText: ' ' }).start();
  let arena;
  try {
    arena = await postArena(arenaBody);
    createSpinner.succeed('Arena created');
  } catch (err) {
    createSpinner.fail(`Failed to create arena: ${err.message}`);
    process.exit(1);
  }

  // Start run
  const runSpinner = ora({ text: 'Starting run...', prefixText: ' ' }).start();
  let runDoc;
  try {
    runDoc = await postRun(arena._id || arena.id, runBody);
    runSpinner.succeed('Run started');
  } catch (err) {
    runSpinner.fail(`Failed to start run: ${err.message}`);
    process.exit(1);
  }

  const runId = runDoc._id || runDoc.id || runDoc.runId;
  writeLastRun({ runId, arenaId: arena._id || arena.id, suite: cfg.suite, intensity: runBody.intensity });

  console.log('');

  // Poll for progress
  const progressSpinner = ora({ prefixText: ' ' }).start();
  let polls = 0;
  let completed = false;
  let finalRun;

  while (polls < MAX_POLLS) {
    await sleep(POLL_MS);
    polls++;

    let current;
    try {
      current = await getRun(runId);
    } catch {
      // transient error — keep polling
      continue;
    }

    const p = current.progress || {};
    const total     = p.total     || 0;
    const done      = p.completed || 0;
    const passed    = p.passed    || 0;
    const failed    = p.failed    || 0;
    const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
    const bar       = progressBar(done, total);

    progressSpinner.text =
      `${bar}  ${done}/${total} scenarios  ` +
      chalk.green(`${passed} passed`) + '  ' +
      (failed > 0 ? chalk.red(`${failed} failed`) : chalk.dim('0 failed')) +
      chalk.dim(`  ${pct}%`);

    if (current.status === 'completed') {
      progressSpinner.succeed('Run complete');
      finalRun = current;
      completed = true;
      break;
    }

    if (current.status === 'failed') {
      progressSpinner.fail('Run failed');
      console.error(chalk.red(`\n  ${current.summary || 'Unknown error'}\n`));
      process.exit(1);
    }
  }

  if (!completed) {
    progressSpinner.fail('Timed out waiting for run to complete');
    console.log(chalk.dim(`\n  Run ID: ${runId}`));
    console.log(chalk.dim(`  Check results later with: censiq report --run ${runId}\n`));
    process.exit(1);
  }

  // Output results
  if (opts.json) {
    console.log(JSON.stringify(finalRun, null, 2));
    return;
  }

  printRunSummary(finalRun);

  if (finalRun.criticalFailures?.length) {
    printCriticalFailures(finalRun);
  }

  if (finalRun.recommendations?.length) {
    printRecommendations(finalRun.recommendations);
  }

  console.log('');
  console.log(chalk.dim(`  Run ID: ${runId}`));
  console.log(`  ${chalk.cyan('censiq report')} ${chalk.dim('— full breakdown with scenario details')}`);
  console.log('');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { run };
