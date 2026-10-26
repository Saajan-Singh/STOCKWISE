/**
 * StockWise — sales.js
 * ====================
 * Sales entry logic. Delegates persistence and inventory decrement
 * to Storage (storage.js) and the live backend API.
 *
 * Exports: Sales namespace
 */

var Sales = (function () {
  'use strict';

  /* ----------------------------------------------------------------
     logSale(itemId, quantity, date)
     ----------------------------------------------------------------
     Validates input, then calls Storage.addSale() to persist the
     record to the backend and decrement stock.
     ---------------------------------------------------------------- */
  async function logSale(itemId, quantity, date) {

    /* ── 1. Validate itemId ── */
    if (!itemId) {
      return { ok: false, error: 'Please select an item.' };
    }

    /* ── 2. Validate quantity ── */
    var qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      return { ok: false, error: 'Quantity must be a positive number.' };
    }

    /* ── 3. Validate date ── */
    if (!date) {
      return { ok: false, error: 'Date is required.' };
    }

    /* Check format: YYYY-MM-DD */
    var datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return { ok: false, error: 'Date must be in YYYY-MM-DD format.' };
    }

    /* Parse and sanity-check */
    var parts = date.split('-');
    var parsed = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
    if (isNaN(parsed.getTime())) {
      return { ok: false, error: 'Invalid date.' };
    }

    /* Cannot be in the future */
    var today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsed > today) {
      return { ok: false, error: 'Sale date cannot be in the future.' };
    }

    /* ── 4. Persist via Storage API ── */
    try {
      var sale = await Storage.addSale({
        itemId:       itemId,
        quantitySold: qty,
        date:         date
      });

      return { ok: true, sale: sale };
    } catch (err) {
      return { ok: false, error: err.message || 'Failed to log sale on server.' };
    }
  }

  /* ----------------------------------------------------------------
     Public API
     ---------------------------------------------------------------- */
  return {
    logSale: logSale
  };

})();

if (Object.freeze) Object.freeze(Sales);
