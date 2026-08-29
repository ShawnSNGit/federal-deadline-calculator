/**
 * judiciaryWatch.js
 *
 * A dated, sourced snapshot of operational issues currently affecting the
 * federal court system — the kind of context that changes the practical
 * reliability of a deadline, even though it never changes the legal
 * computation itself.
 *
 * DESIGN NOTE: this is intentionally NOT a live feed. A static,
 * zero-backend site cannot responsibly claim to show "current" news
 * without a server to fetch it from, and a client-side fetch to a news
 * API would need an API key this repo doesn't want to hold. Instead,
 * this is a manually-curated, explicitly dated snapshot — and
 * `.github/workflows/data-freshness.yml` automatically opens a GitHub
 * issue when ASOF gets more than ~120 days old, so staleness surfaces
 * as a maintenance task rather than silently misleading a reader.
 *
 * When updating: change ASOF, update/replace ITEMS, and keep each
 * citation to a primary source (uscourts.gov, a circuit's own shutdown
 * notice, the AO's Annual Report) rather than a news aggregator.
 */

const ASOF = '2026-08-28';

const ITEMS = [
  {
    id: 'shutdown-deadlines',
    title: 'A funding lapse does not toll your deadline',
    body:
      "During the Oct.-Nov. 2025 shutdown, CM/ECF and PACER stayed operational, and courts uniformly held that filing deadlines remained in effect unless a specific order said otherwise. Don't assume a lapse in appropriations buys you extra time — check for a standing order from your specific court before relying on that assumption.",
    citation: 'Administrative Office of the U.S. Courts, Oct. 2025 shutdown guidance',
    url: 'https://www.uscourts.gov/data-news/judiciary-news/2025/10/17/judiciary-funding-runs-out-only-limited-operations-continue',
  },
  {
    id: 'judgeship-shortage',
    title: 'No new district judgeships since 1990',
    body:
      'Case filings have climbed roughly 37% since the last time Congress authorized new district judgeships. The resulting per-judge caseload varies enormously by district — some districts run at multiples of the national average, which can mean slower scheduling, not a change to Rule 6(a) deadlines themselves.',
    citation: 'Administrative Office of the U.S. Courts, Director\u2019s Annual Report 2025',
    url: 'https://www.uscourts.gov/data-news/reports/annual-reports/directors-annual-report/annual-report-2025',
  },
  {
    id: 'cmecf-modernization',
    title: 'CM/ECF and PACER are being replaced',
    body:
      'The federal judiciary is rolling out a replacement for the ~30-year-old CM/ECF filing system, starting with district courts and later moving to appellate and bankruptcy courts. Expect e-filing interfaces and PACER search behavior to change over the next few years as courts migrate.',
    citation: 'U.S. Courts, "Judges Outline Accelerated Modernization of Case Management System" (Mar. 2026)',
    url: 'https://www.uscourts.gov/data-news/judiciary-news/2026/03/10/judges-outline-accelerated-modernization-case-management-system',
  },
];

const JudiciaryWatchModule = { ASOF, ITEMS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = JudiciaryWatchModule;
}
if (typeof window !== 'undefined') {
  window.JudiciaryWatch = JudiciaryWatchModule;
}
