'use strict';

const inquirer  = require('inquirer');
const chalk     = require('chalk');
const fs        = require('fs');
const path      = require('path');
const yaml      = require('js-yaml');
const { getSuites } = require('../utils/api');
const { readAuth }  = require('../utils/config');

const ALLOWED_ACTIONS = [
  'isolate_machine', 'escalate_incident', 'query_logs', 'revoke_credentials',
  'block_ip', 'flag_as_ioc', 'notify_user', 'create_ticket',
  'run_forensics', 'restore_system', 'close_as_benign', 'request_approval',
];

async function init() {
  const outPath = path.join(process.cwd(), 'arena.yaml');

  if (fs.existsSync(outPath)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: 'arena.yaml already exists. Overwrite?',
      default: false,
    }]);
    if (!overwrite) {
      console.log(chalk.dim('\n  Cancelled.\n'));
      return;
    }
  }

  console.log('');
  console.log(chalk.bold('  Censiq — New Arena Config'));
  console.log(chalk.dim('  Configure your AI agent for evaluation\n'));

  // Fetch live suites if logged in
  let suiteChoices = [
    { name: 'SOC Triage', value: 'soc_triage' },
    { name: 'Phishing Analysis', value: 'phishing_analysis' },
    { name: 'Security Policy', value: 'security_policy' },
  ];

  if (readAuth()) {
    try {
      const res = await getSuites();
      if (res.suites?.length) {
        suiteChoices = res.suites.map(s => {
          const total = Object.values(s.scenarioCounts || {}).reduce((a, b) => a + b, 0);
          return {
            name: `${s.name}${total ? ` (${total} scenarios)` : ''}`,
            value: s.id,
          };
        });
      }
    } catch {}
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Arena name:',
      default: 'My Security AI',
      validate: v => v.trim().length > 0 || 'Name required',
    },
    {
      type: 'input',
      name: 'purpose',
      message: 'What does this agent do?',
      default: 'Analyze security alerts and recommend response actions',
      validate: v => v.trim().length > 0 || 'Purpose required',
    },
    {
      type: 'list',
      name: 'risk_level',
      message: 'Risk level:',
      choices: [
        { name: 'Low     — internal tooling, low-stakes decisions', value: 'low' },
        { name: 'Medium  — ops workflows, some customer impact',    value: 'medium' },
        { name: 'High    — incident response, significant impact',  value: 'high' },
        { name: 'Critical — autonomous actions, critical systems',  value: 'critical' },
      ],
      default: 'medium',
    },
    {
      type: 'checkbox',
      name: 'allowed_actions',
      message: 'Allowed actions (space to select):',
      choices: ALLOWED_ACTIONS,
      default: ['isolate_machine', 'escalate_incident', 'query_logs'],
    },
    {
      type: 'list',
      name: 'agent_type',
      message: 'Connection type:',
      choices: [
        { name: 'API endpoint — call a live agent over HTTP', value: 'api' },
        { name: 'System prompt — simulate with a prompt',    value: 'prompt' },
      ],
    },
    {
      type: 'input',
      name: 'api_endpoint',
      message: 'Agent endpoint URL:',
      when: a => a.agent_type === 'api',
      validate: v => v.startsWith('http') || 'Enter a valid URL',
    },
    {
      type: 'confirm',
      name: 'has_api_key',
      message: 'Does the endpoint require an API key?',
      when: a => a.agent_type === 'api',
      default: true,
    },
    {
      type: 'input',
      name: 'api_key_env',
      message: 'Environment variable holding the key:',
      when: a => a.agent_type === 'api' && a.has_api_key,
      default: 'AGENT_API_KEY',
    },
    {
      type: 'editor',
      name: 'system_prompt',
      message: 'System prompt (editor will open):',
      when: a => a.agent_type === 'prompt',
    },
    {
      type: 'list',
      name: 'suite',
      message: 'Test suite:',
      choices: suiteChoices,
    },
    {
      type: 'list',
      name: 'intensity',
      message: 'Intensity:',
      choices: [
        { name: 'Light      — foundational scenarios, ~5 min',      value: 'light' },
        { name: 'Standard   — core + edge cases, ~10 min',          value: 'standard' },
        { name: 'Aggressive — adversarial inputs, ~18 min',         value: 'aggressive' },
        { name: 'Expert     — agentic + multi-step, ~30 min',       value: 'expert' },
      ],
      default: 'standard',
    },
    {
      type: 'list',
      name: 'repeats',
      message: 'Repeats (>1 enables consistency scoring):',
      choices: [
        { name: '1 — single pass',                    value: 1 },
        { name: '2 — basic consistency check',        value: 2 },
        { name: '3 — recommended',                    value: 3 },
        { name: '5 — high-confidence consistency',    value: 5 },
      ],
      default: 3,
    },
  ]);

  // Build config object
  const config = {
    name: answers.name,
    purpose: answers.purpose,
    risk_level: answers.risk_level,
    allowed_actions: answers.allowed_actions,
    agent: answers.agent_type === 'api'
      ? {
          type: 'api',
          endpoint: answers.api_endpoint,
          ...(answers.has_api_key ? { key: `\${${answers.api_key_env}}` } : {}),
        }
      : {
          type: 'prompt',
          system_prompt: answers.system_prompt?.trim() || 'You are a helpful security analyst.',
        },
    suite: answers.suite,
    intensity: answers.intensity,
    repeats: answers.repeats,
    documents: [],
    output: {
      format: 'terminal',
      dir: './censiq-reports',
    },
  };

  fs.writeFileSync(outPath, yaml.dump(config, { lineWidth: 100, quotingType: '"' }));

  console.log('');
  console.log(chalk.green('  ✔ arena.yaml created'));
  console.log('');
  console.log(chalk.dim('  Next steps:'));
  console.log(`  ${chalk.cyan('censiq run')}    — start an evaluation`);
  console.log(`  ${chalk.cyan('censiq report')} — view results after the run`);
  console.log('');
}

module.exports = { init };
