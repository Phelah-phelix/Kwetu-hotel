const prisma = require('../utils/prisma');

// GET /api/conference-rooms  (public)
async function getConferenceRooms(req, res, next) {
  try {
    const rooms = await prisma.conferenceRoom.findMany({ orderBy: { hourlyRate: 'asc' } });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

// POST /api/conference-rooms  (ADMIN only)
async function createConferenceRoom(req, res, next) {
  try {
    const { name, capacity, hourlyRate, equipment } = req.body;
    if (!name || !capacity || hourlyRate === undefined) {
      return res.status(400).json({ error: 'name, capacity, and hourlyRate are required' });
    }
    const room = await prisma.conferenceRoom.create({
      data: { name, capacity, hourlyRate, equipment: equipment || [] },
    });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

// POST /api/conference-rooms/:id/book  (login required — CUSTOMER)
async function bookConferenceRoom(req, res, next) {
  try {
    const customerId = req.user.id;
    const { id: conferenceRoomId } = req.params;
    const { date, startTime, endTime, purpose, attendees } = req.body;

    if (!date || !startTime || !endTime || !attendees) {
      return res.status(400).json({ error: 'date, startTime, endTime, attendees are required' });
    }

    const room = await prisma.conferenceRoom.findUnique({ where: { id: conferenceRoomId } });
    if (!room) {
      return res.status(404).json({ error: 'Conference room not found' });
    }

    if (Number(attendees) > room.capacity) {
      return res.status(400).json({ error: `This room's max capacity is ${room.capacity}` });
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    // Check for overlapping bookings on the same room/date.
    const conflict = await prisma.conferenceBooking.findFirst({
      where: {
        conferenceRoomId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'This conference room is already booked for that time slot' });
    }

    const hours = (end - start) / (1000 * 60 * 60);
    const amount = hours * Number(room.hourlyRate);

    const booking = await prisma.conferenceBooking.create({
      data: {
        customerId,
        conferenceRoomId,
        date: new Date(date),
        startTime: start,
        endTime: end,
        purpose,
        attendees: Number(attendees),
        amount,
      },
      include: { conferenceRoom: true },
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

// GET /api/conference-rooms/bookings/me  (login required)
async function getMyConferenceBookings(req, res, next) {
  try {
    const bookings = await prisma.conferenceBooking.findMany({
      where: { customerId: req.user.id },
      include: { conferenceRoom: true },
      orderBy: { date: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

// GET /api/conference-rooms/bookings  (ADMIN/WORKER only)
async function getAllConferenceBookings(req, res, next) {
  try {
    const bookings = await prisma.conferenceBooking.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        conferenceRoom: true,
      },
      orderBy: { date: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getConferenceRooms,
  createConferenceRoom,
  bookConferenceRoom,
  getMyConferenceBookings,
  getAllConferenceBookings,
};
