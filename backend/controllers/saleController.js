const Sale = require('../models/Sale');
const Item = require('../models/Item');

// @desc    Get all sales records for the logged-in user
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user._id })
      .populate('item', 'name sku currentStock')
      .sort({ date: -1, createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Log a new sale and decrement item inventory
// @route   POST /api/sales
// @access  Private
exports.logSale = async (req, res) => {
  const { itemId, item: itemRef, quantity, quantitySold, date } = req.body;
  const targetItemId = itemId || itemRef;
  const qty = Number(quantitySold || quantity);

  try {
    if (!targetItemId) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    if (!qty || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity sold must be a positive number' });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Valid date in YYYY-MM-DD format is required' });
    }

    // Verify item ownership
    const item = await Item.findOne({ _id: targetItemId, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found in your inventory' });
    }

    // Decrement item's current stock
    item.currentStock = Math.max(0, item.currentStock - qty);
    await item.save();

    // Create the sale record
    const sale = await Sale.create({
      user: req.user._id,
      item: item._id,
      quantitySold: qty,
      date
    });

    res.status(201).json({
      sale,
      remainingStock: item.currentStock
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
