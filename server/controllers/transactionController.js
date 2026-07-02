/**
 * Transaction Controller
 * Handles deal requests between buyers and sellers
 */

const Transaction = require('../models/Transaction');
const Material    = require('../models/Material');
const User        = require('../models/User');
const { calculateCarbonSaved } = require('../utils/carbonCalc');

const convertToKg = (value, unit) => {
  const val = Number(value) || 0;
  switch (unit) {
    case 'kg':           return val;
    case 'tonnes':       return val * 1000;
    case 'litres':       return val; // 1L ≈ 1kg
    case 'units':        return val * 10;   // 1 unit ≈ 10kg
    case 'cubic metres': return val * 800;  // 1 m³ ≈ 800kg
    default:             return val;
  }
};

const convertFromKg = (valueInKg, targetUnit) => {
  const val = Number(valueInKg) || 0;
  switch (targetUnit) {
    case 'kg':           return val;
    case 'tonnes':       return val / 1000;
    case 'litres':       return val;
    case 'units':        return val / 10;
    case 'cubic metres': return val / 800;
    default:             return val;
  }
};

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

    // Requested quantity cannot exceed listing quantity
    const reqQty = Number(quantity) || material.quantity.value;
    if (reqQty > material.quantity.value) {
      return res.status(400).json({
        message: `Requested quantity (${reqQty} ${unit || material.quantity.unit}) cannot exceed listing quantity of ${material.quantity.value} ${material.quantity.unit}`
      });
    }

    // Calculate carbon savings
    const carbonSaved = calculateCarbonSaved(
      material.category,
      Number(quantity) || material.quantity.value,
      unit || material.quantity.unit,
      material.carbonFactor
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

    // Notify seller in real-time that a new deal request arrived
    const io = req.app.get('io');
    if (io) {
      io.to(transaction.seller.toString()).emit('transactionUpdated', {
        type: 'new_request',
        transaction,
      });
    }

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

    const isTransitioningToCompleted = (status === 'completed' && transaction.status !== 'completed');

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

    let matTitle = 'Material';

    // Mark material as sold (or decrement quantity) when transaction completes
    if (status === 'completed') {
      transaction.completedAt = new Date();
      const material = await Material.findById(transaction.material);
      if (material) {
        matTitle = material.title;
        if (isTransitioningToCompleted) {
          const materialQtyKg = convertToKg(material.quantity.value, material.quantity.unit);
          const txQtyKg = convertToKg(transaction.quantity.value, transaction.quantity.unit);
          const remainingKg = Math.max(0, materialQtyKg - txQtyKg);

          if (remainingKg > 0.01) {
            material.quantity.value = convertFromKg(remainingKg, material.quantity.unit);
            material.status = 'active';
          } else {
            material.quantity.value = 0;
            material.status = 'sold';
          }
          await material.save();
        }
      }
    }

    // Reject other pending/accepted requests that can no longer be fulfilled
    if (status === 'accepted' || status === 'completed') {
      const material = await Material.findById(transaction.material);
      if (material) {
        const io = req.app.get('io');
        const materialQtyKg = convertToKg(material.quantity.value, material.quantity.unit);
        
        // Sum of all other accepted transactions (excluding the current one)
        const otherAcceptedTxs = await Transaction.find({
          material: material._id,
          status: 'accepted',
          _id: { $ne: transaction._id }
        });
        
        let acceptedQtyKg = 0;
        for (const tx of otherAcceptedTxs) {
          acceptedQtyKg += convertToKg(tx.quantity.value, tx.quantity.unit);
        }
        
        // Calculate uncommitted quantity
        let uncommittedKg = materialQtyKg - acceptedQtyKg;
        // If the current transaction is being accepted, it becomes committed too.
        if (status === 'accepted') {
          const currentTxQtyKg = convertToKg(transaction.quantity.value, transaction.quantity.unit);
          uncommittedKg = Math.max(0, uncommittedKg - currentTxQtyKg);
        }
        
        // Find other pending transactions for this material
        const pendingTxs = await Transaction.find({
          material: material._id,
          status: 'pending',
          _id: { $ne: transaction._id }
        });
        
        for (const pendingTx of pendingTxs) {
          const pendingQtyKg = convertToKg(pendingTx.quantity.value, pendingTx.quantity.unit);
          if (pendingQtyKg > uncommittedKg) {
            pendingTx.status = 'rejected';
            pendingTx.sellerNote = 'This listing no longer has enough quantity to fulfill this request.';
            await pendingTx.save();
            
            // Notify buyer in real-time
            if (io) {
              io.to(pendingTx.buyer.toString()).emit('transactionUpdated', {
                type: 'status_change',
                status: 'rejected',
                transaction: pendingTx
              });
            }
          }
        }
        
        // Also reject already accepted transactions if they can no longer be fulfilled
        if (status === 'completed') {
          for (const acceptedTx of otherAcceptedTxs) {
            const acceptedQtyKg = convertToKg(acceptedTx.quantity.value, acceptedTx.quantity.unit);
            if (acceptedQtyKg > materialQtyKg) {
              acceptedTx.status = 'rejected';
              acceptedTx.sellerNote = 'This listing no longer has enough quantity to fulfill this request.';
              await acceptedTx.save();
              
              if (io) {
                io.to(acceptedTx.buyer.toString()).emit('transactionUpdated', {
                  type: 'status_change',
                  status: 'rejected',
                  transaction: acceptedTx
                });
              }
            }
          }
        }
      }
    }

    if (status === 'completed') {
      // Update seller profile
      const sellerUser = await User.findById(transaction.seller);
      if (sellerUser) {
        sellerUser.carbonStats.totalSaved += transaction.carbonSaved;
        sellerUser.carbonStats.totalTransactions += 1;
        sellerUser.ecoPoints += 100;
        sellerUser.materialsReused += 1;
        sellerUser.sustainabilityScore = Math.min(100, sellerUser.sustainabilityScore + 15);
        sellerUser.activities.push({
          type: 'Exchanged Material',
          description: `Listed & completed trade of ${matTitle}`,
          points: 100,
        });

        // Badge promotions
        const currentBadges = sellerUser.badges || [];
        if (sellerUser.ecoPoints >= 500 && !currentBadges.includes('Sustainability Champion')) {
          sellerUser.badges.push('Sustainability Champion');
        }
        if (sellerUser.ecoPoints >= 200 && !currentBadges.includes('Green Advocate')) {
          sellerUser.badges.push('Green Advocate');
        }
        await sellerUser.save();
      }

      // Update buyer profile
      const buyerUser = await User.findById(transaction.buyer);
      if (buyerUser) {
        buyerUser.carbonStats.totalSaved += transaction.carbonSaved;
        buyerUser.carbonStats.totalTransactions += 1;
        buyerUser.ecoPoints += 100;
        buyerUser.materialsReused += 1;
        buyerUser.sustainabilityScore = Math.min(100, buyerUser.sustainabilityScore + 15);
        buyerUser.activities.push({
          type: 'Exchanged Material',
          description: `Acquired & reused ${matTitle}`,
          points: 100,
        });

        // Badge promotions
        const currentBadges = buyerUser.badges || [];
        if (buyerUser.ecoPoints >= 500 && !currentBadges.includes('Sustainability Champion')) {
          buyerUser.badges.push('Sustainability Champion');
        }
        if (buyerUser.ecoPoints >= 200 && !currentBadges.includes('Green Advocate')) {
          buyerUser.badges.push('Green Advocate');
        }
        await buyerUser.save();
      }
    }

    await transaction.save();
    await transaction.populate([
      { path: 'material', select: 'title category images' },
      { path: 'buyer',    select: 'name companyName' },
      { path: 'seller',   select: 'name companyName' },
    ]);

    // Notify both buyer and seller in their personal rooms
    const io = req.app.get('io');
    if (io) {
      const payload = { type: 'status_change', status, transaction };
      io.to(transaction.buyer._id.toString()).emit('transactionUpdated', payload);
      io.to(transaction.seller._id.toString()).emit('transactionUpdated', payload);
    }

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
