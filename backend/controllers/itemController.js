const Item = require('../models/Item');
const Sale = require('../models/Sale');

// @desc    Get all items for the logged-in user
// @route   GET /api/items
// @access  Private
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Private
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new inventory item
// @route   POST /api/items
// @access  Private
exports.createItem = async (req, res) => {
  const { name, sku, currentStock, leadTimeDays, safetyStock, reorderQty } = req.body;

  try {
    if (!name || !sku) {
      return res.status(400).json({ message: 'Item name and SKU are required' });
    }

    const existingItem = await Item.findOne({ user: req.user._id, sku });
    if (existingItem) {
      return res.status(400).json({ message: 'An item with this SKU already exists' });
    }

    const item = await Item.create({
      user: req.user._id,
      name: name.trim(),
      sku: sku.trim(),
      currentStock: Number(currentStock) || 0,
      leadTimeDays: Number(leadTimeDays) || 0,
      safetyStock: Number(safetyStock) || 0,
      reorderQty: Number(reorderQty) || 0
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an item
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { name, sku, currentStock, leadTimeDays, safetyStock, reorderQty } = req.body;

    if (sku && sku !== item.sku) {
      const existingSku = await Item.findOne({ user: req.user._id, sku });
      if (existingSku) {
        return res.status(400).json({ message: 'An item with this SKU already exists' });
      }
      item.sku = sku.trim();
    }

    if (name !== undefined) item.name = name.trim();
    if (currentStock !== undefined) item.currentStock = Number(currentStock);
    if (leadTimeDays !== undefined) item.leadTimeDays = Number(leadTimeDays);
    if (safetyStock !== undefined) item.safetyStock = Number(safetyStock);
    if (reorderQty !== undefined) item.reorderQty = Number(reorderQty);

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an item and its associated sales records
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Clean up sales history for this item
    await Sale.deleteMany({ item: req.params.id, user: req.user._id });

    res.json({ message: 'Item and associated sales records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
