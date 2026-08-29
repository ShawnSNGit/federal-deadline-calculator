const fc = require('fast-check');
const { computeDeadline } = require('../src/deadlineEngine');
const { isFederalHoliday, utcDate, isoDate } = require('../src/holidays');

// Arbitrary: a UTC date within a wide but bounded range (2020-2060), so the
// holiday calendar (which computes floating holidays algorithmically) stays
// well-defined, and an arbitrary period length matching what real federal
// rules use in practice.
const dateArb = fc
  .tuple(
    fc.integer({ min: 2020, max: 2060 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }) // 28 keeps every month valid, avoids Feb edge cases muddying this arbitrary
  )
  .map(([y, m, d]) => utcDate(y, m, d));

const periodArb = fc.integer({ min: 1, max: 365 });

describe('property: Rule 6(a)(1) invariants hold for arbitrary inputs', () => {
  test('the computed deadline never falls on a Saturday, Sunday, or federal holiday', () => {
    fc.assert(
      fc.property(dateArb, periodArb, (trigger, days) => {
        const { deadline } = computeDeadline(trigger, days);
        const dow = deadline.getUTCDay();
        expect(dow).not.toBe(0);
        expect(dow).not.toBe(6);
        expect(isFederalHoliday(deadline)).toBe(false);
      }),
      { numRuns: 3000 }
    );
  });

  test('the deadline is always on or after the raw (unrolled) day-count deadline', () => {
    fc.assert(
      fc.property(dateArb, periodArb, (trigger, days) => {
        const { deadline, rawDeadline } = computeDeadline(trigger, days);
        expect(deadline.getTime()).toBeGreaterThanOrEqual(rawDeadline.getTime());
      }),
      { numRuns: 3000 }
    );
  });

  test('the deadline never rolls more than 3 calendar days past the raw deadline', () => {
    // The longest possible consecutive non-business-day block under the
    // federal calendar is Fri(holiday)+Sat+Sun -> Mon, i.e. a 3-day roll.
    fc.assert(
      fc.property(dateArb, periodArb, (trigger, days) => {
        const { deadline, rawDeadline } = computeDeadline(trigger, days);
        const rollDays = Math.round((deadline.getTime() - rawDeadline.getTime()) / 86400000);
        expect(rollDays).toBeGreaterThanOrEqual(0);
        expect(rollDays).toBeLessThanOrEqual(3);
      }),
      { numRuns: 3000 }
    );
  });

  test('the triggering day itself is excluded: the deadline is always strictly after it', () => {
    fc.assert(
      fc.property(dateArb, periodArb, (trigger, days) => {
        const { deadline } = computeDeadline(trigger, days);
        expect(deadline.getTime()).toBeGreaterThan(trigger.getTime());
      }),
      { numRuns: 3000 }
    );
  });

  test('computation is deterministic: same inputs always produce the same deadline', () => {
    fc.assert(
      fc.property(dateArb, periodArb, (trigger, days) => {
        const a = computeDeadline(new Date(trigger), days);
        const b = computeDeadline(new Date(trigger), days);
        expect(isoDate(a.deadline)).toBe(isoDate(b.deadline));
      }),
      { numRuns: 1000 }
    );
  });

  test('a longer period never produces an earlier deadline than a shorter one from the same trigger', () => {
    fc.assert(
      fc.property(dateArb, periodArb, fc.integer({ min: 1, max: 60 }), (trigger, base, extra) => {
        const shorter = computeDeadline(trigger, base);
        const longer = computeDeadline(trigger, base + extra);
        expect(longer.deadline.getTime()).toBeGreaterThanOrEqual(shorter.deadline.getTime());
      }),
      { numRuns: 2000 }
    );
  });
});
