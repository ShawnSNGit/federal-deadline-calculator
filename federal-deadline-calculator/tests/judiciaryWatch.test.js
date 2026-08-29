const { ASOF, ITEMS } = require('../src/judiciaryWatch');

describe('judiciary watch data integrity', () => {
  test('ASOF is a valid ISO date string', () => {
    expect(/^\d{4}-\d{2}-\d{2}$/.test(ASOF)).toBe(true);
    expect(Number.isNaN(new Date(ASOF).getTime())).toBe(false);
  });

  test('every item has a unique id', () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every item has non-empty title, body, citation, and a well-formed https URL', () => {
    for (const item of ITEMS) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.body.length).toBeGreaterThan(0);
      expect(item.citation.length).toBeGreaterThan(0);
      expect(item.url.startsWith('https://')).toBe(true);
    }
  });

  test('at least one item exists', () => {
    expect(ITEMS.length).toBeGreaterThan(0);
  });
});
