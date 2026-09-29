const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// POST /api/admin/staff  (ADMIN only)
// Creates a WORKER or ADMIN account — the only way staff accounts get made,
// since public /auth/register always creates CUSTOMER accounts.
async function createStaff(req, res, next) {
  try {
    const { name, email, password, phone, role, departmentName, position } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }
    if (!['WORKER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'role must be WORKER or ADMIN' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, role },
    });

    if (role === 'WORKER' && departmentName) {
      const department = await prisma.department.upsert({
        where: { name: departmentName },
        update: {},
        create: { name: departmentName },
      });

      await prisma.staffProfile.create({
        data: {
          userId: user.id,
          departmentId: department.id,
          position: position || 'Staff',
        },
      });
    }

    const { password: _pw, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/staff  (ADMIN only) — list all staff for assigning tasks
async function getStaff(req, res, next) {
  try {
    const staff = await prisma.user.findMany({
      where: { role: 'WORKER' },
      select: {
        id: true, name: true, email: true, phone: true,
        staffProfile: { include: { department: true } },
      },
    });
    res.json(staff);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/stats  (ADMIN only) — summary numbers for the dashboard
async function getStats(req, res, next) {
  try {
    const [
      totalRooms,
      occupiedRooms,
      totalBookings,
      roomRevenue,
      serviceRevenue,
      conferenceRevenue,
      pendingTasks,
      totalCustomers,
      totalStaff,
      reviews,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: 'OCCUPIED' } }),
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { totalAmount: true } }),
      prisma.serviceBooking.aggregate({ _sum: { amount: true } }),
      prisma.conferenceBooking.aggregate({ _sum: { amount: true } }),
      prisma.task.count({ where: { status: { not: 'COMPLETED' } } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'WORKER' } }),
      prisma.review.findMany({ select: { rating: true } }),
    ]);

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // NOTE: this is total booking VALUE, not confirmed payments received —
    // the M-Pesa payment flow hasn't been built yet (Phase 2), so this
    // reflects bookings made, not cash actually collected.
    const totalBookingValue =
      Number(roomRevenue._sum.totalAmount || 0) +
      Number(serviceRevenue._sum.amount || 0) +
      Number(conferenceRevenue._sum.amount || 0);

    res.json({
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      totalBookings,
      totalBookingValue,
      pendingTasks,
      totalCustomers,
      totalStaff,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createStaff, getStaff, getStats };
