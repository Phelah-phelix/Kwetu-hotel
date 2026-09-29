const express = require('express');
const router = express.Router();
const { getGallery, uploadGalleryImages, deleteGalleryImage } = require('../controllers/galleryController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getGallery);
router.post('/', verifyToken, requireRole('ADMIN'), upload.array('images', 10), uploadGalleryImages);
router.delete('/:id', verifyToken, requireRole('ADMIN'), deleteGalleryImage);

module.exports = router;
