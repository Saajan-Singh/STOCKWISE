/**
 * StockWise — storage.js
 * ======================
 * Central data access layer for StockWise.
 * Connects to live backend API (https://stockwise-133m.onrender.com)
 * with localStorage caching for high performance and offline resilience.
 */

var BASE_URL = typeof API_BASE_URL !== 'undefined'
  ? API_BASE_URL
  : (window.API_BASE_URL || 'https://stockwise-133m.onrender.com');

/* ================================================================
   INTERNAL CONSTANTS
   ================================================================ */
var ITEMS_KEY = 'inventory_items';
var SALES_KEY = 'sales_log';
var USERS_KEY = 'registered_users';

/* ================================================================
   INTERNAL HELPERS
   ================================================================ */
function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function generateItemId() {
  return 'itm_' + Date.now() + '_' + randomSuffix();
}

function generateSaleId() {
  return 'sale_' + Date.now() + '_' + randomSuffix();
}

function getAuthHeaders() {
  var token = localStorage.getItem('token');
  var headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

function normalizeItem(raw) {
  if (!raw) return null;
  return {
    id: raw._id || raw.id,
    _id: raw._id || raw.id,
    name: raw.name || '',
    sku: raw.sku || '',
    currentStock: Number(raw.currentStock) || 0,
    leadTimeDays: Number(raw.leadTimeDays) || 0,
    safetyStock: Number(raw.safetyStock) || 0,
    reorderQty: Number(raw.reorderQty) || 0,
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

function normalizeSale(raw) {
  if (!raw) return null;
  var itemId = '';
  if (raw.item) {
    itemId = typeof raw.item === 'object' ? (raw.item._id || raw.item.id) : raw.item;
  } else if (raw.itemId) {
    itemId = raw.itemId;
  }
  return {
    id: raw._id || raw.id,
    _id: raw._id || raw.id,
    itemId: itemId,
    item: raw.item,
    quantitySold: Number(raw.quantitySold) || 0,
    date: raw.date || ''
  };
}

function safeRead(key, fallback) {
  if (fallback === undefined) fallback = [];
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed;
  } catch (err) {
    return fallback;
  }
}

function safeWrite(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (err) {
    console.error('[StockWise:storage] Could not write to localStorage key "' + key + '".', err);
  }
}

/* ================================================================
   INVENTORY ITEMS API
   ================================================================ */

function getItems() {
  return safeRead(ITEMS_KEY);
}

function saveItems(items) {
  safeWrite(ITEMS_KEY, items);
}

async function fetchItems() {
  var token = localStorage.getItem('token');
  if (!token) return getItems();

  try {
    var res = await fetch(BASE_URL + '/api/items', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      console.warn('[StockWise:storage] 401 Unauthorized fetching items.');
      throw { status: 401, message: 'Session expired. Please log in again.' };
    }

    if (!res.ok) {
      var errData = {};
      try { errData = await res.json(); } catch (e) {}
      throw { status: res.status, message: errData.message || ('Server error (' + res.status + ')') };
    }

    var data = await res.json();
    var normalized = Array.isArray(data) ? data.map(normalizeItem) : [];
    saveItems(normalized);
    return normalized;
  } catch (err) {
    console.error('[StockWise:storage] fetchItems error:', err);
    throw err;
  }
}

async function addItem(item) {
  var token = localStorage.getItem('token');

  if (token) {
    var res = await fetch(BASE_URL + '/api/items', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: item.name,
        sku: item.sku,
        currentStock: Number(item.currentStock) || 0,
        leadTimeDays: Number(item.leadTimeDays) || 0,
        safetyStock: Number(item.safetyStock) || 0,
        reorderQty: Number(item.reorderQty) || 0
      })
    });

    var data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      var msg = data.message || ('Failed to create item (' + res.status + ')');
      throw new Error(msg);
    }

    var newItem = normalizeItem(data);
    var items = getItems();
    items.unshift(newItem);
    saveItems(items);
    return newItem;
  }

  // Fallback for offline/local
  var items = getItems();
  var localItem = Object.assign({}, item, {
    id: item.id || generateItemId(),
    createdAt: item.createdAt || new Date().toISOString()
  });
  items.push(localItem);
  saveItems(items);
  return localItem;
}

function updateItem(itemId, updatedFields) {
  var items = getItems();
  var index = -1;

  for (var i = 0; i < items.length; i++) {
    if (items[i].id === itemId || items[i]._id === itemId) {
      index = i;
      break;
    }
  }

  if (index === -1) return null;

  var merged = Object.assign({}, items[index], updatedFields, {
    id: items[index].id,
    createdAt: items[index].createdAt
  });

  items[index] = merged;
  saveItems(items);
  return merged;
}

