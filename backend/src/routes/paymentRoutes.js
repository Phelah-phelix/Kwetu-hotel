const express = require('express');
const router = express.Router();
const { initiatePayment, mpesaCallback, getPaymentStatus } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.post('/stk', verifyToken, initiatePayment);
router.post('/callback/:secret', mpesaCallback); // public: Safaricom calls this
router.get('/:id', verifyToken, getPaymentStatus);

module.exports = router;
