/**
 * Material Model
 * Represents waste material listings posted by Sellers
 */

const mongoose = require('mongoose');

// Carbon factor (kg CO2 saved per tonne of material reused)
// Used by carbonCalc utility
const CATEGORIES = [
  'Metal Scrap', 'Plastics', 'Paper & Cardboard', 'Glass',
  'Organic Waste', 'Textiles', 'Chemical Waste', 'Electronic Waste',
  'Wood & Timber', 'Rubber', 'Concrete & Construction', 'Other',
];

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: CATEGORIES,
    },
    quantity: {
      value: { type: Number, required: true, min: 0.01 },
      unit:  {
        type: String,
        enum: ['kg', 'tonnes', 'litres', 'units', 'cubic metres'],
        default: 'tonnes',
      },
    },
    price: {
      amount:   { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
      negotiable: { type: Boolean, default: true },
    },
    images: [
      {
        url:       { type: String, required: true },
        publicId:  { type: String },
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // GeoJSON Point for geospatial queries
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
      address: String,
      city:    String,
      state:   String,
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'paused', 'pending_review'],
      default: 'active',
    },
    tags: [{ type: String, lowercase: true }],
    // Carbon estimator: pre-computed factor in kg CO2/tonne
    carbonFactor: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    isAuction: {
      type: Boolean,
      default: false,
    },
    auctionDetails: {
      startingPrice: { type: Number, min: 0 },
      currentHighestBid: { type: Number, min: 0, default: 0 },
      endTime: { type: Date },
      winningBid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
      },
    },
  },
  { timestamps: true }
);

// ── Geospatial index ──────────────────────────
materialSchema.index({ location: '2dsphere' });
materialSchema.index({ category: 1, status: 1 });
materialSchema.index({ seller: 1 });

module.exports = mongoose.model('Material', materialSchema);
module.exports.CATEGORIES = CATEGORIES;
