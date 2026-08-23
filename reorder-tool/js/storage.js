/**
 * StockWise — storage.js
 * ======================
 * THE ONLY file in this codebase that is permitted to call
 * localStorage.getItem() or localStorage.setItem() directly.
 *
 * Every other module (items.js, sales.js, dashboard.js, app.js,
 * forecast.js) must go through the functions exported here.
 *
 * Design contract
 * ---------------
 * • Never throw — every public function that reads from localStorage
 *   wraps JSON.parse() in a try/catch and falls back to a safe empty
 *   value so the rest of the app never encounters undefined or an
 *   exception from a missing/corrupted key.
 * • Never write an id of undefined — addItem() and addSale() always
 *   auto-generate an id when the caller omits one.
 * • Sale logging and stock decrementing are atomic inside addSale()
 *   so the two stores can never drift out of sync.
 *
 * localStorage keys
 * -----------------
 *   "inventory_items"  →  InventoryItem[]
 *   "sales_log"        →  SaleRecord[]
 *
 * ----------------------------------------------------------------
 * DATA SHAPES
 * ----------------------------------------------------------------
 *
 * InventoryItem {
 *   id:            string        // "itm_<timestamp>_<random>"
 *   name:          string
 *   sku:           string
 *   currentStock:  number
 *   leadTimeDays:  number
 *   safetyStock:   number
 *   reorderQty:    number
 *   createdAt:     ISOString
 * }
 *
 * SaleRecord {
 *   id:             string       // "sale_<timestamp>_<random>"
 *   itemId:         string       // references an InventoryItem.id
 *   quantitySold:   number
 *   date:           "YYYY-MM-DD" // plain date — no time component to
 *                                // avoid timezone shift bugs
 * }
 */

/* ================================================================
   INTERNAL CONSTANTS
   ================================================================ */

/** @type {string} */
var ITEMS_KEY = 'inventory_items';

/** @type {string} */
var SALES_KEY = 'sales_log';

/* ================================================================
   INTERNAL HELPERS
   ================================================================ */

/**
 * Generate a short alphanumeric suffix (6 chars) to make IDs
 * unique even when multiple records are created within the same
 * millisecond (e.g. bulk imports, tests).
 *
 * @returns {string}
 */
function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Generate an InventoryItem id.
 * Format: "itm_<timestamp>_<6-char random>"
 *
 * @returns {string}
 */
function generateItemId() {
  return 'itm_' + Date.now() + '_' + randomSuffix();
}

/**
 * Generate a SaleRecord id.
 * Format: "sale_<timestamp>_<6-char random>"
 *
 * @returns {string}
 */
function generateSaleId() {
  return 'sale_' + Date.now() + '_' + randomSuffix();
}

/**
 * Safely parse a JSON string stored in localStorage.
 * Returns `fallback` (default []) when:
 *   • the key doesn't exist (getItem returns null)
 *   • the stored value is not valid JSON
 *   • the parsed value is not an Array (guards against scalar corruption)
 *
 * @param {string} key
 * @param {*} [fallback=[]]
 * @returns {Array}
 */
function safeRead(key, fallback) {
  if (fallback === undefined) fallback = [];
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    var parsed = JSON.parse(raw);
    /* Guard: if somehow a non-array was stored, return fallback */
    if (!Array.isArray(parsed)) {
      console.warn(
        '[StockWise:storage] Key "' + key + '" did not contain an array. ' +
        'Discarding corrupted value and returning empty array.'
      );
      return fallback;
    }
    return parsed;
  } catch (err) {
    console.warn(
      '[StockWise:storage] JSON.parse failed for key "' + key + '". ' +
      'Discarding corrupted value and returning empty array.',
      err
    );
    return fallback;
  }
}

/**
 * Safely stringify and write an array to localStorage.
 *
 * @param {string} key
 * @param {Array} arr
 */
function safeWrite(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (err) {
    /* Can happen if storage is full (QuotaExceededError) */
    console.error(
      '[StockWise:storage] Could not write to localStorage key "' + key + '".',
      err
    );
  }
}

/* ================================================================
   INVENTORY ITEMS API
   ================================================================ */

/**
 * Return the full inventory_items array.
 * Always returns an Array (never undefined, never throws).
 *
 * @returns {InventoryItem[]}
 */
function getItems() {
  return safeRead(ITEMS_KEY);
}

/**
 * Overwrite the entire inventory_items array in localStorage.
 * Use this only when you already hold the full mutated array.
 * Prefer addItem() / updateItem() / deleteItem() for normal ops.
 *
 * @param {InventoryItem[]} items
 */
function saveItems(items) {
  safeWrite(ITEMS_KEY, items);
}

/**
 * Add a new inventory item.
 * Auto-generates `id` and `createdAt` if not already present on
 * the passed object — callers should generally omit both.
 *
 * @param {Partial<InventoryItem>} item
 * @returns {InventoryItem} The saved item including its generated id.
 */
function addItem(item) {
  var items = getItems();

  /* Build a complete record, generating any missing system fields */
  var newItem = Object.assign({}, item, {
    id:        item.id        || generateItemId(),
    createdAt: item.createdAt || new Date().toISOString()
  });

  items.push(newItem);
  saveItems(items);

  return newItem;
}

/**
 * Update an existing item by id.
 * Merges `updatedFields` into the matching record (shallow merge).
 * Does NOT allow the caller to overwrite `id` or `createdAt` via
 * updatedFields — those are immutable after creation.
 *
 * @param {string} itemId
 * @param {Partial<InventoryItem>} updatedFields
 * @returns {InventoryItem|null} The updated item, or null if not found.
 */
