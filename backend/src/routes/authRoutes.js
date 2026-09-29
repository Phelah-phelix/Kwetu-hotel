const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// POST /api/auth/register  → create a new customer account
router.post('/register', register);

// POST /api/auth/login     → log in, get back a JWT
router.post('/login', login);

module.exports = router;
