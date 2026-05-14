/**
 * Transaction Model
 * Represents a deal between a Buyer and Seller for a Material
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    message: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    // Quantity requested by the buyer (may differ from full listing qty)
    quantity: {
      value: { type: Number, required: true },
      unit:  { type: String, default: 'tonnes' },
    },
    // Carbon impact calculated at creation
    carbonSaved: {
      type: Number, // kg CO2
      default: 0,
    },
    // Price agreed upon (may differ from listing price after negotiation)
    agreedPrice: {
      type: Number,
      default: 0,
    },
    // Seller response message
    sellerNote: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ buyer: 1, status: 1 });
transactionSchema.index({ seller: 1, status: 1 });
transactionSchema.index({ material: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
