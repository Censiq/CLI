# Contributing to the Censiq CLI

The CLI is a thin client that talks to the Censiq API. Contributions here focus on the developer experience: commands, output formatting, config handling, agent adapters, and CI/CD integration.

If you want to contribute new test scenarios or packs, see the [standard-packs repository](https://github.com/Censiq/standard-packs) instead — that's where the evaluation content lives.

---

## What to work on

Check the [issues list](https://github.com/Censiq/CLI/issues) for open bugs and feature requests. The most impactful contribution areas:

**Output formats** — the CLI currently outputs to the terminal or JSON. Useful additions:
- `--format sarif` — Security Alert Results Interchange Format for GitHub Code Scanning
- `--format junit` — JUnit XML for Jenkins, CircleCI, and most CI dashboards
- `--format html` — a self-contained report file

**Shell completions** — bash, zsh, and fish completions for `censiq <TAB>`

**Agent adapters** — named adapters for popular frameworks so users don't have to configure endpoint format manually:
```bash
censiq run --adapter langchain
censiq run --adapter openai
censiq run --adapter bedrock
```

**Bug fixes** — see issues labeled `bug`

---

## Local setup

```bash
git clone https://github.com/Censiq/CLI.git
cd CLI
npm install
npm link           # makes `censiq` available globally from this local build
```

Set your API key:

```bash
censiq login       # paste a key from censiq.com/settings
# or
export CENSIQ_API_KEY=cens_live_...
```

Point at a local server during development:

```bash
export CENSIQ_API_URL=http://localhost:5001
```

---

## Project structure

```
bin/censiq.js          Entry point (shebang + require)
src/
  index.js             Commander setup — all commands registered here
  commands/
    login.js           censiq login
    init.js            censiq init (interactive wizard)
    run.js             censiq run (creates arena, polls progress, prints summary)
    report.js          censiq report (fetches and formats results)
  utils/
    api.js             Axios client — all API calls go through here
    config.js          Reads arena.yaml, auth file, last-run file
    display.js         All terminal output — colors, tables, score bars
templates/
  arena.yaml           Default config template (copied by censiq init)
```

---

## Making changes

**Adding a command** — add a file in `src/commands/`, register it in `src/index.js`.

**Adding an API call** — add a function to `src/utils/api.js`. All requests go through `request()` which handles auth and errors centrally.

**Adding output formatting** — add a format handler in `src/utils/display.js` and wire it up with a `--format` flag in the relevant command.

**Changing the wizard** — `src/commands/init.js` uses [inquirer](https://github.com/SBoudrias/Inquirer.js) prompts. Keep the wizard short — users should be able to complete it in under 2 minutes.

---

## Code style

- CommonJS (`require`/`module.exports`) — no ESM
- No TypeScript — keep it approachable for contributors
- No unnecessary abstraction — if a function is used once, don't extract it
- No comments explaining what the code does — only comment the *why* when non-obvious
- Error messages should tell the user what to do next, not just what went wrong

---

## Testing your changes

```bash
node --check src/**/*.js src/*.js bin/*.js   # syntax check
censiq --help                                 # smoke test
censiq run --config templates/arena.yaml      # requires a live API key
```

There is no test suite yet. If you add one, it's welcome.

---

## Submitting a PR

1. Fork the repository
2. Create a branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run `node --check` on all modified files
5. Open a PR against `main`
6. Fill in the PR template

Keep PRs focused — one feature or fix per PR. Large PRs are harder to review and slower to merge.

---

## Versioning

This project uses [semantic versioning](https://semver.org/). Bug fixes bump the patch version. New commands or flags bump the minor version. Breaking changes bump the major version.

Publishing to npm is done by the Censiq team after merge.

---

## License

MIT — see [LICENSE](LICENSE). By contributing, you agree your code is licensed under MIT.

Questions? Open an issue or email dev@censiq.com.
