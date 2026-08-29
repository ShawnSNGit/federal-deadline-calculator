# Federal Court Deadline Calculator

A small, correctly-implemented tool that computes federal litigation
deadlines under **Fed. R. Civ. P. 6(a)** — the rule that governs how every
"X days" deadline in federal court is actually counted — plus a matter
timeline, calendar export, and a CLI, all built on one shared,
property-tested core.

**[Live demo →](#deployment)** (add your GitHub Pages link here after deploying)

## Why this exists

Rule 6(a) sounds simple — "21 days to answer a complaint" — but the
computation has three non-obvious parts:

1. The day of the triggering event (e.g., service) **doesn't count**.
2. Every day in between counts, **including weekends and holidays**.
3. If the final day **lands on** a Saturday, Sunday, or federal legal
   holiday, the deadline rolls forward to the next business day.

Step 3 is a real, recurring source of missed deadlines — especially
around the federal holiday calendar, where a fixed-date holiday (like
July 4th) shifts to the nearest weekday when it falls on a weekend
(5 U.S.C. § 6103(b)). I wanted a tool that gets this exactly right, shows
its work, and is backed by tests — thousands of them — rather than
"trust me."

## What it does

**Core computation**
- Computes deadlines for 13 common federal deadlines (answering a
  complaint, removal, discovery responses, post-judgment motions,
  notices of appeal, objections to a magistrate's R&R) plus a custom day
  count.
- Correctly implements the federal legal holiday calendar under
  5 U.S.C. § 6103, including the Saturday→Friday / Sunday→Monday
  "observed" shift and the floating holidays (MLK Day, Washington's
  Birthday, Memorial Day, Labor Day, Columbus Day, Thanksgiving).
- Shows a step-by-step explanation of the computation, citing the exact
  Rule 6(a) subsection behind each step, so the result is verifiable
  rather than a black box.

**Federal judiciary watch**
- A dated, sourced snapshot of what's actually straining the federal
  court system right now — the judgeship shortage relative to caseload
  growth, funding volatility, and the CM/ECF/PACER modernization effort —
  each item cited to a primary source (uscourts.gov, not a news
  aggregator).
- Directly actionable: the calculator surfaces a one-line advisory on
  every computed result that a government funding lapse does **not**
  toll your deadline by default, which is a genuinely common
  misconception.
- Because a static site can't honestly claim to be "live," a monthly
  GitHub Action (`data-freshness.yml`) checks the snapshot's age and
  opens a GitHub issue automatically if it's gone stale — staleness
  becomes a visible maintenance task instead of a silently outdated
  claim on the deployed site.
- Also available from the CLI: `deadline status`.

**Matter timeline**
- Chain deadlines together: compute one, add it to a running timeline,
  then use that deadline as the trigger for the next.
- Persists in the browser (`localStorage`) — no server, no account.
- Export the whole timeline as an **.ics calendar file** (importable into
  Google Calendar, Outlook, Apple Calendar) or a **.csv** for a docket
  spreadsheet.

**CLI**
- The same engine, usable from a terminal or a script:
  ```bash
  ./bin/deadline.js list-rules
  ./bin/deadline.js compute --rule answer-complaint --date 2026-11-01
  ./bin/deadline.js compute --days 14 --date 2026-11-01 --json
  ./bin/deadline.js compute --rule removal --date 2026-11-01 --ics out.ics
  ```

**Engineering**
- 31 tests: hand-verified example cases, data-integrity checks, and
  **property-based tests** (via `fast-check`) that assert core invariants
  across ~12,000 randomly generated dates and period lengths — not just
  the cases someone thought to hand-pick.
- CI runs the full suite on every push; a second workflow auto-deploys to
  GitHub Pages, but only if the tests pass.
- One core implementation shared by the browser app and the CLI — see
  [ARCHITECTURE.md](ARCHITECTURE.md) for why, and for the module
  boundaries and design trade-offs.
- Runs entirely client-side — no backend, no API keys, no data
  collection. Static HTML/CSS/JS, zero build step.

## Try it locally

No build step or dependencies are required to run the web app:

```bash
git clone https://github.com/<your-username>/federal-deadline-calculator.git
cd federal-deadline-calculator
python3 -m http.server 8000
# open http://localhost:8000
```

To use the CLI:

```bash
npm install   # only needed for the test suite; the CLI itself has zero deps
node bin/deadline.js list-rules
```

## Running the tests

```bash
npm install
npm test              # everything, with coverage
npm run test:unit     # example-based + data-integrity tests only
npm run test:property # property-based invariant tests only
```

## Project structure

```
├── index.html                      # the web app (no build step)
├── bin/
│   └── deadline.js                  # CLI — shares the same core modules
├── src/
│   ├── holidays.js                  # 5 U.S.C. § 6103 federal holiday calendar
│   ├── deadlineEngine.js            # Fed. R. Civ. P. 6(a)(1) counting logic
│   ├── rules.js                     # library of deadline templates + citations
│   ├── ics.js                       # RFC 5545 (.ics) calendar file generator
│   ├── judiciaryWatch.js            # dated snapshot of current court operational issues
│   ├── app.js                       # wires the form + timeline to the engine
│   └── styles.css
├── tests/
│   ├── deadlineEngine.test.js       # hand-verified example cases
│   ├── property.test.js             # ~12,000 randomized invariant checks
│   ├── ics.test.js                  # calendar file format correctness
│   ├── rules.test.js                # data-integrity checks on the rule library
│   └── judiciaryWatch.test.js       # data-integrity checks on the watch snapshot
├── .github/workflows/
│   ├── test.yml                     # CI: run tests on every push/PR
│   ├── deploy.yml                   # CD: auto-deploy to GitHub Pages on main
│   └── data-freshness.yml           # monthly: files an issue if the watch snapshot is stale
└── ARCHITECTURE.md                  # design decisions and module boundaries
```

## Deployment

This repo deploys itself. Once you push to your own GitHub account and
enable Pages once (**Settings → Pages → Source: GitHub Actions**), every
push to `main` that passes the test suite automatically redeploys the
site — see `.github/workflows/deploy.yml`.

1. Push this repo to your own GitHub account.
2. Go to **Settings → Pages → Source**, select **GitHub Actions**.
3. Push to `main` (or re-run the workflow) — your app goes live at
   `https://<your-username>.github.io/<repo-name>/`.

Then update the demo link at the top of this README.

## Scope and limits

This tool computes the *default* federal computation method. It does not
(and, per [ARCHITECTURE.md](ARCHITECTURE.md), intentionally does not) account
for:

- Local court rules or standing orders that shorten or extend a default
  period (these are common and control over the default).
- State court rules, which vary by state and often differ from Rule 6(a).
- Case-specific scheduling orders, stipulated extensions, or CM/ECF
  electronic-filing rules on the day something is "served."

The in-app disclaimer reflects this. Treat the output as a starting point
for verification, not as a substitute for checking the docket and
applicable rules in a real matter.

## License

MIT — see [LICENSE](LICENSE).
