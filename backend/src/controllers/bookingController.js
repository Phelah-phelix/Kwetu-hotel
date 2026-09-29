const prisma = require('../utils/prisma');

// Midnight today, for past-date comparisons — a same-day check-in is fine,
// yesterday is not.
function todayAtMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST /api/bookings  (login required — CUSTOMER)
async function createBooking(req, res, next) {
  try {
    const customerId = req.user.id;
    const { roomId, checkIn, checkOut, numberOfGuests } = req.body;

    if (!roomId || !checkIn || !checkOut || !numberOfGuests) {
      return res.status(400).json({ error: 'roomId, checkIn, checkOut, numberOfGuests are required' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const guests = Number(numberOfGuests);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ error: 'checkIn and checkOut must be valid dates' });
    }
    if (checkInDate < todayAtMidnight()) {
      return res.status(400).json({ error: 'checkIn cannot be in the past' });
    }
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'checkOut must be after checkIn' });
    }
    if (!guests || guests < 1) {
      return res.status(400).json({ error: 'numberOfGuests must be at least 1' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { roomType: true },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (room.status === 'MAINTENANCE') {
      return res.status(400).json({ error: 'This room is currently under maintenance' });
    }
    if (guests > room.roomType.maxOccupancy) {
      return res.status(400).json({ error: `This room type sleeps a maximum of ${room.roomType.maxOccupancy} guests` });
    }

    // Re-check for overlapping bookings right before creating —
    // prevents a double-booking race condition.
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'This room is already booked for those dates' });
    }

    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * Number(room.roomType.basePrice);

    const booking = await prisma.booking.create({
      data: {
        customerId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfGuests: guests,
        totalAmount,
        status: 'PENDING',
      },
      include: { room: { include: { roomType: true } } },
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/me  (login required)
async function getMyBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.user.id },
      include: { room: { include: { roomType: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id/cancel  (login required — CUSTOMER, own booking only)
// A customer can cancel their own booking up until check-in — after that,
// only staff can adjust it (they'd already be checked in).
async function cancelMyBooking(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.customerId !== req.user.id) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot cancel a booking that is already ${booking.status}` });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings  (ADMIN/WORKER only)
async function getAllBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        room: { include: { roomType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id/status  (ADMIN/WORKER only)
// Checking a guest in/out also updates the physical room's status, so the
// two views (bookings and room status) never drift out of sync.
async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const operations = [
      prisma.booking.update({ where: { id }, data: { status } }),
    ];

    if (status === 'CHECKED_IN') {
      operations.push(prisma.room.update({ where: { id: booking.roomId }, data: { status: 'OCCUPIED' } }));
    } else if (status === 'CHECKED_OUT') {
      // Room needs cleaning before it's bookable again — housekeeping
      // marks it AVAILABLE once done (see Room status in the Rooms tab).
      operations.push(prisma.room.update({ where: { id: booking.roomId }, data: { status: 'CLEANING' } }));
    }

    const [updatedBooking] = await prisma.$transaction(operations);
    res.json(updatedBooking);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, getMyBookings, cancelMyBooking, getAllBookings, updateBookingStatus };
