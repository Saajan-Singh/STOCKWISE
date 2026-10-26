const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Item reference is required'],
      ref: 'Item'
    },
    quantitySold: {
      type: Number,
      required: [true, 'Quantity sold is required'],
      min: [1, 'Quantity must be at least 1']
    },
    date: {
      type: String,
      required: [true, 'Sale date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD']
    }
  },
  {
    timestamps: true
  }
);

// Index for fast querying by user and date
saleSchema.index({ user: 1, date: -1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
