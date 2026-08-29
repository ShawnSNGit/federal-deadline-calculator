const { RULES } = require('../src/rules');

describe('rules library integrity', () => {
  test('every rule has a unique id', () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every non-custom rule has a positive integer day count', () => {
    for (const rule of RULES) {
      if (rule.id === 'custom') continue;
      expect(Number.isInteger(rule.days)).toBe(true);
      expect(rule.days).toBeGreaterThan(0);
    }
  });

  test('every rule has a non-empty label, citation, and trigger label', () => {
    for (const rule of RULES) {
      expect(rule.label.length).toBeGreaterThan(0);
      expect(rule.citation.length).toBeGreaterThan(0);
      expect(rule.triggerLabel.length).toBeGreaterThan(0);
    }
  });

  test('exactly one custom fallback rule exists', () => {
    expect(RULES.filter((r) => r.id === 'custom').length).toBe(1);
  });
});
