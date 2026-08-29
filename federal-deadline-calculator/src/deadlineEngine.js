/**
 * deadlineEngine.js
 *
 * Implements the time-computation method of Fed. R. Civ. P. 6(a)(1),
 * the default rule used to compute any period stated in days (or a
 * longer unit) in the Federal Rules of Civil Procedure, and mirrored
 * by Fed. R. App. P. 26(a) and Fed. R. Crim. P. 45(a) for their
 * respective rule sets.
 *
 * Rule 6(a)(1) — computing a period stated in days or a longer unit:
 *   (A) exclude the day of the event that triggers the period;
 *   (B) count every day, including intermediate Saturdays, Sundays,
 *       and legal holidays; and
 *   (C) include the last day of the period, but if the last day is a
 *       Saturday, Sunday, or legal holiday, the period continues to
 *       run until the end of the next day that is not a Saturday,
 *       Sunday, or legal holiday.
 *
 * Note: the pre-2009 rule that excluded intermediate weekends/holidays
 * for periods shorter than 11 days was eliminated by the 2009
 * amendments. This engine implements current law, which uses one
 * counting method regardless of the length of the period.
 */

const HolidaysDep = typeof module !== 'undefined' && module.exports ? require('./holidays') : window.Holidays;
const { utcDate, isFederalHoliday, holidayName, isoDate } = HolidaysDep;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isWeekend(date) {
  const dow = date.getUTCDay();
  return dow === 0 || dow === 6;
}

function addDaysUTC(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Computes a deadline under Rule 6(a)(1).
 *
 * @param {Date} triggerDate - the date of the triggering event (UTC date,
 *   e.g. date of service). This day itself is excluded from the count.
 * @param {number} periodDays - the number of days specified by the rule.
 * @param {object} [options]
 * @param {Map<number, Set<string>>} [options.holidayCache] - optional cache
 *   reused across calls for performance.
 * @returns {{
 *   deadline: Date,
 *   rawDeadline: Date,
 *   rolled: boolean,
 *   rollReason: string|null,
 *   countedThrough: Date,
 * }}
 */
function computeDeadline(triggerDate, periodDays, options = {}) {
  const cache = options.holidayCache || new Map();

  // (A) Exclude the day of the triggering event: counting starts the
  // next calendar day.
  // (B) Count every day, including intermediate Saturdays, Sundays and
  // legal holidays, through periodDays days.
  const rawDeadline = addDaysUTC(triggerDate, periodDays);

  // (C) If the last day lands on a Saturday, Sunday, or legal holiday,
  // push forward to the next day that is none of those.
  let deadline = new Date(rawDeadline);
  let rolled = false;
  let rollReason = null;
  while (isWeekend(deadline) || isFederalHoliday(deadline, cache)) {
    rolled = true;
    const name = holidayName(deadline);
    rollReason = name
      ? `${name} (${DAY_NAMES[deadline.getUTCDay()]})`
      : DAY_NAMES[deadline.getUTCDay()];
    deadline = addDaysUTC(deadline, 1);
  }

  return {
    deadline,
    rawDeadline,
    rolled,
    rollReason,
    triggerDate,
    periodDays,
  };
}

/**
 * Produces a plain-English, step-by-step explanation of the computation,
 * suitable for display in the UI so a user can verify the math itself
 * rather than trusting a black box.
 */
function explain(result) {
  const steps = [];
  steps.push(
    `Day 0 (excluded): ${formatLong(result.triggerDate)} — the day of the triggering event is not counted. Fed. R. Civ. P. 6(a)(1)(A).`
  );
  steps.push(
    `Count forward ${result.periodDays} day${result.periodDays === 1 ? '' : 's'}, including intermediate weekends and holidays. Fed. R. Civ. P. 6(a)(1)(B).`
  );
  steps.push(`Day ${result.periodDays} lands on: ${formatLong(result.rawDeadline)} (${DAY_NAMES[result.rawDeadline.getUTCDay()]}).`);
  if (result.rolled) {
    steps.push(
      `That day is a ${result.rollReason ? 'weekend/holiday — ' + result.rollReason : 'weekend/holiday'}, so the deadline rolls forward to the next day that is not a Saturday, Sunday, or legal holiday. Fed. R. Civ. P. 6(a)(1)(C).`
    );
  } else {
    steps.push('That day is not a Saturday, Sunday, or legal holiday, so it stands as the deadline. Fed. R. Civ. P. 6(a)(1)(C).');
  }
  steps.push(`Deadline: ${formatLong(result.deadline)}.`);
  return steps;
}

function formatLong(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const DeadlineEngineModule = { computeDeadline, explain, isWeekend, addDaysUTC, isoDate, utcDate };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeadlineEngineModule;
}
if (typeof window !== 'undefined') {
  window.DeadlineEngine = DeadlineEngineModule;
}
