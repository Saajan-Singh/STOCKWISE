/**
 * StockWise — items.js
 * ====================
 * Item CRUD logic.  All storage reads/writes go through Storage
 * (storage.js).  This module validates input and delegates persistence.
 *
 * Exports: Items namespace
 */

var Items = (function () {
  'use strict';

  /* ----------------------------------------------------------------
     createItem(formData)
     ----------------------------------------------------------------
     Validates required fields, builds the item object, calls
     Storage.addItem(), and returns the created item.

     @param {Object} formData
       - name          {string}  required
       - sku           {string}  required
       - currentStock  {number}  required, ≥ 0
       - leadTimeDays  {number}  required, ≥ 0
       - safetyStock   {number}  required, ≥ 0
       - reorderQty    {number}  optional, defaults to 0

     @returns {{ ok: boolean, item?: InventoryItem, error?: string }}
     ---------------------------------------------------------------- */
  function createItem(formData) {

    /* ── 1. Validate name ── */
    var name = (formData.name || '').trim();
    if (!name) {
      return { ok: false, error: 'Item name is required.' };
    }

    /* ── 2. Validate SKU ── */
    var sku = (formData.sku || '').trim();
    if (!sku) {
      return { ok: false, error: 'SKU is required.' };
    }

    /* ── 3. Validate currentStock ── */
    var currentStock = Number(formData.currentStock);
    if (formData.currentStock === '' || formData.currentStock === undefined || isNaN(currentStock)) {
      return { ok: false, error: 'Starting stock must be a number.' };
    }
    if (currentStock < 0) {
      return { ok: false, error: 'Starting stock cannot be negative.' };
    }

    /* ── 4. Validate leadTimeDays ── */
    var leadTimeDays = Number(formData.leadTimeDays);
    if (formData.leadTimeDays === '' || formData.leadTimeDays === undefined || isNaN(leadTimeDays)) {
      return { ok: false, error: 'Lead time must be a number.' };
    }
    if (leadTimeDays < 0) {
      return { ok: false, error: 'Lead time cannot be negative.' };
    }

    /* ── 5. Validate safetyStock ── */
    var safetyStock = Number(formData.safetyStock);
    if (formData.safetyStock === '' || formData.safetyStock === undefined || isNaN(safetyStock)) {
      return { ok: false, error: 'Safety stock must be a number.' };
    }
    if (safetyStock < 0) {
      return { ok: false, error: 'Safety stock cannot be negative.' };
    }

    /* ── 6. reorderQty (optional) ── */
    var reorderQty = Number(formData.reorderQty) || 0;

    /* ── 7. Build and persist ── */
    var item = Storage.addItem({
      name:         name,
      sku:          sku,
      currentStock: currentStock,
      leadTimeDays: leadTimeDays,
      safetyStock:  safetyStock,
      reorderQty:   reorderQty
    });

    return { ok: true, item: item };
  }

  /* ----------------------------------------------------------------
     Public API
     ---------------------------------------------------------------- */
  return {
    createItem: createItem
  };

})();

if (Object.freeze) Object.freeze(Items);
