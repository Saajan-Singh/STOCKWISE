const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Paths to files
const root = path.join('B:', 'Class', 'Sem 5', 'BE', 'Project');
const storageJs = fs.readFileSync(path.join(root, 'reorder-tool', 'js', 'storage.js'), 'utf8');
const forecastJs = fs.readFileSync(path.join(root, 'dashboard', 'js', 'forecast.js'), 'utf8');
const itemsJs = fs.readFileSync(path.join(root, 'dashboard', 'js', 'items.js'), 'utf8');
const salesJs = fs.readFileSync(path.join(root, 'dashboard', 'js', 'sales.js'), 'utf8');

// Setup a mock DOM and localStorage environment
const mockWindow = {
  localStorage: {
    store: {},
    getItem: function(k) { return this.store[k] || null; },
    setItem: function(k, v) { this.store[k] = v; },
    removeItem: function(k) { delete this.store[k]; },
    clear: function() { this.store = {}; }
  }
};

const sandbox = {
  window: mockWindow,
  localStorage: mockWindow.localStorage,
  console: console,
  Math: Math,
  Date: Date,
  Number: Number,
  String: String,
  Object: Object,
  isNaN: isNaN
};
vm.createContext(sandbox);

// Load the modules into the sandbox
vm.runInContext(storageJs, sandbox);
vm.runInContext(forecastJs, sandbox);
vm.runInContext(itemsJs, sandbox);
vm.runInContext(salesJs, sandbox);

// Clear localStorage to simulate fresh session
sandbox.localStorage.clear();

console.log('--- RUNNING LOGIC TEST ---');

// 1. Add Items
const item1 = sandbox.Items.createItem({
  name: 'Organic Coffee Beans',
  sku: 'COF-ORG-01',
  currentStock: 100,
  leadTimeDays: 7,
  safetyStock: 20,
  reorderQty: 50
});
console.log('Add Item 1:', item1.ok);

const item2 = sandbox.Items.createItem({
  name: 'Oat Milk',
  sku: 'MLK-OAT-12',
  currentStock: 30,
  leadTimeDays: 5,
  safetyStock: 15,
  reorderQty: 40
});
console.log('Add Item 2:', item2.ok);

const item3 = sandbox.Items.createItem({
  name: 'Paper Filters',
  sku: 'ACC-FLT-100',
  currentStock: 200,
  leadTimeDays: 3,
  safetyStock: 10,
  reorderQty: 100
});
console.log('Add Item 3:', item3.ok);

const allItems = sandbox.Storage.getItems();
console.log('Total Items:', allItems.length);

// 2. Log Sales for Item 1
const itemId = item1.item.id;
const date = sandbox.Storage.todayDateString();
console.log('Log Sale 1:', sandbox.Sales.logSale(itemId, 15, date).ok);
console.log('Log Sale 2:', sandbox.Sales.logSale(itemId, 10, date).ok);
console.log('Log Sale 3:', sandbox.Sales.logSale(itemId, 8, date).ok);

// 3. Verify status updates via Forecast
const updatedItems = sandbox.Storage.getItems();
const coffeeBean = updatedItems.find(i => i.id === itemId);
console.log('Coffee Beans Current Stock:', coffeeBean.currentStock);

const sales = sandbox.Storage.getSalesForItem(itemId);
console.log('Coffee Beans Sales Count:', sales.length);

const avgDemand = sandbox.Forecast.movingAverageDemand(sales, 14);
console.log('Coffee Beans Avg Demand (window=14):', avgDemand.toFixed(2));

const rop = sandbox.Forecast.reorderPoint(avgDemand, coffeeBean.leadTimeDays, coffeeBean.safetyStock);
console.log('Coffee Beans ROP:', rop.toFixed(2));

const status = sandbox.Forecast.getStockStatus(coffeeBean.currentStock, rop);
console.log('Coffee Beans Status:', status);

// 4. Verify other items (Insufficient Data)
const oatMilk = updatedItems.find(i => i.id === item2.item.id);
const oatMilkSales = sandbox.Storage.getSalesForItem(item2.item.id);
console.log('Oat Milk Sales Count:', oatMilkSales.length);
// Status checking logic for insufficient data is in dashboard.js, but we can verify sales length < 3
console.log('Oat Milk has insufficient data:', oatMilkSales.length < 3);

console.log('--- TEST COMPLETE ---');
