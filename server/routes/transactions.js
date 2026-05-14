const express = require('express');
const router  = express.Router();
const {
  createTransaction, getTransactions,
  updateTransactionStatus, getTransactionById,
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// All transaction routes require authentication
router.use(protect);

// POST /api/transactions         (Buyers only)
router.post('/', authorize('buyer', 'admin'), createTransaction);

// GET  /api/transactions
router.get('/', getTransactions);

// GET  /api/transactions/:id
router.get('/:id', getTransactionById);

// PATCH /api/transactions/:id/status
router.patch('/:id/status', updateTransactionStatus);

module.exports = router;
