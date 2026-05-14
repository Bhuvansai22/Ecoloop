const express = require('express');
const router  = express.Router();
const {
  createMaterial, getMaterials, getMaterialById,
  updateMaterial, deleteMaterial, getMatches, getMyMaterials,
  placeBid, getBids,
} = require('../controllers/materialController');
const { protect, authorize } = require('../middleware/auth');
const { uploadMaterial } = require('../middleware/upload');

// Public routes
// GET  /api/materials
router.get('/', getMaterials);

// Authenticated routes
router.use(protect);

// GET  /api/materials/matches  — must come before /:id
router.get('/matches', getMatches);

// GET  /api/materials/my      — seller's own listings
router.get('/my', getMyMaterials);

// GET  /api/materials/:id
router.get('/:id', getMaterialById);

// POST /api/materials          (Sellers only)
router.post('/', authorize('seller', 'admin'), uploadMaterial, createMaterial);

// PUT  /api/materials/:id
router.put('/:id', authorize('seller', 'admin'), uploadMaterial, updateMaterial);

// DELETE /api/materials/:id
router.delete('/:id', deleteMaterial);

// Bidding routes
router.post('/:id/bid', placeBid);
router.get('/:id/bids', getBids);

module.exports = router;
