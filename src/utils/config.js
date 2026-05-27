'use strict';

const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const yaml    = require('js-yaml');

const AUTH_DIR  = path.join(os.homedir(), '.censiq');
const AUTH_FILE = path.join(AUTH_DIR, 'auth.json');
const LAST_RUN  = path.join(process.cwd(), '.censiq-last-run.json');

function readAuth() {
  // CENSIQ_API_KEY env var takes precedence — no file needed in CI
  if (process.env.CENSIQ_API_KEY) return { key: process.env.CENSIQ_API_KEY };
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeAuth(data) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2));
}

function clearAuth() {
  try { fs.unlinkSync(AUTH_FILE); } catch {}
}

function readArenaConfig(configPath) {
  const resolved = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Config file not found: ${resolved}\nRun "censiq init" to create one.`);
  }
  const raw = fs.readFileSync(resolved, 'utf8');
  // Expand ${ENV_VAR} references
  const expanded = raw.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] || '');
  return yaml.load(expanded);
}

function readLastRun() {
  try {
    return JSON.parse(fs.readFileSync(LAST_RUN, 'utf8'));
  } catch {
    return null;
  }
}

function writeLastRun(data) {
  fs.writeFileSync(LAST_RUN, JSON.stringify(data, null, 2));
}

// Read a document file referenced in arena.yaml
function readDocumentFile(filePath) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Document file not found: ${resolved}`);
  }
  return fs.readFileSync(resolved, 'utf8');
}

module.exports = {
  readAuth,
  writeAuth,
  clearAuth,
  readArenaConfig,
  readLastRun,
  writeLastRun,
  readDocumentFile,
};
