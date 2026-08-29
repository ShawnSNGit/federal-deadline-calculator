/**
 * ics.js
 *
 * Minimal iCalendar (RFC 5545) generator for exporting computed deadlines
 * as calendar events. Deliberately dependency-free: the ICS format is
 * simple enough that pulling in a library for it would be the wrong
 * trade-off for a static, zero-build site.
 */

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Formats a UTC Date as an all-day ICS DATE value: YYYYMMDD. */
function icsDate(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** The exclusive DTEND for an all-day event is the day after. */
function nextDay(date) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function escapeText(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Folds a line to <=75 octets per RFC 5545 §3.1, continuation lines
 * prefixed with a single space. */
function foldLine(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

let uidCounter = 0;

/**
 * @param {Array<{title: string, date: Date, description?: string}>} events
 * @returns {string} a complete .ics file's contents
 */
function buildICS(events) {
  const now = new Date();
  const dtstamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//federal-deadline-calculator//EN', 'CALSCALE:GREGORIAN'];

  for (const ev of events) {
    uidCounter += 1;
    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${dtstamp}-${uidCounter}@federal-deadline-calculator`));
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${icsDate(ev.date)}`);
    lines.push(`DTEND;VALUE=DATE:${icsDate(nextDay(ev.date))}`);
    lines.push(foldLine(`SUMMARY:${escapeText(ev.title)}`));
    if (ev.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(ev.description)}`));
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

const ICSModule = { buildICS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ICSModule;
}
if (typeof window !== 'undefined') {
  window.ICS = ICSModule;
}
