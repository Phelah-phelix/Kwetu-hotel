const express = require('express');
const router = express.Router();
const {
  getConferenceRooms,
  createConferenceRoom,
  bookConferenceRoom,
  getMyConferenceBookings,
  getAllConferenceBookings,
} = require('../controllers/conferenceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public
router.get('/', getConferenceRooms);

// Protected — customer actions
router.post('/:id/book', verifyToken, bookConferenceRoom);
router.get('/bookings/me', verifyToken, getMyConferenceBookings);

// Protected — staff actions
router.post('/', verifyToken, requireRole('ADMIN'), createConferenceRoom);
router.get('/bookings', verifyToken, requireRole('ADMIN', 'WORKER'), getAllConferenceBookings);

module.exports = router;
