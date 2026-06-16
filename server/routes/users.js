const express = require('express');
const router  = express.Router();
const {
  getProfile, updateProfile, getDashboard,
  getCarbonDashboard, getAllUsers, toggleVerify,
  submitCarbonAssessment,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');

// All routes below require authentication
router.use(protect);

// GET  /api/users/profile
router.get('/profile', getProfile);

// PUT  /api/users/update  (with optional avatar upload)
router.put('/update', uploadAvatar, updateProfile);

// GET  /api/users/dashboard
router.get('/dashboard', getDashboard);

// GET  /api/users/carbon
router.get('/carbon', getCarbonDashboard);

// POST /api/users/carbon-assessment
router.post('/carbon-assessment', submitCarbonAssessment);

// Admin only routes
// GET    /api/users
router.get('/', authorize('admin'), getAllUsers);

// PATCH  /api/users/:id/verify
router.patch('/:id/verify', authorize('admin'), toggleVerify);

module.exports = router;
