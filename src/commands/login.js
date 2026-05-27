'use strict';

const inquirer      = require('inquirer');
const chalk         = require('chalk');
const { writeAuth } = require('../utils/config');

async function login(opts) {
  console.log('');
  console.log(chalk.bold('  Censiq — Add API Key'));
  console.log(chalk.dim('  Generate a key at censiq.com → Settings → API Keys\n'));

  const { key } = await inquirer.prompt([
    {
      type: 'password',
      name: 'key',
      message: 'API key:',
      mask: '*',
      validate: v => v.startsWith('cens_') || 'Key must start with cens_  — generate one at censiq.com/settings',
    },
  ]);

  writeAuth({ key });
  console.log('');
  console.log(chalk.green('  ✔ API key saved'));
  console.log(`  ${chalk.dim('To switch keys, run')} ${chalk.cyan('censiq login')} ${chalk.dim('again.')}`);
  console.log('');
}

module.exports = { login };
