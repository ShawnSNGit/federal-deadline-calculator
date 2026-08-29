/**
 * holidays.js
 *
 * Computes federal legal holidays under 5 U.S.C. § 6103, which is the
 * holiday set incorporated by reference in Fed. R. Civ. P. 6(a)(6)(A).
 *
 * Handles the "observed" shift rule: when a fixed-date holiday falls on
 * a Saturday, it is observed the preceding Friday; when it falls on a
 * Sunday, it is observed the following Monday.
 */

/** Returns a UTC Date for the given y/m/d (m is 1-indexed). Using UTC
 * throughout avoids local-timezone off-by-one bugs when comparing dates. */
function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Nth weekday of a month. weekday: 0=Sun..6=Sat. n is 1-indexed. */
function nthWeekdayOfMonth(year, month, weekday, n) {
  const first = utcDate(year, month, 1);
  const firstWeekday = first.getUTCDay();
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return utcDate(year, month, day);
}

/** Last weekday of a month. weekday: 0=Sun..6=Sat. */
function lastWeekdayOfMonth(year, month, weekday) {
  // day 0 of next month = last day of this month
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = utcDate(year, month, lastDay);
  const diff = (last.getUTCDay() - weekday + 7) % 7;
  return utcDate(year, month, lastDay - diff);
}

/** Shifts a fixed-date holiday to the observed date per 5 U.S.C. § 6103(b). */
function observed(date) {
  const dow = date.getUTCDay();
  if (dow === 6) {
    // Saturday -> observed Friday before
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - 1);
    return d;
  }
  if (dow === 0) {
    // Sunday -> observed Monday after
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }
  return date;
}

/**
 * Returns an array of { date: Date, name: string } for every federal
 * legal holiday observed in the given year.
 */
function federalHolidaysForYear(year) {
  const list = [
    { name: "New Year's Day", date: observed(utcDate(year, 1, 1)) },
    { name: 'Birthday of Martin Luther King, Jr.', date: nthWeekdayOfMonth(year, 1, 1, 3) }, // 3rd Monday of Jan
    { name: "Washington's Birthday", date: nthWeekdayOfMonth(year, 2, 1, 3) }, // 3rd Monday of Feb
    { name: 'Memorial Day', date: lastWeekdayOfMonth(year, 5, 1) }, // last Monday of May
    { name: 'Juneteenth National Independence Day', date: observed(utcDate(year, 6, 19)) },
    { name: 'Independence Day', date: observed(utcDate(year, 7, 4)) },
    { name: 'Labor Day', date: nthWeekdayOfMonth(year, 9, 1, 1) }, // 1st Monday of Sept
    { name: 'Columbus Day', date: nthWeekdayOfMonth(year, 10, 1, 2) }, // 2nd Monday of Oct
    { name: 'Veterans Day', date: observed(utcDate(year, 11, 11)) },
    { name: 'Thanksgiving Day', date: nthWeekdayOfMonth(year, 11, 4, 4) }, // 4th Thursday of Nov
    { name: 'Christmas Day', date: observed(utcDate(year, 12, 25)) },
  ];
  return list;
}

/** A cache-backed Set of ISO date strings ("YYYY-MM-DD") that are federal
 * holidays, spanning [startYear, endYear] inclusive. */
function buildHolidaySet(startYear, endYear) {
  const set = new Set();
  for (let y = startYear; y <= endYear; y++) {
    for (const h of federalHolidaysForYear(y)) {
      set.add(isoDate(h.date));
    }
  }
  return set;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

/** True if `date` is a federal legal holiday. Builds the year's calendar
 * on demand and relies on the caller-supplied cache when provided. */
function isFederalHoliday(date, cache) {
  const year = date.getUTCFullYear();
  const key = isoDate(date);
  if (cache) {
    if (!cache.has(year)) {
      cache.set(year, new Set(federalHolidaysForYear(year).map((h) => isoDate(h.date))));
    }
    return cache.get(year).has(key);
  }
  return federalHolidaysForYear(year).some((h) => isoDate(h.date) === key);
}

/** Human-readable holiday name for a date, or null if not a holiday. */
function holidayName(date) {
  const year = date.getUTCFullYear();
  const key = isoDate(date);
  const match = federalHolidaysForYear(year).find((h) => isoDate(h.date) === key);
  return match ? match.name : null;
}

const HolidaysModule = {
  utcDate,
  isoDate,
  federalHolidaysForYear,
  buildHolidaySet,
  isFederalHoliday,
  holidayName,
};

// UMD-style export: CommonJS for Jest/Node, global for plain <script> in the browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HolidaysModule;
}
if (typeof window !== 'undefined') {
  window.Holidays = HolidaysModule;
}
