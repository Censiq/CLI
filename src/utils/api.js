'use strict';

const axios       = require('axios');
const { readAuth, clearAuth } = require('./config');

const BASE_URL = process.env.CENSIQ_API_URL || 'https://censiq-zc1a.onrender.com';

function getClient() {
  // CENSIQ_API_KEY env var takes precedence over saved auth file
  const apiKey = process.env.CENSIQ_API_KEY || readAuth()?.key;
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return axios.create({ baseURL: BASE_URL, headers, timeout: 30000 });
}

async function request(method, url, data) {
  const client = getClient();
  try {
    const res = await client[method](url, data);
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      clearAuth();
      throw new Error('Invalid or expired API key. Run "censiq login" to update it.');
    }
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    throw new Error(msg);
  }
}

async function postArena(body) {
  return request('post', '/api/arena', body);
}

async function postRun(arenaId, body) {
  return request('post', `/api/arena/${arenaId}/run`, body);
}

async function getRun(runId) {
  return request('get', `/api/arena-run/${runId}`);
}

async function getRunResults(runId) {
  return request('get', `/api/arena-run/${runId}/results`);
}

async function getSuites() {
  return request('get', '/api/test-suite');
}

module.exports = {
  postArena,
  postRun,
  getRun,
  getRunResults,
  getSuites,
};
