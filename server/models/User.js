/**
 * User Model
 * Represents both Buyers (manufacturers/startups) and Sellers (waste-producing industries)
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer',
    },
    companyName: {
      type: String,
      trim: true,
    },
    industryType: {
      type: String,
      enum: [
        'Manufacturing', 'Construction', 'Agriculture', 'Chemical',
        'Textile', 'Food & Beverage', 'Automotive', 'Electronics',
        'Pharmaceutical', 'Mining', 'Paper & Pulp', 'Other',
      ],
    },
    location: {
      address: { type: String },
      city:    { type: String },
      state:   { type: String },
      country: { type: String, default: 'India' },
      lat:     { type: Number },
      lng:     { type: Number },
    },
    avatar: {
      type: String,
      default: '',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    phone: {
      type: String,
    },
    website: {
      type: String,
    },
    // Aggregated carbon stats (updated on transaction completion)
    carbonStats: {
      totalSaved: { type: Number, default: 0 }, // kg CO2
      totalTransactions: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ── Hash password before saving ───────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Compare password method ───────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Remove sensitive fields from JSON output ──
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
