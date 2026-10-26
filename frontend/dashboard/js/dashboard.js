/**
 * StockWise — dashboard.js
 * ========================
 * Rendering and event wiring ONLY.
 * No math — delegates to Forecast (forecast.js).
 * No direct localStorage — delegates to Storage (storage.js).
 * No CRUD logic — delegates to Items/Sales (items.js, sales.js).
 *
 * Session keys (loggedInOwnerName, loggedInBusinessName) are read
 * from localStorage directly as a Phase 1 auth stand-in, consistent
 * with how the rest of the project does session management.
 */

(function () {
  'use strict';

  /* ================================================================
     CONSTANTS
     ================================================================ */
  var KEY_OWNER_NAME = 'loggedInOwnerName';
  var KEY_BIZ_NAME   = 'loggedInBusinessName';
  var COLD_START_MIN = 3; /* min sale records before forecasting */

  /* ================================================================
     SESSION CHECK
     ================================================================ */
  var ownerName = '';
  var bizName   = '';

  var token = '';
  try {
    token     = localStorage.getItem('token') || '';
    ownerName = localStorage.getItem(KEY_OWNER_NAME) || '';
    bizName   = localStorage.getItem(KEY_BIZ_NAME)   || '';
  } catch (err) {
    console.warn('[StockWise:dashboard] Could not read from localStorage.', err);
  }

  /* ── DOM: session-dependent elements ── */
  var noSessionSection = document.getElementById('no-session-section');
  var welcomeHeading   = document.getElementById('welcome-heading');
  var welcomeBiz       = document.getElementById('welcome-biz');
  var navbarUserLabel  = document.getElementById('navbar-user-label');
  var dashboardContent = document.getElementById('dashboard-content');

  var displayName = ownerName || (token ? 'Operator' : '');
  var displayBiz  = bizName || (token ? 'Main Warehouse' : '');

  if (token || (ownerName && bizName)) {
    if (welcomeHeading) welcomeHeading.textContent = 'Welcome back, ' + displayName;
    if (welcomeBiz) welcomeBiz.textContent     = displayBiz + ' — Dashboard';
    if (navbarUserLabel) navbarUserLabel.textContent = displayName;
    if (noSessionSection) noSessionSection.classList.remove('visible');
    if (dashboardContent) dashboardContent.style.display = '';
  } else {
    if (noSessionSection) noSessionSection.classList.add('visible');
    if (navbarUserLabel) navbarUserLabel.textContent = '';
    if (dashboardContent) dashboardContent.style.display = 'none';
  }

  /* ================================================================
     LOG OUT
     ================================================================ */
  var btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem(KEY_OWNER_NAME);
        localStorage.removeItem(KEY_BIZ_NAME);
        localStorage.removeItem('inventory_items');
        localStorage.removeItem('sales_log');
      } catch (err) {
        console.warn('[StockWise:dashboard] Could not clear session.', err);
      }
      window.location.href = '../login/';
    });
  }

  /* ================================================================
     STAT TILES
     ================================================================ */
  var tileTotal    = document.getElementById('stat-total');
  var tileReorder  = document.getElementById('stat-reorder');
  var tileCritical = document.getElementById('stat-critical');

  /* ================================================================
     INVENTORY TABLE
     ================================================================ */
  var tableBody    = document.getElementById('inventory-tbody');
  var emptyState   = document.getElementById('empty-state');

  /**
   * Compute enriched data for every item (status, avg demand, rop)
   * and return a sorted array ready for rendering.
   */
  function computeItemData() {
    var items = Storage.getItems();
    var enriched = [];

    for (var i = 0; i < items.length; i++) {
      var item  = items[i];
      var sales = Storage.getSalesForItem(item.id);

      var record = {
        item:           item,
        sales:          sales,
        avgDemand:      0,
        rop:            0,
        status:         'insufficient-data',
        salesCount:     sales.length,
        currentStock:   Number(item.currentStock) || 0,
        safetyStock:    Number(item.safetyStock)  || 0,
        leadTimeDays:   Number(item.leadTimeDays)  || 0
      };

      /* Cold-start: fewer than 3 sales → insufficient data */
      if (sales.length >= COLD_START_MIN) {
        record.avgDemand = Forecast.movingAverageDemand(sales, 14);
        record.rop       = Forecast.reorderPoint(
          record.avgDemand, record.leadTimeDays, record.safetyStock
        );
        record.status    = Forecast.getStockStatus(record.currentStock, record.rop);
      }

      enriched.push(record);
    }

    /* Sort: critical first, then reorder, then insufficient-data, then healthy */
    var ORDER = { 'critical': 0, 'reorder': 1, 'insufficient-data': 2, 'healthy': 3 };
    enriched.sort(function (a, b) {
      return (ORDER[a.status] || 9) - (ORDER[b.status] || 9);
    });

    return enriched;
  }

  /* ================================================================
     RENDER — STAT TILES
     ================================================================ */
  function renderStats(data) {
    var total    = data.length;
    var reorder  = 0;
    var critical = 0;

    for (var i = 0; i < data.length; i++) {
      if (data[i].status === 'reorder')  reorder++;
      if (data[i].status === 'critical') critical++;
    }

    if (tileTotal)    tileTotal.textContent    = total.toLocaleString();
    if (tileReorder)  tileReorder.textContent  = reorder.toLocaleString();
    if (tileCritical) tileCritical.textContent = critical.toLocaleString();
  }

  /* ================================================================
     RENDER — GAUGE BAR
     ================================================================
     A 3-zone segmented bar:
       Zone 1 (0%–33%):  Critical (red)
       Zone 2 (33%–66%): Reorder  (amber)
       Zone 3 (66%–100%): Healthy  (green)
     The marker position represents currentStock relative to a
     meaningful max — we use max(currentStock, rop*2, safetyStock*3, 1)
     so the gauge adapts to the item's own scale.
     ================================================================ */
  function buildGaugeHTML(record) {
    if (record.status === 'insufficient-data') {
      return '<div class="gauge-placeholder">—</div>';
    }

    var max = Math.max(record.currentStock, record.rop * 2, record.safetyStock * 3, 1);
    var pct = Math.min(Math.max((record.currentStock / max) * 100, 2), 98);

    var markerClass = 'gauge-marker gauge-marker--' + record.status;

    return '' +
      '<div class="stock-gauge">' +
        '<div class="gauge-zone gauge-zone--critical"></div>' +
        '<div class="gauge-zone gauge-zone--reorder"></div>' +
        '<div class="gauge-zone gauge-zone--healthy"></div>' +
        '<div class="' + markerClass + '" style="left:' + pct.toFixed(1) + '%;"></div>' +
      '</div>';
  }

  /* ================================================================
     RENDER — STATUS BADGE
     ================================================================ */
  function buildBadgeHTML(status) {
    var label = status.toUpperCase().replace('-', ' ');
    return '<span class="status-tag status-tag--' + status + '">' + label + '</span>';
  }

  /* ================================================================
     RENDER — TABLE
     ================================================================ */
  function renderTable(data) {
    if (!tableBody) return;

    if (data.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    var html = '';
    for (var i = 0; i < data.length; i++) {
      var r    = data[i];
      var item = r.item;

      var criticalBar = r.status === 'critical'
        ? '<div class="row-critical-bar"></div>'
        : '';

      var avgText = r.status === 'insufficient-data'
        ? '—'
        : r.avgDemand.toFixed(1) + '/day';

      var ropText = r.status === 'insufficient-data'
        ? '—'
        : Math.round(r.rop);

      html += '' +
        '<tr class="inv-row' + (i % 2 === 1 ? ' inv-row--alt' : '') + '">' +
          '<td class="inv-cell inv-cell--name">' +
            criticalBar +
            '<div class="inv-cell__name-wrap">' +
              '<span class="inv-cell__item-name">' + escapeHTML(item.name) + '</span>' +
            '</div>' +
          '</td>' +
          '<td class="inv-cell inv-cell--sku">' + escapeHTML(item.sku) + '</td>' +
          '<td class="inv-cell inv-cell--stock">' + r.currentStock + '</td>' +
          '<td class="inv-cell inv-cell--avg">' + avgText + '</td>' +
          '<td class="inv-cell inv-cell--rop">' + ropText + '</td>' +
          '<td class="inv-cell inv-cell--gauge">' + buildGaugeHTML(r) + '</td>' +
          '<td class="inv-cell inv-cell--status">' + buildBadgeHTML(r.status) + '</td>' +
        '</tr>';
    }

    tableBody.innerHTML = html;
  }

  /* ================================================================
     FULL RE-RENDER
     ================================================================ */
  function renderAll() {
    var data = computeItemData();
    renderStats(data);
    renderTable(data);
  }

  /* ================================================================
     MODALS — ADD ITEM
     ================================================================ */
  var addItemModal     = document.getElementById('modal-add-item');
  var addItemForm      = document.getElementById('add-item-form');
  var addItemError     = document.getElementById('add-item-error');
  var btnOpenAddItem   = document.getElementById('btn-open-add-item');
  var btnCloseAddItem  = document.getElementById('btn-close-add-item');

  function openModal(modal) {
    if (modal) modal.classList.add('is-open');
  }
  function closeModal(modal) {
    if (modal) modal.classList.remove('is-open');
  }

  if (btnOpenAddItem) {
    btnOpenAddItem.addEventListener('click', function () {
      openModal(addItemModal);
      if (addItemForm) addItemForm.reset();
      if (addItemError) addItemError.textContent = '';
    });
  }

  if (btnCloseAddItem) {
    btnCloseAddItem.addEventListener('click', function () {
      closeModal(addItemModal);
    });
  }

  if (addItemForm) {
    addItemForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (addItemError) addItemError.textContent = '';

      var submitBtn = addItemForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
      }

      var result = await Items.createItem({
        name:         addItemForm.elements['item-name'].value,
        sku:          addItemForm.elements['item-sku'].value,
        currentStock: addItemForm.elements['item-stock'].value,
        leadTimeDays: addItemForm.elements['item-lead'].value,
        safetyStock:  addItemForm.elements['item-safety'].value,
        reorderQty:   addItemForm.elements['item-reorder-qty'].value
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">add</span> Add Item';
      }

      if (!result.ok) {
        if (addItemError) addItemError.textContent = result.error;
        return;
      }

      closeModal(addItemModal);
      renderAll();
    });
  }

  /* ================================================================
     MODALS — LOG SALE
     ================================================================ */
  var logSaleModal     = document.getElementById('modal-log-sale');
  var logSaleForm      = document.getElementById('log-sale-form');
  var logSaleError     = document.getElementById('log-sale-error');
  var logSaleSelect    = document.getElementById('sale-item-id');
  var btnOpenLogSale   = document.getElementById('btn-open-log-sale');
  var btnCloseLogSale  = document.getElementById('btn-close-log-sale');

  function populateItemSelect() {
    if (!logSaleSelect) return;
    var items = Storage.getItems();

    /* Keep the first disabled placeholder option */
    logSaleSelect.innerHTML = '<option value="" disabled selected>Select Item</option>';

    for (var i = 0; i < items.length; i++) {
      var opt = document.createElement('option');
      opt.value = items[i].id || items[i]._id;
      opt.textContent = items[i].name + ' (' + items[i].sku + ')';
      logSaleSelect.appendChild(opt);
    }
  }

  if (btnOpenLogSale) {
    btnOpenLogSale.addEventListener('click', function () {
      populateItemSelect();
      openModal(logSaleModal);
      if (logSaleForm) logSaleForm.reset();
      if (logSaleError) logSaleError.textContent = '';
      /* Pre-fill date to today */
      var dateInput = logSaleForm ? logSaleForm.elements['sale-date'] : null;
      if (dateInput) dateInput.value = Storage.todayDateString();
    });
  }

  if (btnCloseLogSale) {
    btnCloseLogSale.addEventListener('click', function () {
      closeModal(logSaleModal);
    });
  }

  if (logSaleForm) {
    logSaleForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (logSaleError) logSaleError.textContent = '';

      var submitBtn = logSaleForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging...';
      }

      var result = await Sales.logSale(
        logSaleForm.elements['sale-item-id'].value,
        logSaleForm.elements['sale-qty'].value,
        logSaleForm.elements['sale-date'].value
      );

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">add_shopping_cart</span> Log Sale';
      }

      if (!result.ok) {
        if (logSaleError) logSaleError.textContent = result.error;
        return;
      }

      closeModal(logSaleModal);
      renderAll();
    });
  }

  /* ── Close modal on backdrop click ── */
  [addItemModal, logSaleModal].forEach(function (modal) {
    if (!modal) return;
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
    });
  });

  /* ── Close modal on Escape key ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal(addItemModal);
      closeModal(logSaleModal);
    }
  });

  /* ================================================================
     UTILITY — HTML ESCAPE
     ================================================================ */
  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  /* ================================================================
     INITIAL RENDER & BACKEND SYNC
     ================================================================ */
  async function initDashboard() {
    if (token || (ownerName && bizName)) {
      renderAll(); // Immediate render from local cache if available

      if (token && typeof Storage.fetchItems === 'function') {
        try {
          await Promise.all([Storage.fetchItems(), Storage.fetchSales()]);
          renderAll(); // Re-render with freshly synced backend data
        } catch (syncErr) {
          console.warn('[StockWise:dashboard] Sync with backend encountered an issue:', syncErr);
          if (syncErr && syncErr.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '../login/';
            return;
          }
        }
      }
    }
  }

  initDashboard();

})();