function updateItem(itemId, updatedFields) {
  var items = getItems();
  var index = -1;

  for (var i = 0; i < items.length; i++) {
    if (items[i].id === itemId) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    console.warn('[StockWise:storage] updateItem — no item found with id "' + itemId + '".');
    return null;
  }

  /* Merge, but protect immutable fields */
  var merged = Object.assign({}, items[index], updatedFields, {
    id:        items[index].id,
    createdAt: items[index].createdAt
  });

  items[index] = merged;
  saveItems(items);

  return merged;
}

/**
 * Delete an item by id.
 *
 * NOTE: The matching item's sales history in `sales_log` is
 * intentionally preserved. Historical sale records are valuable
 * for trend analysis even after an item is retired. If you need
 * to wipe sales for a deleted item, call getSalesForItem() and
 * saveSales() separately and explicitly.
 *
 * @param {string} itemId
 * @returns {boolean} true if an item was removed, false if not found.
 */
function deleteItem(itemId) {
  var items = getItems();
  var originalLength = items.length;

  var filtered = items.filter(function (it) {
    return it.id !== itemId;
  });

  if (filtered.length === originalLength) {
    console.warn('[StockWise:storage] deleteItem — no item found with id "' + itemId + '".');
    return false;
  }

  saveItems(filtered);
  return true;
}

/* ================================================================
   SALES LOG API
   ================================================================ */

/**
 * Return the full sales_log array.
 * Always returns an Array (never undefined, never throws).
 *
 * @returns {SaleRecord[]}
 */
function getSales() {
  return safeRead(SALES_KEY);
}

/**
 * Overwrite the entire sales_log array in localStorage.
 * Prefer addSale() for normal logging; use this only when you hold
 * the full mutated array (e.g. bulk migration).
 *
 * @param {SaleRecord[]} sales
 */
function saveSales(sales) {
  safeWrite(SALES_KEY, sales);
}

/**
 * Log a new sale AND decrement the matching item's currentStock.
 *
 * These two side-effects happen inside a single function call to
 * ensure they are always in sync — you can never log a sale without
 * decrementing stock, and you can never decrement stock without a
 * matching sale record.
 *
 * Edge-case: if `sale.itemId` doesn't match any existing item, the
 * sale record is still saved (for audit purposes) but stock is NOT
 * decremented and a console warning is emitted.
 *
 * The `date` field should be supplied by the caller as "YYYY-MM-DD".
 * If omitted, today's local date is used (no time, no timezone shift).
 *
 * @param {Partial<SaleRecord>} sale
 * @returns {SaleRecord} The saved sale record including its generated id.
 */
function addSale(sale) {
  /* ── 1. Build and persist the sale record ── */
  var newSale = Object.assign({}, sale, {
    id:   sale.id   || generateSaleId(),
    date: sale.date || todayDateString()
  });

  var sales = getSales();
  sales.push(newSale);
  saveSales(sales);

  /* ── 2. Decrement the matching item's stock ── */
  var items = getItems();
  var matchIndex = -1;

  for (var i = 0; i < items.length; i++) {
    if (items[i].id === newSale.itemId) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) {
    console.warn(
      '[StockWise:storage] addSale — no item found with id "' + newSale.itemId + '". ' +
      'Sale record saved but stock was NOT decremented.'
    );
  } else {
    var currentStock = Number(items[matchIndex].currentStock) || 0;
    var qty          = Number(newSale.quantitySold)           || 0;
    updateItem(newSale.itemId, {
      currentStock: currentStock - qty
    });
  }

  return newSale;
}

/**
 * Return only the sale records that belong to a specific item.
 * Used heavily by forecast.js to compute average daily demand.
 *
 * @param {string} itemId
 * @returns {SaleRecord[]}
 */
function getSalesForItem(itemId) {
  return getSales().filter(function (sale) {
    return sale.itemId === itemId;
  });
}

/* ================================================================
   UTILITY — LOCAL DATE STRING
   ================================================================ */

/**
 * Return today's date as "YYYY-MM-DD" in the browser's LOCAL timezone.
 * Using toISOString() would give a UTC date which can differ from the
 * user's local date near midnight — this helper avoids that bug.
 *
 * @returns {string} e.g. "2026-08-20"
 */
function todayDateString() {
  var d   = new Date();
  var yr  = d.getFullYear();
  var mo  = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return yr + '-' + mo + '-' + day;
}

/* ================================================================
   NAMESPACE EXPORT
   ================================================================
   Because this project must run via file:// (no bundler, no server),
   we cannot use ES6 `export`. Instead we attach everything to a
   single global namespace object — Storage — so every other module
   can call  Storage.getItems(), Storage.addSale(), etc.
   ================================================================ */

var Storage = {
  /* Items */
  getItems:   getItems,
  saveItems:  saveItems,
  addItem:    addItem,
  updateItem: updateItem,
  deleteItem: deleteItem,

  /* Sales */
  getSales:        getSales,
  saveSales:       saveSales,
  addSale:         addSale,
  getSalesForItem: getSalesForItem,

  /* Utility */
  todayDateString: todayDateString
};

/* Freeze the namespace so no other module can accidentally overwrite
   a method (e.g. Storage.getItems = something_else). */
if (Object.freeze) Object.freeze(Storage);
