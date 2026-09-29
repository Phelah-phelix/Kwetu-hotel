const express = require('express');
const router = express.Router();
const {
  getRoomTypes,
  getAvailableRooms,
  getAllRooms,
  createRoom,
  updateRoomStatus,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  uploadRoomTypeImages,
  deleteRoomTypeImage,
} = require('../controllers/roomController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public — anyone can browse room types and check availability
router.get('/types', getRoomTypes);
router.get('/available', getAvailableRooms);

// Protected — room type management (ADMIN only)
router.post('/types', verifyToken, requireRole('ADMIN'), createRoomType);
router.patch('/types/:id', verifyToken, requireRole('ADMIN'), updateRoomType);
router.delete('/types/:id', verifyToken, requireRole('ADMIN'), deleteRoomType);
router.post('/types/:id/images', verifyToken, requireRole('ADMIN'), upload.array('images', 10), uploadRoomTypeImages);
router.delete('/types/:id/images', verifyToken, requireRole('ADMIN'), deleteRoomTypeImage);

// Protected — physical room management (ADMIN/WORKER)
router.get('/', verifyToken, requireRole('ADMIN', 'WORKER'), getAllRooms);
router.post('/', verifyToken, requireRole('ADMIN', 'WORKER'), createRoom);
router.patch('/:id/status', verifyToken, requireRole('ADMIN', 'WORKER'), updateRoomStatus);

module.exports = router;
