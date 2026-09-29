const express = require('express');
const router = express.Router();
const { createStaff, getStaff, getStats } = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Every route here requires an ADMIN token.
router.use(verifyToken, requireRole('ADMIN'));

router.post('/staff', createStaff);
router.get('/staff', getStaff);
router.get('/stats', getStats);

module.exports = router;
