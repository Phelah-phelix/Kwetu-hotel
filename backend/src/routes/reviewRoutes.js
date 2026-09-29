const express = require('express');
const router = express.Router();
const { createReview, getReviews, respondToReview } = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', getReviews);
router.post('/', verifyToken, createReview);
router.patch('/:id/respond', verifyToken, requireRole('ADMIN'), respondToReview);

module.exports = router;
