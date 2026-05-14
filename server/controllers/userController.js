/**
 * User Controller
 * Profile management and dashboard data
 */

const User        = require('../models/User');
const Material    = require('../models/Material');
const Transaction = require('../models/Transaction');
const { cloudinary } = require('../middleware/upload');

/**
 * GET /api/users/profile
 * Get current user's profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/users/update
 * Update current user's profile
 */
const updateProfile = async (req, res) => {
  try {
    const allowed = [
      'name', 'companyName', 'industryType', 'location',
      'bio', 'phone', 'website',
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Handle avatar upload if provided
    if (req.file) {
      // Delete old avatar from Cloudinary if it exists
      if (req.user.avatar) {
        const splitUrl = req.user.avatar.split('/');
        const publicId = splitUrl[splitUrl.length - 2] + '/' + splitUrl[splitUrl.length - 1].split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }
      updates.avatar = req.file.path;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/users/dashboard
 * Aggregated dashboard statistics for the current user
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;

    let stats = {};

    if (role === 'seller') {
      const [listings, transactions] = await Promise.all([
        Material.find({ seller: userId }),
        Transaction.find({ seller: userId })
          .populate('material', 'title category')
          .populate('buyer', 'name companyName')
          .sort('-createdAt')
          .limit(10),
      ]);

      const activeListings  = listings.filter((l) => l.status === 'active').length;
      const soldListings    = listings.filter((l) => l.status === 'sold').length;
      const totalViews      = listings.reduce((sum, l) => sum + l.views, 0);
      const pendingDeals    = transactions.filter((t) => t.status === 'pending').length;
      const completedDeals  = transactions.filter((t) => t.status === 'completed').length;
      const totalCarbonSaved = transactions
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.carbonSaved || 0), 0);

      stats = {
        listings: { total: listings.length, active: activeListings, sold: soldListings, totalViews },
        deals:    { pending: pendingDeals, completed: completedDeals },
        carbon:   { totalSaved: totalCarbonSaved },
        recentTransactions: transactions,
      };
    } else {
      const transactions = await Transaction.find({ buyer: userId })
        .populate('material', 'title category images price')
        .populate('seller', 'name companyName verified')
        .sort('-createdAt')
        .limit(10);

      const pendingDeals   = transactions.filter((t) => t.status === 'pending').length;
      const completedDeals = transactions.filter((t) => t.status === 'completed').length;
      const totalCarbonSaved = transactions
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + (t.carbonSaved || 0), 0);

      stats = {
        deals:  { total: transactions.length, pending: pendingDeals, completed: completedDeals },
        carbon: { totalSaved: totalCarbonSaved },
        recentTransactions: transactions,
      };
    }

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/users/carbon
 * Detailed carbon impact data for the Carbon Dashboard page
 */
const getCarbonDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const field  = req.user.role === 'seller' ? 'seller' : 'buyer';

    const transactions = await Transaction.find({ [field]: userId, status: 'completed' })
      .populate('material', 'category')
      .sort('createdAt');

    // Group by category
    const byCategory = {};
    // Group by month
    const byMonth = {};

    let totalCarbonSaved = 0;

    transactions.forEach((t) => {
      const cat   = t.material?.category || 'Other';
      const month = t.completedAt
        ? new Date(t.completedAt).toISOString().slice(0, 7)
        : new Date(t.createdAt).toISOString().slice(0, 7);

      byCategory[cat]   = (byCategory[cat]   || 0) + (t.carbonSaved || 0);
      byMonth[month]    = (byMonth[month]     || 0) + (t.carbonSaved || 0);
      totalCarbonSaved += (t.carbonSaved || 0);
    });

    const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
    const monthlyData  = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, carbonSaved]) => ({ month, carbonSaved }));

    res.json({
      totalCarbonSaved,
      totalTransactions: transactions.length,
      categoryData,
      monthlyData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/users — Admin: get all users
 */
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PATCH /api/users/:id/verify — Admin: toggle user verification
 */
const toggleVerify = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.verified = !user.verified;
    await user.save();
    res.json({ message: `User ${user.verified ? 'verified' : 'unverified'}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile, getDashboard, getCarbonDashboard, getAllUsers, toggleVerify };
