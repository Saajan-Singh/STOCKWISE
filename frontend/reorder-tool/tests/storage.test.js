/**
 * StockWise — storage.test.js
 * ============================
 * Manual console-assertion tests for storage.js.
 *
 * HOW TO RUN:
 *   1. Open reorder-tool/tests/test-runner.html in your browser
 *      (file:// is fine — no server needed).
 *   2. Open DevTools → Console.
 *   3. All assertions print PASS / FAIL with labels.
 *      A final summary line shows the total counts.
 *
 * These tests mutate localStorage so they use a unique prefix
 * ("_test_" keys) to avoid clobbering real app data.  The
 * teardown() function at the end cleans them up.
 *
 * NOTE: This file requires storage.js to be loaded first (the
 * test-runner.html loads them in the correct order).
 */

(function () {
  'use strict';

  /* ----------------------------------------------------------------
     Tiny assertion helpers
     ---------------------------------------------------------------- */
  var passed = 0;
  var failed = 0;

  function assert(label, condition) {
    if (condition) {
      console.log('%c PASS %c ' + label, 'background:#6e9075;color:#fff;font-weight:700', '');
      passed++;
    } else {
      console.error('%c FAIL %c ' + label, 'background:#b5482f;color:#fff;font-weight:700', '');
      failed++;
    }
  }

  function assertEqual(label, actual, expected) {
    var ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) {
      console.error(
        '%c FAIL %c ' + label + '\n  expected: ' + JSON.stringify(expected) +
        '\n  actual:   ' + JSON.stringify(actual),
        'background:#b5482f;color:#fff;font-weight:700', ''
      );
      failed++;
    } else {
      console.log('%c PASS %c ' + label, 'background:#6e9075;color:#fff;font-weight:700', '');
      passed++;
    }
  }

  /* ----------------------------------------------------------------
     Setup — point Storage at test-scoped localStorage keys so real
     app data is never touched.
     ---------------------------------------------------------------- */

  /**
   * Because Storage uses module-internal key constants (ITEMS_KEY /
   * SALES_KEY), we isolate tests by clearing those specific keys
   * before and after the suite, rather than stubbing localStorage.
   */
  function clearTestData() {
    localStorage.removeItem('inventory_items');
    localStorage.removeItem('sales_log');
  }

  /* ----------------------------------------------------------------
     SUITE 1 — First-ever run / empty state
     ---------------------------------------------------------------- */
  console.group('Suite 1 — Empty / first-run state');
  clearTestData();

  assert(
    'getItems() returns [] when localStorage is empty',
    Array.isArray(Storage.getItems()) && Storage.getItems().length === 0
  );

  assert(
    'getSales() returns [] when localStorage is empty',
    Array.isArray(Storage.getSales()) && Storage.getSales().length === 0
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 2 — addItem()
     ---------------------------------------------------------------- */
  console.group('Suite 2 — addItem()');
  clearTestData();

  var itemA = Storage.addItem({
    name:         'Widget Alpha',
    sku:          'WGT-001',
    currentStock: 100,
    leadTimeDays: 7,
    safetyStock:  20,
    reorderQty:   50
  });

  assert(
    'addItem() returns an object',
    itemA !== null && typeof itemA === 'object'
  );

  assert(
    'addItem() auto-generates an id starting with "itm_"',
    typeof itemA.id === 'string' && itemA.id.indexOf('itm_') === 0
  );

  assert(
    'addItem() auto-generates a createdAt ISO string',
    typeof itemA.createdAt === 'string' && itemA.createdAt.length > 0
  );

  assert(
    'addItem() stores the item in localStorage (getItems() returns 1 item)',
    Storage.getItems().length === 1
  );

  var itemB = Storage.addItem({
    name:         'Gadget Beta',
    sku:          'GDT-002',
    currentStock: 50,
    leadTimeDays: 5,
    safetyStock:  10,
    reorderQty:   25
  });

  assert(
    'addItem() second call → getItems() returns 2 items',
    Storage.getItems().length === 2
  );

  assert(
    'Two generated ids are different',
    itemA.id !== itemB.id
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 3 — updateItem()
     ---------------------------------------------------------------- */
  console.group('Suite 3 — updateItem()');

  var updated = Storage.updateItem(itemA.id, { currentStock: 90, leadTimeDays: 10 });

  assert(
    'updateItem() returns the updated item',
    updated !== null && updated.id === itemA.id
  );

  assertEqual(
    'updateItem() merges currentStock correctly',
    updated.currentStock,
    90
  );

  assertEqual(
    'updateItem() merges leadTimeDays correctly',
    updated.leadTimeDays,
    10
  );

  assert(
    'updateItem() does not change immutable id',
    updated.id === itemA.id
  );

  assert(
    'updateItem() does not change immutable createdAt',
    updated.createdAt === itemA.createdAt
  );

  var notFound = Storage.updateItem('itm_does_not_exist', { currentStock: 0 });
  assert(
    'updateItem() returns null for unknown id',
    notFound === null
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 4 — addSale() + stock decrement
     ---------------------------------------------------------------- */
  console.group('Suite 4 — addSale() + stock decrement');

  /* Re-read itemA's current stock (was set to 90 in Suite 3) */
  var stockBefore = Storage.getItems().filter(function (i) {
    return i.id === itemA.id;
  })[0].currentStock;

  var sale1 = Storage.addSale({
    itemId:       itemA.id,
    quantitySold: 15,
    date:         '2026-08-15'
  });

  assert(
    'addSale() returns an object',
    sale1 !== null && typeof sale1 === 'object'
  );

  assert(
    'addSale() auto-generates an id starting with "sale_"',
    typeof sale1.id === 'string' && sale1.id.indexOf('sale_') === 0
  );

  assert(
    'addSale() saves the sale to getSales()',
    Storage.getSales().length === 1
  );

  var stockAfter = Storage.getItems().filter(function (i) {
    return i.id === itemA.id;
  })[0].currentStock;

  assertEqual(
    'addSale() decrements currentStock correctly (90 - 15 = 75)',
    stockAfter,
    stockBefore - 15
  );

  /* Second sale */
  var sale2 = Storage.addSale({
    itemId:       itemA.id,
    quantitySold: 10,
    date:         '2026-08-16'
  });

  assertEqual(
    'Second addSale() → getSales() length is 2',
    Storage.getSales().length,
    2
  );

  var stockAfter2 = Storage.getItems().filter(function (i) {
    return i.id === itemA.id;
  })[0].currentStock;

  assertEqual(
    'Second addSale() decrements stock again (75 - 10 = 65)',
    stockAfter2,
    75 - 10
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 5 — getSalesForItem()
     ---------------------------------------------------------------- */
  console.group('Suite 5 — getSalesForItem()');

  /* Add a sale for itemB so we can confirm filtering works */
  Storage.addSale({
    itemId:       itemB.id,
    quantitySold: 5,
    date:         '2026-08-17'
  });

  var salesForA = Storage.getSalesForItem(itemA.id);
  var salesForB = Storage.getSalesForItem(itemB.id);

  assertEqual(
    'getSalesForItem(itemA.id) returns 2 records',
    salesForA.length,
    2
  );

  assertEqual(
    'getSalesForItem(itemB.id) returns 1 record',
    salesForB.length,
    1
  );

  assert(
    'getSalesForItem(itemA.id) — all records belong to itemA',
    salesForA.every(function (s) { return s.itemId === itemA.id; })
  );

  assert(
    'getSalesForItem("nonexistent_id") returns empty array',
    Storage.getSalesForItem('itm_nonexistent').length === 0
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 6 — addSale() with unknown itemId (no crash, no decrement)
     ---------------------------------------------------------------- */
  console.group('Suite 6 — addSale() with unknown itemId');

  var salesCountBefore = Storage.getSales().length;
  var itemsSnapshot    = JSON.stringify(Storage.getItems()); /* stock unchanged */

  var orphanSale = Storage.addSale({
    itemId:       'itm_does_not_exist',
    quantitySold: 999,
    date:         '2026-08-18'
  });

  assert(
    'addSale() with unknown itemId still saves the sale record',
    Storage.getSales().length === salesCountBefore + 1
  );

  assert(
    'addSale() with unknown itemId does NOT change any item stock',
    JSON.stringify(Storage.getItems()) === itemsSnapshot
  );

  assert(
    'addSale() with unknown itemId still returns a sale object',
    orphanSale !== null && typeof orphanSale.id === 'string'
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 7 — deleteItem() (sales history preserved)
     ---------------------------------------------------------------- */
  console.group('Suite 7 — deleteItem()');

  var salesCountBeforeDelete = Storage.getSales().length;
  var deleted = Storage.deleteItem(itemB.id);

  assert(
    'deleteItem() returns true when item exists',
    deleted === true
  );

  assertEqual(
    'deleteItem() reduces getItems() length by 1',
    Storage.getItems().length,
    1
  );

  assertEqual(
    'deleteItem() does NOT remove sales history (sales count unchanged)',
    Storage.getSales().length,
    salesCountBeforeDelete
  );

  var notFoundDelete = Storage.deleteItem('itm_phantom');
  assert(
    'deleteItem() returns false for unknown id',
    notFoundDelete === false
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 8 — "Page reload" simulation
     Reading fresh from localStorage (same JS process, same keys)
     simulates what happens when the user navigates away and back.
     ---------------------------------------------------------------- */
  console.group('Suite 8 — "Page reload" simulation (re-read from localStorage)');

  /*
   * We can't actually reload the page in a test, but we can verify
   * that calling getItems() / getSales() again returns the same data
   * that's currently stored — i.e. localStorage is the source of
   * truth, not any in-memory cache.
   */
  var reloadedItems = Storage.getItems();
  var reloadedSales = Storage.getSales();

  assertEqual(
    'Re-calling getItems() returns same count as before (1 item)',
    reloadedItems.length,
    1
  );

  assert(
    'Re-calling getItems() — surviving item has the correct id',
    reloadedItems[0].id === itemA.id
  );

  assert(
    'Re-calling getSales() returns all sale records',
    reloadedSales.length > 0
  );

  assert(
    'Surviving item currentStock is correct (90 - 15 - 10 = 65)',
    reloadedItems[0].currentStock === 65
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 9 — Corrupted JSON fallback
     ---------------------------------------------------------------- */
  console.group('Suite 9 — Corrupted JSON fallback');

  /* Manually plant invalid JSON in the items key */
  localStorage.setItem('inventory_items', '{this is not: valid json}}}');

  var corruptRead = Storage.getItems();
  assert(
    'getItems() returns [] when localStorage contains malformed JSON',
    Array.isArray(corruptRead) && corruptRead.length === 0
  );

  /* Restore valid state for subsequent tests (if any) */
  clearTestData();

  console.groupEnd();

  /* ----------------------------------------------------------------
     SUITE 10 — todayDateString()
     ---------------------------------------------------------------- */
  console.group('Suite 10 — todayDateString()');

  var today = Storage.todayDateString();

  assert(
    'todayDateString() returns a string',
    typeof today === 'string'
  );

  assert(
    'todayDateString() matches YYYY-MM-DD format',
    /^\d{4}-\d{2}-\d{2}$/.test(today)
  );

  console.groupEnd();

  /* ----------------------------------------------------------------
     Final teardown + summary
     ---------------------------------------------------------------- */
  clearTestData();

  console.log(
    '\n%c StockWise storage.js — Test Results: ' + passed + ' passed, ' + failed + ' failed ',
    failed === 0
      ? 'background:#1c2430;color:#c7eccc;font-weight:700;font-size:14px;padding:4px 8px'
      : 'background:#b5482f;color:#fff;font-weight:700;font-size:14px;padding:4px 8px'
  );

  if (failed > 0) {
    console.error(
      '[StockWise:storage] ' + failed + ' test(s) failed — check FAIL lines above.'
    );
  }

})();
