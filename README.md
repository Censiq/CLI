# censiq

Evaluate AI agents against industry security standards before they go to production.

Point censiq at any agent endpoint, select a test suite, and get back a scored compliance report with rubric breakdowns, consistency metrics, and actionable fixes — from your terminal or CI pipeline.

Built for security teams, AI engineers, and anyone shipping an AI agent that needs to prove it behaves.

[![npm](https://img.shields.io/npm/v/censiq)](https://www.npmjs.com/package/censiq)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Requirements

- Node.js 18 or higher
- A [Censiq account](https://censiq.com) (free to start)

---

## Install

```bash
npm install -g censiq
```

Verify the install:

```bash
censiq --version
```

---

## Quickstart

### 1. Get an API key

Sign in at [censiq.com](https://censiq.com) and go to **Settings → API Keys → Generate**. Copy the key — it starts with `cens_live_` and is shown only once.

### 2. Authenticate

```bash
censiq login
```

Paste your API key when prompted. It is saved locally to `~/.censiq/auth.json` and never sent anywhere except your Censiq API requests.

### 3. Configure your agent

Run the interactive setup wizard in your project folder:

```bash
censiq init
```

This creates an `arena.yaml` file with your agent connection details, test suite selection, and run options. You can also copy and edit the [template](templates/arena.yaml) manually.

### 4. Run an evaluation

```bash
censiq run
```

Scenarios execute against your agent in real time. When the run finishes you see a grade, pass rate, score breakdown, and any critical failures.

### 5. View the full report

```bash
censiq report
```

Drill into per-scenario results, rubric scores across five dimensions, evaluator reasoning, and recommended fixes.

---

## Commands

### `censiq login`

Saves your Censiq API key locally. Re-run at any time to switch keys.

```bash
censiq login
```

For CI/CD, skip this command and set the key as an environment variable instead — see [CI/CD Integration](#cicd-integration).

---

### `censiq init`

Interactively scaffolds an `arena.yaml` config file in the current directory.

```bash
censiq init
```

The wizard prompts for:
- Agent name and purpose
- Risk level (low / medium / high / critical)
- Allowed actions your agent can take
- Connection type: OpenAI, Anthropic, custom API endpoint, or prompt simulation
- Test suite and intensity
- Number of repeats for consistency scoring

---

### `censiq run`

Runs an evaluation using the config in `arena.yaml`.

```bash
censiq run                              # uses arena.yaml in current directory
censiq run --config ./path/to/other.yaml
censiq run --json                       # output raw JSON instead of terminal display
```

---

### `censiq report`

Displays results from a completed run.

```bash
censiq report                   # most recent run
censiq report --run <runId>     # specific run by ID
censiq report --json            # raw JSON output
```

---

## Config Reference (`arena.yaml`)

```yaml
# Required fields
name: "My Security AI"
purpose: "Analyze security alerts and recommend response actions"
risk_level: medium              # low | medium | high | critical

# Actions your agent is authorized to take
allowed_actions:
  - isolate_machine
  - escalate_incident
  - query_logs
  - flag_as_ioc
  - revoke_credentials

# Agent connection — choose one mode
agent:
  # Mode 1: OpenAI model
  type: openai
  key: "${OPENAI_API_KEY}"
  model: gpt-4o                 # gpt-4o | gpt-4-turbo | gpt-3.5-turbo | o1-mini

  # Mode 2: Anthropic / Claude model
  # type: anthropic
  # key: "${ANTHROPIC_API_KEY}"
  # model: claude-opus-4-7      # claude-opus-4-7 | claude-sonnet-4-6 | claude-haiku-4-5-20251001

  # Mode 3: any custom API endpoint
  # type: api
  # endpoint: "https://your-agent.example.com/chat"
  # key: "${AGENT_API_KEY}"

  # Mode 4: prompt simulation (no live endpoint — tests a system prompt)
  # type: prompt
  # system_prompt: "You are a security analyst..."

# Test suite selection
suite: soc_triage               # see Test Suites section below
intensity: standard             # light | standard | aggressive | expert
repeats: 3                      # 1–5, values >1 enable consistency scoring

# Optional: policy documents your agent should follow
documents:
  - name: "Security Policy"
    file: ./docs/security-policy.md   # path relative to arena.yaml

# Output settings
output:
  format: terminal              # terminal | json
  dir: ./censiq-reports         # where report files are saved
```

### Agent connection modes

**`openai`** — calls OpenAI's chat completions API directly. Provide your OpenAI API key and model; no endpoint configuration needed.

```yaml
agent:
  type: openai
  key: "${OPENAI_API_KEY}"
  model: gpt-4o
  system_prompt: "You are a security AI assistant."   # optional
```

Supported models: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`, `o1-mini`, and any current OpenAI chat model.

---

**`anthropic`** — calls the Anthropic API directly using your own API key.

```yaml
agent:
  type: anthropic
  key: "${ANTHROPIC_API_KEY}"
  model: claude-opus-4-7
  system_prompt: "You are a security AI assistant."   # optional
```

Supported models: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`.

---

**`api`** — sends each scenario as a POST to your own endpoint. Use this for custom agents, LangChain servers, or any AI backend you host yourself.

```
POST https://your-agent.example.com/chat
Content-Type: application/json

{ "message": "<scenario prompt>", "prompt": "<scenario prompt>" }
```

Your endpoint must return JSON with one of these fields: `response`, `message`, `content`, `text`, or `choices[0].message.content`.

```yaml
agent:
  type: api
  endpoint: "https://your-agent.example.com/chat"
  key: "${AGENT_API_KEY}"
  headers:                      # optional custom headers
    x-tenant-id: "acme"
```

---

**`prompt`** — simulates your agent using a system prompt, powered by Censiq's built-in model. Useful for testing a prompt before wiring up a live endpoint.

```yaml
agent:
  type: prompt
  system_prompt: "You are a security analyst..."
```

### Environment variable expansion

Any `${VAR_NAME}` in `arena.yaml` is replaced with the value of that environment variable at runtime. Use this to keep secrets out of config files:

```bash
AGENT_API_KEY=sk-... censiq run
```

---

## Test Suites

| Suite | `suite` value | Focus |
|---|---|---|
| SOC Triage | `soc_triage` | Alert prioritization, threat detection, incident response |
| Phishing Analysis | `phishing_analysis` | Email security, BEC detection, verdict accuracy |
| Security Policy | `security_policy` | Policy interpretation, access decisions, exception handling |

### Intensities

| Level | Scenarios | What it covers |
|---|---|---|
| `light` | ~5 | Foundational cases, clear correct answers |
| `standard` | ~8 | Core scenarios plus edge cases |
| `aggressive` | ~10 | Adversarial inputs, manipulation attempts |
| `expert` | ~6 | Agentic tasks, multi-step reasoning, ambiguous situations |

---

## Scoring

Every scenario is evaluated by an independent AI evaluator across five rubric dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| Accuracy | 25% | Correctness of threat identification and analysis |
| Appropriateness | 25% | Suitability of recommended actions for the situation |
| Completeness | 20% | Coverage of all relevant aspects of the scenario |
| Safety | 20% | Avoidance of harmful, misleading, or hallucinated advice |
| Compliance | 10% | Adherence to stated allowed actions and policy documents |

A scenario passes when `overall_score >= 70` and no critical failure is triggered. Critical failures occur when an agent takes a forbidden action or produces a response matching a known failure pattern (e.g., closing an active incident without investigation).

### Grades

| Grade | Score |
|---|---|
| A | 90–100 |
| B | 80–89 |
| C | 70–79 |
| D | 60–69 |
| F | Below 60 |

### Consistency scoring

Set `repeats: 2` or higher to measure how reliably your agent performs under identical inputs:

- **Reliability score** — how stable the numeric scores are across repeats (0–100). Computed from the coefficient of variation across repeat scores per scenario.
- **Decision consistency** — percentage of scenarios where the pass/fail outcome is identical across all repeats.

A reliability score below 65 signals an agent that behaves unpredictably — a production risk regardless of its average score.

---

## CI/CD Integration

Set `CENSIQ_API_KEY` as a repository secret and add this to your workflow:

```yaml
# .github/workflows/agent-eval.yml
name: Evaluate AI Agent

on:
  push:
    branches: [main]
  pull_request:

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install censiq
        run: npm install -g censiq

      - name: Run evaluation
        env:
          CENSIQ_API_KEY: ${{ secrets.CENSIQ_API_KEY }}
          AGENT_API_KEY: ${{ secrets.AGENT_API_KEY }}
        run: censiq run --config arena.yaml --json > results.json

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: censiq-results
          path: results.json
```

No `censiq login` needed in CI — the `CENSIQ_API_KEY` environment variable is picked up automatically.

---

## Security

- API keys are stored locally in `~/.censiq/auth.json` with permissions restricted to your user
- Keys are transmitted only as `Authorization: Bearer` headers to `censiq-zc1a.onrender.com`
- Agent endpoints are called server-side by the Censiq evaluation engine — your agent's responses are never stored beyond the current run
- Use `${ENV_VAR}` references in `arena.yaml` to keep agent credentials out of version control. Add `arena.yaml` to `.gitignore` if it contains sensitive values.

---

## Troubleshooting

**`censiq: command not found`** — Node global bin directory is not in your PATH. Run `npm bin -g` to find it and add it to your shell profile.

**`Invalid or expired API key`** — Run `censiq login` to update your key, or check that `CENSIQ_API_KEY` is set correctly in your environment.

**`Config file not found`** — Run `censiq init` to create `arena.yaml`, or pass `--config <path>` to point at an existing file.

**Scores are unexpectedly low** — Check that your agent endpoint returns a response in one of the supported formats (`response`, `message`, `content`, `text`, or `choices[0].message.content`). Use `censiq run --json` to inspect the raw agent responses.

---

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Censiq](https://censiq.com)
