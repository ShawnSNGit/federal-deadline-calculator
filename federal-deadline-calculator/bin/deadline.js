#!/usr/bin/env node
/**
 * bin/deadline.js
 *
 * Dependency-free CLI for the federal deadline engine. Useful for
 * scripting, CI checks (e.g. "does this filing miss a deadline"), or
 * anyone who'd rather not open a browser.
 *
 * Usage:
 *   deadline list-rules
 *   deadline compute --rule answer-complaint --date 2026-11-01
 *   deadline compute --days 14 --date 2026-11-01
 *   deadline compute --rule removal --date 2026-11-01 --json
 *   deadline compute --rule removal --date 2026-11-01 --ics out.ics
 */

const path = require('path');
const fs = require('fs');

const { computeDeadline, explain, utcDate, isoDate } = require('../src/deadlineEngine');
const { RULES } = require('../src/rules');
const { buildICS } = require('../src/ics');
const { ASOF, ITEMS: JW_ITEMS } = require('../src/judiciaryWatch');

function printHelp() {
  console.log(`federal-deadline-calculator CLI

Usage:
  deadline list-rules
  deadline compute --rule <id> --date YYYY-MM-DD [--json] [--ics <file>]
  deadline compute --days <n> --date YYYY-MM-DD [--json] [--ics <file>]
  deadline status
  deadline help

Run "deadline list-rules" to see available --rule ids.`);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(tok);
    }
  }
  return args;
}

function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) {
    throw new Error(`--date must be in YYYY-MM-DD format, got "${value}"`);
  }
  return utcDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

function listRules() {
  const width = Math.max(...RULES.map((r) => r.id.length));
  console.log('Available --rule ids:\n');
  for (const rule of RULES) {
    if (rule.id === 'custom') continue;
    console.log(`  ${rule.id.padEnd(width + 2)} ${rule.days.toString().padStart(3)} days  ${rule.citation}`);
    console.log(`  ${''.padEnd(width + 2)}          ${rule.label}`);
  }
  console.log(`\n  ${'<n>'.padEnd(width + 2)} (use --days <n> instead of --rule for a custom period)`);
}

function cmdCompute(args) {
  if (!args.date) {
    throw new Error('--date is required (YYYY-MM-DD)');
  }
  const trigger = parseDate(args.date);

  let days, label, citation;
  if (args.rule) {
    const rule = RULES.find((r) => r.id === args.rule);
    if (!rule || rule.id === 'custom') {
      throw new Error(`Unknown --rule "${args.rule}". Run "deadline list-rules" to see valid ids.`);
    }
    days = rule.days;
    label = rule.label;
    citation = rule.citation;
  } else if (args.days) {
    days = Number(args.days);
    if (!Number.isInteger(days) || days <= 0) {
      throw new Error('--days must be a positive whole number');
    }
    label = `${days}-day custom period`;
    citation = 'User-specified';
  } else {
    throw new Error('Provide either --rule <id> or --days <n>');
  }

  const result = computeDeadline(trigger, days);

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          rule: label,
          citation,
          days,
          triggerDate: isoDate(trigger),
          rawDeadline: isoDate(result.rawDeadline),
          deadline: isoDate(result.deadline),
          rolled: result.rolled,
          rollReason: result.rollReason,
        },
        null,
        2
      )
    );
  } else {
    console.log(`${label}  (${citation})`);
    console.log(`Trigger:  ${isoDate(trigger)}`);
    console.log(`Deadline: ${isoDate(result.deadline)}${result.rolled ? `  (rolled past ${result.rollReason})` : ''}`);
    console.log();
    for (const step of explain(result)) {
      console.log(`  - ${step}`);
    }
  }

  if (args.ics) {
    const ics = buildICS([{ title: label, date: result.deadline, description: citation }]);
    const outPath = path.resolve(process.cwd(), args.ics === true ? 'deadline.ics' : args.ics);
    fs.writeFileSync(outPath, ics);
    console.error(`\nWrote ${outPath}`);
  }
}

function cmdStatus() {
  console.log(`Federal judiciary watch (as of ${ASOF}) — a dated snapshot, not a live feed:\n`);
  for (const item of JW_ITEMS) {
    console.log(`* ${item.title}`);
    console.log(`  ${item.body}`);
    console.log(`  Source: ${item.citation}\n  ${item.url}\n`);
  }
  console.log('For current status, see https://www.uscourts.gov/data-news/judiciary-news');
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));

  try {
    switch (cmd) {
      case 'list-rules':
        listRules();
        break;
      case 'compute':
        cmdCompute(args);
        break;
      case 'status':
        cmdStatus();
        break;
      case 'help':
      case undefined:
      case '--help':
      case '-h':
        printHelp();
        break;
      default:
        console.error(`Unknown command "${cmd}". Run "deadline help" for usage.`);
        process.exitCode = 1;
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  }
}

main();
