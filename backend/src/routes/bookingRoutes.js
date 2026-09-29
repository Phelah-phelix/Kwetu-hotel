const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelMyBooking,
  getAllBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/', verifyToken, createBooking);
router.get('/me', verifyToken, getMyBookings);
router.patch('/:id/cancel', verifyToken, cancelMyBooking);
router.get('/', verifyToken, requireRole('ADMIN', 'WORKER'), getAllBookings);
router.patch('/:id/status', verifyToken, requireRole('ADMIN', 'WORKER'), updateBookingStatus);

module.exports = router;