async function deleteItem(itemId) {
  var token = localStorage.getItem('token');

  if (token) {
    try {
      await fetch(BASE_URL + '/api/items/' + itemId, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('[StockWise:storage] remote delete failed:', err);
    }
  }

  var items = getItems();
  var filtered = items.filter(function (it) {
    return it.id !== itemId && it._id !== itemId;
  });
  saveItems(filtered);
  return true;
}

/* ================================================================
   SALES LOG API
   ================================================================ */

function getSales() {
  return safeRead(SALES_KEY);
}

function saveSales(sales) {
  safeWrite(SALES_KEY, sales);
}

async function fetchSales() {
  var token = localStorage.getItem('token');
  if (!token) return getSales();

  try {
    var res = await fetch(BASE_URL + '/api/sales', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (res.status === 401) {
      throw { status: 401, message: 'Session expired. Please log in again.' };
    }

    if (!res.ok) {
      var errData = {};
      try { errData = await res.json(); } catch (e) {}
      throw { status: res.status, message: errData.message || ('Server error (' + res.status + ')') };
    }

    var data = await res.json();
    var normalized = Array.isArray(data) ? data.map(normalizeSale) : [];
    saveSales(normalized);
    return normalized;
  } catch (err) {
    console.error('[StockWise:storage] fetchSales error:', err);
    throw err;
  }
}

async function addSale(sale) {
  var token = localStorage.getItem('token');

  if (token) {
    var res = await fetch(BASE_URL + '/api/sales', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        itemId: sale.itemId,
        quantitySold: Number(sale.quantitySold) || 0,
        date: sale.date || todayDateString()
      })
    });

    var data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      var msg = data.message || ('Failed to log sale (' + res.status + ')');
      throw new Error(msg);
    }

    var createdSale = normalizeSale(data.sale || data);
    var sales = getSales();
    sales.unshift(createdSale);
    saveSales(sales);

    if (data.remainingStock !== undefined) {
      var items = getItems();
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === createdSale.itemId || items[i]._id === createdSale.itemId) {
          items[i].currentStock = data.remainingStock;
          break;
        }
      }
      saveItems(items);
    }

    return createdSale;
  }

  // Fallback
  var newSale = Object.assign({}, sale, {
    id: sale.id || generateSaleId(),
    date: sale.date || todayDateString()
  });

  var salesList = getSales();
  salesList.push(newSale);
  saveSales(salesList);

  var itemsList = getItems();
  for (var j = 0; j < itemsList.length; j++) {
    if (itemsList[j].id === newSale.itemId || itemsList[j]._id === newSale.itemId) {
      var curr = Number(itemsList[j].currentStock) || 0;
      var q = Number(newSale.quantitySold) || 0;
      updateItem(newSale.itemId, { currentStock: Math.max(0, curr - q) });
      break;
    }
  }

  return newSale;
}

function getSalesForItem(itemId) {
  return getSales().filter(function (sale) {
    return sale.itemId === itemId || (sale.item && (sale.item._id === itemId || sale.item.id === itemId));
  });
}

/* ================================================================
   USERS API (Compatibility Stand-in)
   ================================================================ */
function getUsers() {
  return safeRead(USERS_KEY);
}

function saveUsers(users) {
  safeWrite(USERS_KEY, users);
}

function findUserByEmail(email) {
  var users = getUsers();
  var lowerEmail = (email || '').toLowerCase();
  for (var i = 0; i < users.length; i++) {
    if ((users[i].email || '').toLowerCase() === lowerEmail) {
      return users[i];
    }
  }
  return null;
}

function addUser(user) {
  var users = getUsers();
  var newUser = Object.assign({}, user, {
    id: user.id || 'usr_' + Date.now() + '_' + randomSuffix(),
    createdAt: user.createdAt || new Date().toISOString()
  });
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/* ================================================================
   UTILITY — LOCAL DATE STRING
   ================================================================ */
function todayDateString() {
  var d = new Date();
  var yr = d.getFullYear();
  var mo = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return yr + '-' + mo + '-' + day;
}

/* ================================================================
   NAMESPACE EXPORT
   ================================================================ */
var Storage = {
  /* Items */
  getItems: getItems,
  fetchItems: fetchItems,
  saveItems: saveItems,
  addItem: addItem,
  updateItem: updateItem,
  deleteItem: deleteItem,

  /* Sales */
  getSales: getSales,
  fetchSales: fetchSales,
  saveSales: saveSales,
  addSale: addSale,
  getSalesForItem: getSalesForItem,

  /* Users */
  getUsers: getUsers,
  saveUsers: saveUsers,
  findUserByEmail: findUserByEmail,
  addUser: addUser,

  /* Utility */
  todayDateString: todayDateString
};

if (Object.freeze) Object.freeze(Storage);
