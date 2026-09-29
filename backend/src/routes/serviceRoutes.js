const express = require('express');
const router = express.Router();
const {
  getServices,
  createService,
  bookService,
  getMyServiceBookings,
  getAllServiceBookings,
  updateServiceBookingStatus,
} = require('../controllers/serviceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public
router.get('/', getServices);

// Protected — customer actions
router.post('/:id/book', verifyToken, bookService);
router.get('/bookings/me', verifyToken, getMyServiceBookings);

// Protected — staff actions
router.post('/', verifyToken, requireRole('ADMIN'), createService);
router.get('/bookings', verifyToken, requireRole('ADMIN', 'WORKER'), getAllServiceBookings);
router.patch('/bookings/:id/status', verifyToken, requireRole('ADMIN', 'WORKER'), updateServiceBookingStatus);

module.exports = router;
