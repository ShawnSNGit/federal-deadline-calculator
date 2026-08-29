# Architecture

This document explains how the project is put together and, more
importantly, *why* — the design choices here are deliberate trade-offs,
not defaults.

## Design priorities, in order

1. **Correctness of the legal computation.** Everything else is secondary
   to getting Rule 6(a) right. This is why the core logic is isolated,
   heavily tested, and framework-free — there's nothing between "the rule"
   and "the code" that could introduce drift.
2. **Verifiability.** A user (or a reviewer) should be able to check the
   math themselves. `explain()` produces the reasoning trail with rule
   citations rather than just a final answer.
3. **Zero operational surface area.** No server, no database, no API
   keys, no user accounts. A tool that touches real legal deadlines
   should have as few moving parts as possible to break.
4. **Everything else** (UI polish, CLI, exports) is built on top of a
   stable, tested core — never mixed into it.

## Module boundaries

```
src/holidays.js       pure functions: date math for the federal holiday calendar
src/deadlineEngine.js  pure functions: Rule 6(a)(1) counting logic
src/rules.js           data: the library of deadline templates + citations
src/ics.js             pure functions: RFC 5545 calendar file generation
src/app.js             the only file that touches the DOM
src/styles.css         presentation only
bin/deadline.js        CLI entry point — a thin wrapper over the same core
```

The dependency direction is one-way: `deadlineEngine.js` depends on
`holidays.js`; `app.js` and `bin/deadline.js` both depend on the core
modules but never on each other. Nothing in `src/holidays.js`,
`src/deadlineEngine.js`, `src/ics.js`, or `src/rules.js` touches `window`,
`document`, `process`, or the filesystem — they're pure computation, which
is what makes them independently unit-testable and reusable from both a
browser and a terminal without modification.

## Why no framework, no bundler, no build step

The entire browser app is vanilla JS loaded via plain `<script>` tags.
That's a considered choice, not an oversight:

- **The site has one job**: take a date and a rule, run a pure function,
  render the result. React/Vue/etc. solve state-management and
  re-rendering problems this app doesn't have.
- **A build step is a place for the deployed code to silently diverge
  from the tested code.** Because `src/*.js` is shipped byte-for-byte to
  both the browser and the test runner, "the tests pass" and "the site
  works" are the same claim.
- **GitHub Pages hosts static files for free.** No build output, no
  bundler config, no `dist/` folder to keep in sync — `git push` is the
  entire deploy story (see `.github/workflows/deploy.yml`).

Each core module uses a small UMD-style export shim (`module.exports` if
present, else `window.X`) specifically so it can be `require()`'d by Jest
*and* loaded via `<script>` in the browser *and* required by the CLI,
without a bundler or transpiler anywhere in the chain.

## Why the CLI shares the exact same core modules

`bin/deadline.js` imports `src/deadlineEngine.js`, `src/rules.js`, and
`src/ics.js` directly — the same files the browser and the test suite
use. There is exactly one implementation of "what is 21 days from this
date," not one for the web app and a re-implementation for the CLI that
could quietly drift out of sync.

## Testing strategy

Three layers, each catching a different class of bug:

- **`tests/deadlineEngine.test.js`** — example-based tests pinned to
  specific, hand-verified real dates (a period landing on Thanksgiving, a
  holiday observed on the preceding Friday, etc.). These read like a
  lawyer's sanity check: "does the tool get *this* real scenario right."
- **`tests/property.test.js`** — property-based tests (via `fast-check`)
  that assert invariants across thousands of randomly generated dates and
  period lengths (the deadline is never a weekend/holiday, is never
  earlier than the unrolled raw deadline, rolls forward by at most 3
  days, is deterministic, and is monotonic in the period length). This
  catches edge cases no one would think to write by hand — leap years,
  year boundaries, holidays that fall on other holidays' rollover days.
- **`tests/rules.test.js` / `tests/ics.test.js`** — data-integrity and
  format-correctness tests for the two things most likely to silently
  break: a malformed rule entry, or a malformed calendar file.

`npm test` runs all of it with coverage; CI (`.github/workflows/test.yml`)
runs it on every push and pull request, and the deploy workflow refuses
to publish if any test fails.

## Persistence

The matter timeline uses `localStorage`, scoped per-browser, with no
server round-trip. This is a deliberate choice given priority #3 above:
a litigation deadline tracker should not require the user to trust a
third-party server with case information. The trade-off is that the
timeline doesn't sync across devices — acceptable for a tool whose job is
double-checking a date, not being a system of record.

## What's intentionally out of scope

- **State court rules.** States vary widely and some counties layer local
  rules on top; doing this correctly for even a handful of states is a
  bigger, separate project. The README says so explicitly rather than
  quietly guessing.
- **A backend.** There is no case data to store server-side that
  `localStorage` + `.ics`/`.csv` export doesn't already solve for a
  single user.
- **Authentication, multi-user sharing.** Out of scope for a
  correctness-focused reference tool; the export formats (ICS/CSV) are
  the intentional integration point if someone wants to build that layer
  on top.
