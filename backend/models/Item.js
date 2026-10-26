const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    name: {
      type: String,
      required: [true, 'Please provide an item name'],
      trim: true
    },
    sku: {
      type: String,
      required: [true, 'Please provide a SKU'],
      trim: true
    },
    currentStock: {
      type: Number,
      required: [true, 'Please provide starting stock'],
      min: [0, 'Starting stock cannot be negative'],
      default: 0
    },
    leadTimeDays: {
      type: Number,
      required: [true, 'Please provide lead time in days'],
      min: [0, 'Lead time cannot be negative'],
      default: 0
    },
    safetyStock: {
      type: Number,
      required: [true, 'Please provide safety stock'],
      min: [0, 'Safety stock cannot be negative'],
      default: 0
    },
    reorderQty: {
      type: Number,
      min: [0, 'Reorder quantity cannot be negative'],
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure uniqueness of SKU per user
itemSchema.index({ user: 1, sku: 1 }, { unique: true });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
