# censiq

Evaluate AI agents against industry standards before they go to production.

Point censiq at any agent endpoint, select a test suite (SOC triage, phishing analysis, security policy, and more), and get back a scored compliance report with rubric breakdowns, consistency metrics, and actionable fixes.

Built for security teams, AI engineers, and anyone shipping an AI agent that needs to prove it behaves.

---

## Install

```bash
npm install -g censiq
```

Requires Node 18+.

---

## Quickstart

```bash
censiq login          # authenticate with your Censiq account
censiq init           # scaffold arena.yaml interactively
censiq run            # run the evaluation
censiq report         # view full results
```

---

## Commands

### `censiq login`
Authenticate with your Censiq account. Saves a session token to `~/.censiq/auth.json`.

### `censiq init`
Interactively scaffold an `arena.yaml` config file in the current directory. Prompts for agent connection, test suite, intensity, and repeat count.

### `censiq run`
Run an evaluation from `arena.yaml`.

```bash
censiq run                        # uses arena.yaml in current directory
censiq run --config ./path/to/arena.yaml
censiq run --json                 # output raw JSON
```

### `censiq report`
Display results from a completed run.

```bash
censiq report                     # last run
censiq report --run <runId>       # specific run
censiq report --json              # raw JSON
```

---

## Config (`arena.yaml`)

```yaml
name: "My Security AI"
purpose: "Analyze security alerts and recommend response actions"
risk_level: medium            # low | medium | high | critical

allowed_actions:
  - isolate_machine
  - escalate_incident
  - query_logs

agent:
  type: api                   # api | prompt
  endpoint: "https://my-agent.example.com/chat"
  key: "${AGENT_API_KEY}"     # reads from env

suite: soc_triage             # soc_triage | phishing_analysis | security_policy
intensity: standard           # light | standard | aggressive | expert
repeats: 3                    # >1 enables consistency scoring

documents:
  - name: "Security Policy"
    file: ./docs/security-policy.md

output:
  format: terminal            # terminal | json
```

### Agent connection modes

**API** — calls your live agent over HTTP. Expects a POST endpoint that accepts `{ message, prompt }` and returns a response field.

**Prompt** — simulates an agent using a system prompt. Useful for testing prompt behavior before wiring up a full endpoint.

### Consistency scoring

Set `repeats: 3` (or higher) to run each scenario multiple times and measure:
- **Reliability score** — how consistent the scores are across repeats (0–100)
- **Decision consistency** — % of scenarios with the same pass/fail across all repeats

Low reliability signals an agent that behaves unpredictably under identical inputs.

---

## Test Suites

| Suite | Focus |
|---|---|
| `soc_triage` | SOC analyst alerting, threat detection, incident response |
| `phishing_analysis` | Email security, phishing identification, user guidance |
| `security_policy` | Policy interpretation, access decisions, compliance reasoning |

Each suite runs at four intensities: `light`, `standard`, `aggressive`, `expert`.

---

## CI/CD Integration

```yaml
# .github/workflows/agent-eval.yml
- name: Evaluate agent
  run: |
    npm install -g censiq
    censiq login  # use CENSIQ_EMAIL + CENSIQ_PASSWORD secrets
    censiq run --config arena.yaml --json > results.json
```

Set `CENSIQ_EMAIL` and `CENSIQ_PASSWORD` as repository secrets, or use `CENSIQ_API_URL` to point at a self-hosted instance.

---

## License

MIT — see [LICENSE](LICENSE).
