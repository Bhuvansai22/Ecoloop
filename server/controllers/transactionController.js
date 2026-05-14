/**
 * Transaction Controller
 * Handles deal requests between buyers and sellers
 */

const Transaction = require('../models/Transaction');
const Material    = require('../models/Material');
const User        = require('../models/User');
const { calculateCarbonSaved } = require('../utils/carbonCalc');

/**
 * POST /api/transactions
 * Buyer requests a deal on a material
 */
const createTransaction = async (req, res) => {
  try {
    const { materialId, quantity, unit, message } = req.body;

    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    if (material.status !== 'active') {
      return res.status(400).json({ message: 'This material is no longer available' });
    }

    // Buyers cannot buy their own materials
    if (material.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot buy your own listing' });
    }

    // Calculate carbon savings
    const carbonSaved = calculateCarbonSaved(
      material.category,
      Number(quantity) || material.quantity.value,
      unit || material.quantity.unit
    );

    const transaction = await Transaction.create({
      buyer:    req.user._id,
      seller:   material.seller,
      material: materialId,
      status:   'pending',
      message,
      quantity: { value: Number(quantity) || material.quantity.value, unit: unit || material.quantity.unit },
      carbonSaved,
      agreedPrice: material.price.amount,
    });

    await transaction.populate([
      { path: 'material', select: 'title category images price' },
      { path: 'seller',   select: 'name companyName email' },
      { path: 'buyer',    select: 'name companyName email' },
    ]);

    res.status(201).json({ message: 'Deal request sent!', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/transactions
 * Get transactions for current user (buyer or seller view)
 */
const getTransactions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, role } = req.query;

    // Allow viewing as buyer or seller (both if no role specified)
    const userId = req.user._id;
    let query = {};

    if (role === 'buyer') {
      query.buyer = userId;
    } else if (role === 'seller') {
      query.seller = userId;
    } else {
      query.$or = [{ buyer: userId }, { seller: userId }];
    }

    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('material', 'title category images price quantity')
      .populate('buyer',    'name companyName email avatar verified')
      .populate('seller',   'name companyName email avatar verified')
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PATCH /api/transactions/:id/status
 * Seller updates deal status (accept / reject / complete)
 */
const updateTransactionStatus = async (req, res) => {
  try {
    const { status, sellerNote } = req.body;
    const validTransitions = ['accepted', 'rejected', 'completed', 'cancelled'];

    if (!validTransitions.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Only seller can accept/reject; both parties can cancel
    const isSeller = transaction.seller.toString() === req.user._id.toString();
    const isBuyer  = transaction.buyer.toString()  === req.user._id.toString();

    if (['accepted', 'rejected', 'completed'].includes(status) && !isSeller) {
      return res.status(403).json({ message: 'Only the seller can perform this action' });
    }
    if (status === 'cancelled' && !isBuyer && !isSeller) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    transaction.status = status;
    if (sellerNote) transaction.sellerNote = sellerNote;

    // Mark material as sold when transaction completes
    if (status === 'completed') {
      transaction.completedAt = new Date();
      await Material.findByIdAndUpdate(transaction.material, { status: 'sold' });

      // Update carbon stats on both user profiles
      await User.findByIdAndUpdate(transaction.seller, {
        $inc: {
          'carbonStats.totalSaved':        transaction.carbonSaved,
          'carbonStats.totalTransactions': 1,
        },
      });
      await User.findByIdAndUpdate(transaction.buyer, {
        $inc: {
          'carbonStats.totalSaved':        transaction.carbonSaved,
          'carbonStats.totalTransactions': 1,
        },
      });
    }

    await transaction.save();
    await transaction.populate([
      { path: 'material', select: 'title category images' },
      { path: 'buyer',    select: 'name companyName' },
      { path: 'seller',   select: 'name companyName' },
    ]);

    res.json({ message: `Transaction ${status}`, transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/transactions/:id
 * Get a single transaction
 */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('material', 'title category images price quantity location')
      .populate('buyer',    'name companyName email avatar phone')
      .populate('seller',   'name companyName email avatar phone');

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    const isParty =
      transaction.buyer._id.toString()  === req.user._id.toString() ||
      transaction.seller._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTransaction, getTransactions,
  updateTransactionStatus, getTransactionById,
};
