const { buildICS } = require('../src/ics');
const { utcDate } = require('../src/holidays');

describe('buildICS', () => {
  test('produces a valid VCALENDAR wrapper', () => {
    const ics = buildICS([{ title: 'Answer due', date: utcDate(2026, 12, 16) }]);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  test('formats an all-day DTSTART as YYYYMMDD with the correct exclusive DTEND', () => {
    const ics = buildICS([{ title: 'Answer due', date: utcDate(2026, 12, 16) }]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261216');
    expect(ics).toContain('DTEND;VALUE=DATE:20261217');
  });

  test('escapes commas, semicolons, and backslashes in text fields', () => {
    const ics = buildICS([{ title: 'Answer; motion, response\\note', date: utcDate(2026, 1, 1) }]);
    expect(ics).toContain('Answer\\; motion\\, response\\\\note');
  });

  test('supports multiple events in one calendar with distinct UIDs', () => {
    const ics = buildICS([
      { title: 'Answer due', date: utcDate(2026, 12, 16) },
      { title: 'Discovery cutoff', date: utcDate(2027, 3, 1) },
    ]);
    const uids = [...ics.matchAll(/UID:([^\r\n]+)/g)].map((m) => m[1]);
    expect(uids.length).toBe(2);
    expect(new Set(uids).size).toBe(2);
  });

  test('folds lines longer than 75 octets per RFC 5545', () => {
    const longTitle = 'A'.repeat(120);
    const ics = buildICS([{ title: longTitle, date: utcDate(2026, 1, 1) }]);
    const rawLines = ics.split('\r\n');
    for (const line of rawLines) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });
});
