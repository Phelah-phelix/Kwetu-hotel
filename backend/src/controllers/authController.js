const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// Turns a user's DB record + JWT secret into a signed token string.
// We only put id, role, and email inside the token — never the password.
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Strips the password out before sending a user object back to the client.
function toSafeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// POST /api/auth/register
// Public registration always creates a CUSTOMER account.
// Staff/Admin accounts are created separately by an admin (not here) —
// we never let the public sign themselves up as a worker or admin.
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // 10 = "salt rounds" — how many times bcrypt scrambles the password.
    // Higher = more secure but slower. 10 is the standard trade-off.
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'CUSTOMER',
      },
    });

    const token = generateToken(user);

    res.status(201).json({ token, user: toSafeUser(user) });
  } catch (err) {
    next(err); // passed to errorHandler.js
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Same error for "no user" and "wrong password" —
      // never reveal whether the email exists, that helps attackers.
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.status(200).json({ token, user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
