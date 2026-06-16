const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

bidSchema.index({ material: 1, amount: -1 });

module.exports = mongoose.model('Bid', bidSchema);
