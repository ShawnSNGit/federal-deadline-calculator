(function () {
  const { RULES } = window;
  const { computeDeadline, explain, utcDate } = window.DeadlineEngine;
  const { buildICS } = window.ICS;
  const { ASOF, ITEMS: JW_ITEMS } = window.JudiciaryWatch;

  const STORAGE_KEY = 'federal-deadline-calculator:timeline:v1';

  const ruleSelect = document.getElementById('rule-select');
  const triggerLabel = document.getElementById('trigger-label');
  const triggerInput = document.getElementById('trigger-date');
  const customRow = document.getElementById('custom-row');
  const customDays = document.getElementById('custom-days');
  const form = document.getElementById('deadline-form');
  const result = document.getElementById('result');
  const stampDate = document.getElementById('stamp-date');
  const ruleName = document.getElementById('result-rule-name');
  const citation = document.getElementById('result-citation');
  const deadlineDays = document.getElementById('result-days');
  const stepsList = document.getElementById('steps-list');
  const errorBox = document.getElementById('form-error');
  const addToTimelineBtn = document.getElementById('add-to-timeline');
  const useAsNewTriggerBtn = document.getElementById('use-as-new-trigger');

  const timelineBody = document.getElementById('timeline-body');
  const timelineEmpty = document.getElementById('timeline-empty');
  const timelineSection = document.getElementById('timeline-section');
  const downloadIcsBtn = document.getElementById('download-ics');
  const downloadCsvBtn = document.getElementById('download-csv');
  const clearTimelineBtn = document.getElementById('clear-timeline');
  const shutdownNote = document.getElementById('shutdown-note');
  const jwAsOf = document.getElementById('jw-asof');
  const jwItems = document.getElementById('jw-items');

  let lastComputation = null; // { rule, citation, days, trigger, result }
  let timeline = loadTimeline();

  function populateRules() {
    for (const rule of RULES) {
      const opt = document.createElement('option');
      opt.value = rule.id;
      opt.textContent = rule.id === 'custom' ? rule.label : `${rule.label} — ${rule.citation}`;
      ruleSelect.appendChild(opt);
    }
  }

  function currentRule() {
    return RULES.find((r) => r.id === ruleSelect.value);
  }

  function onRuleChange() {
    const rule = currentRule();
    triggerLabel.textContent = rule.triggerLabel;
    customRow.style.display = rule.id === 'custom' ? 'block' : 'none';
    errorBox.textContent = '';
  }

  function parseDateInput(value) {
    // value is "YYYY-MM-DD" from <input type="date">
    const [y, m, d] = value.split('-').map(Number);
    return utcDate(y, m, d);
  }

  function formatShort(date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    errorBox.textContent = '';

    if (!triggerInput.value) {
      errorBox.textContent = 'Enter the triggering event date first.';
      return;
    }

    const rule = currentRule();
    let days = rule.days;
    if (rule.id === 'custom') {
      const n = Number(customDays.value);
      if (!customDays.value || !Number.isInteger(n) || n <= 0) {
        errorBox.textContent = 'Enter a whole number of days greater than zero.';
        return;
      }
      days = n;
    }

    const trigger = parseDateInput(triggerInput.value);
    const computation = computeDeadline(trigger, days);
    const label = rule.id === 'custom' ? `${days}-day custom period` : rule.label;
    const cite = rule.id === 'custom' ? 'User-specified' : rule.citation;

    lastComputation = { label, citation: cite, days, trigger, computation };

    stampDate.textContent = formatShort(computation.deadline);
    ruleName.textContent = label;
    citation.textContent = cite;
    deadlineDays.textContent = `${days} day${days === 1 ? '' : 's'} from ${formatShort(trigger)}${
      computation.rolled ? ' (rolled forward from a weekend or federal holiday)' : ''
    }`;

    stepsList.innerHTML = '';
    for (const step of explain(computation)) {
      const li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);
    }

    shutdownNote.textContent =
      '\u26A0\uFE0F A government funding lapse does not extend this deadline by default \u2014 file on time unless your specific court has issued an order saying otherwise.';

    result.classList.add('visible');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---------- Judiciary watch (dated snapshot, see src/judiciaryWatch.js) ----------

  function renderJudiciaryWatch() {
    const asOfDate = new Date(ASOF + 'T00:00:00Z');
    jwAsOf.textContent = `(as of ${asOfDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })})`;

    jwItems.innerHTML = '';
    for (const item of JW_ITEMS) {
      const div = document.createElement('div');
      div.className = 'jw-item';
      div.innerHTML = `
        <p class="jw-title">${escapeHTML(item.title)}</p>
        <p class="jw-body">${escapeHTML(item.body)}</p>
        <p class="jw-citation"><a href="${item.url}" target="_blank" rel="noopener">${escapeHTML(item.citation)}</a></p>
      `;
      jwItems.appendChild(div);
    }
  }

  // ---------- Matter timeline ----------

  function loadTimeline() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.map((e) => ({ ...e, dateISO: e.dateISO }));
    } catch {
      return [];
    }
  }

  function saveTimeline() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timeline));
    } catch {
      // localStorage unavailable (private browsing, etc.) — the timeline
      // still works for the current page load, it just won't persist.
    }
  }

  function addToTimeline() {
    if (!lastComputation) return;
    timeline.push({
      label: lastComputation.label,
      citation: lastComputation.citation,
      dateISO: isoDateStr(lastComputation.computation.deadline),
      triggerISO: isoDateStr(lastComputation.trigger),
      days: lastComputation.days,
    });
    timeline.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    saveTimeline();
    renderTimeline();
    timelineSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function isoDateStr(date) {
    return date.toISOString().slice(0, 10);
  }

  function removeFromTimeline(index) {
    timeline.splice(index, 1);
    saveTimeline();
    renderTimeline();
  }

  function renderTimeline() {
    timelineBody.innerHTML = '';
    const hasEntries = timeline.length > 0;
    timelineEmpty.style.display = hasEntries ? 'none' : 'block';
    downloadIcsBtn.disabled = !hasEntries;
    downloadCsvBtn.disabled = !hasEntries;
    clearTimelineBtn.disabled = !hasEntries;

    const today = isoDateStr(new Date());

    timeline.forEach((entry, i) => {
      const tr = document.createElement('tr');
      if (entry.dateISO < today) {
        tr.classList.add('past');
      }
      const [y, m, d] = entry.dateISO.split('-').map(Number);
      const displayDate = formatShort(utcDate(y, m, d));

      tr.innerHTML = `
        <td class="tl-date">${displayDate}</td>
        <td>
          <div class="tl-label">${escapeHTML(entry.label)}</div>
          <div class="tl-citation">${escapeHTML(entry.citation)}</div>
        </td>
        <td class="tl-remove"><button type="button" aria-label="Remove ${escapeHTML(entry.label)} from timeline">&times;</button></td>
      `;
      tr.querySelector('.tl-remove button').addEventListener('click', () => removeFromTimeline(i));
      timelineBody.appendChild(tr);
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onDownloadIcs() {
    if (timeline.length === 0) return;
    const events = timeline.map((e) => {
      const [y, m, d] = e.dateISO.split('-').map(Number);
      return { title: e.label, date: utcDate(y, m, d), description: e.citation };
    });
    downloadBlob(buildICS(events), 'litigation-deadlines.ics', 'text/calendar');
  }

  function onDownloadCsv() {
    if (timeline.length === 0) return;
    const rows = [['Deadline', 'Rule', 'Citation', 'Days', 'Trigger date']];
    for (const e of timeline) {
      rows.push([e.dateISO, e.label, e.citation, String(e.days), e.triggerISO]);
    }
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
    downloadBlob(csv, 'litigation-deadlines.csv', 'text/csv');
  }

  function csvEscape(val) {
    if (/[",\r\n]/.test(val)) {
      return '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }

  function onClearTimeline() {
    if (timeline.length === 0) return;
    if (!confirm('Remove all deadlines from the timeline? This cannot be undone.')) return;
    timeline = [];
    saveTimeline();
    renderTimeline();
  }

  function onUseAsNewTrigger() {
    if (!lastComputation) return;
    triggerInput.value = isoDateStr(lastComputation.computation.deadline);
    triggerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    triggerInput.focus();
  }

  populateRules();
  onRuleChange();
  renderTimeline();
  renderJudiciaryWatch();
  ruleSelect.addEventListener('change', onRuleChange);
  form.addEventListener('submit', onSubmit);
  addToTimelineBtn.addEventListener('click', addToTimeline);
  useAsNewTriggerBtn.addEventListener('click', onUseAsNewTrigger);
  downloadIcsBtn.addEventListener('click', onDownloadIcs);
  downloadCsvBtn.addEventListener('click', onDownloadCsv);
  clearTimelineBtn.addEventListener('click', onClearTimeline);
})();
