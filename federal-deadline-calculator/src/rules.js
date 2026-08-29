/**
 * rules.js
 *
 * A curated library of common federal litigation deadlines, expressed
 * as { days, triggerLabel } pairs anchored to their source rule.
 *
 * IMPORTANT: This list is for general educational reference. Local
 * rules, standing orders, scheduling orders, and case-specific
 * stipulations can and do change these defaults. Always confirm
 * against the applicable rules and the docket in a real matter.
 */

const RULES = [
  {
    id: 'answer-complaint',
    label: 'Answer to a complaint',
    citation: 'Fed. R. Civ. P. 12(a)(1)(A)(i)',
    days: 21,
    triggerLabel: 'Date defendant was served with the summons and complaint',
  },
  {
    id: 'answer-waiver',
    label: 'Answer after waiving service',
    citation: 'Fed. R. Civ. P. 12(a)(1)(A)(ii)',
    days: 60,
    triggerLabel: 'Date the request for waiver was sent',
  },
  {
    id: 'answer-amended',
    label: 'Response to an amended pleading',
    citation: 'Fed. R. Civ. P. 15(a)(3)',
    days: 14,
    triggerLabel: 'Date the amended pleading was served',
  },
  {
    id: 'removal',
    label: 'Notice of removal',
    citation: '28 U.S.C. § 1446(b)(1)',
    days: 30,
    triggerLabel: 'Date defendant received the initial pleading',
  },
  {
    id: 'interrogatories',
    label: 'Response to interrogatories',
    citation: 'Fed. R. Civ. P. 33(b)(2)',
    days: 30,
    triggerLabel: 'Date interrogatories were served',
  },
  {
    id: 'document-requests',
    label: 'Response to document requests',
    citation: 'Fed. R. Civ. P. 34(b)(2)(A)',
    days: 30,
    triggerLabel: 'Date the request was served',
  },
  {
    id: 'admissions',
    label: 'Response to requests for admission',
    citation: 'Fed. R. Civ. P. 36(a)(3)',
    days: 30,
    triggerLabel: 'Date the request was served',
  },
  {
    id: 'jmol-renewed',
    label: 'Renewed motion for judgment as a matter of law',
    citation: 'Fed. R. Civ. P. 50(b)',
    days: 28,
    triggerLabel: 'Date of entry of judgment',
  },
  {
    id: 'new-trial',
    label: 'Motion for a new trial',
    citation: 'Fed. R. Civ. P. 59(b)',
    days: 28,
    triggerLabel: 'Date of entry of judgment',
  },
  {
    id: 'alter-amend',
    label: 'Motion to alter or amend a judgment',
    citation: 'Fed. R. Civ. P. 59(e)',
    days: 28,
    triggerLabel: 'Date of entry of judgment',
  },
  {
    id: 'appeal-civil-private',
    label: 'Notice of appeal (civil case, no federal government party)',
    citation: 'Fed. R. App. P. 4(a)(1)(A)',
    days: 30,
    triggerLabel: 'Date the judgment or order was entered',
  },
  {
    id: 'appeal-civil-govt',
    label: 'Notice of appeal (civil case, U.S. or federal officer is a party)',
    citation: 'Fed. R. App. P. 4(a)(1)(B)',
    days: 60,
    triggerLabel: 'Date the judgment or order was entered',
  },
  {
    id: 'objections-magistrate',
    label: "Objections to a magistrate judge's report and recommendation",
    citation: 'Fed. R. Civ. P. 72(b)(2)',
    days: 14,
    triggerLabel: 'Date served with a copy of the recommendation',
  },
  {
    id: 'custom',
    label: 'Custom period',
    citation: 'User-specified',
    days: null,
    triggerLabel: 'Date of the triggering event',
  },
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RULES };
}
if (typeof window !== 'undefined') {
  window.RULES = RULES;
}
