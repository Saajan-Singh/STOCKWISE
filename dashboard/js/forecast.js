/**
 * StockWise — forecast.js
 * =======================
 * Pure calculation functions for demand forecasting and stock status.
 *
 * RULES:
 *  - NO DOM access
 *  - NO localStorage access
 *  - NO side effects — every function is a pure input→output transform.
 *  - Never returns NaN — returns 0 when data is insufficient.
 *
 * The cold-start rule (item has fewer than 3 total sale records →
 * treat as "insufficient-data") is intentionally NOT in this file.
 * That is a presentation concern handled by dashboard.js, since this
 * module should stay purely mathematical.
 */

/* ================================================================
   1. MOVING AVERAGE DEMAND
   ================================================================ */

/**
 * Compute average daily demand over a trailing window.
 *
 * Sum `quantitySold` for all sales whose `date` falls within
 * [today - windowDays + 1, today] inclusive, then divide by
 * `windowDays` (NOT by count of sale records — zero-sale days
 * are correctly averaged in, which avoids over-estimating demand
 * from sparse sales data).
 *
 * @param {SaleRecord[]} salesForOneItem  — sales already filtered
 *        to a single item (caller uses Storage.getSalesForItem()).
 * @param {number} [windowDays=14]       — look-back window in days.
 * @returns {number} Average units sold per day (≥ 0, never NaN).
 */
function movingAverageDemand(salesForOneItem, windowDays) {
  if (windowDays === undefined) windowDays = 14;
  if (!salesForOneItem || salesForOneItem.length === 0) return 0;
  if (windowDays <= 0) return 0;

  /* Build the cutoff date: start of (today - windowDays + 1) */
  var now    = new Date();
  var cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - windowDays + 1);

  var totalQty = 0;
  for (var i = 0; i < salesForOneItem.length; i++) {
    var sale = salesForOneItem[i];
    /* Parse "YYYY-MM-DD" as local date (not UTC) */
    var parts = String(sale.date).split('-');
    var saleDate = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );

    if (saleDate >= cutoff && saleDate <= now) {
      totalQty += Number(sale.quantitySold) || 0;
    }
  }

  return totalQty / windowDays;
}

/* ================================================================
   2. REORDER POINT
   ================================================================ */

/**
 * ROP = (average daily demand × lead time in days) + safety stock.
 *
 * @param {number} avgDailyDemand
 * @param {number} leadTimeDays
 * @param {number} safetyStock
 * @returns {number}
 */
function reorderPoint(avgDailyDemand, leadTimeDays, safetyStock) {
  return (avgDailyDemand * leadTimeDays) + safetyStock;
}

/* ================================================================
   3. STOCK STATUS
   ================================================================ */

/**
 * Classify current stock level relative to the reorder point.
 *
 * @param {number} currentStock
 * @param {number} rop — computed reorder point
 * @returns {"critical"|"reorder"|"healthy"}
 */
function getStockStatus(currentStock, rop) {
  if (currentStock <= rop * 0.5) return 'critical';
  if (currentStock <= rop)       return 'reorder';
  return 'healthy';
}

/* ================================================================
   NAMESPACE EXPORT
   ================================================================ */

var Forecast = {
  movingAverageDemand: movingAverageDemand,
  reorderPoint:        reorderPoint,
  getStockStatus:      getStockStatus
};

if (Object.freeze) Object.freeze(Forecast);
