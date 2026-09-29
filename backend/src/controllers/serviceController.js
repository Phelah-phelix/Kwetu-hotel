const prisma = require('../utils/prisma');

// GET /api/services  (public) — optional ?category=SPA filter
async function getServices(req, res, next) {
  try {
    const { category } = req.query;
    const services = await prisma.service.findMany({
      where: category ? { category } : undefined,
      orderBy: { price: 'asc' },
    });
    res.json(services);
  } catch (err) {
    next(err);
  }
}

// POST /api/services  (ADMIN only)
async function createService(req, res, next) {
  try {
    const { name, category, description, price, durationMins } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: 'name, category, and price are required' });
    }
    const service = await prisma.service.create({
      data: { name, category, description, price, durationMins },
    });
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

// POST /api/services/:id/book  (login required — CUSTOMER)
async function bookService(req, res, next) {
  try {
    const customerId = req.user.id;
    const { id: serviceId } = req.params;
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({ error: 'date and timeSlot are required' });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        customerId,
        serviceId,
        date: new Date(date),
        timeSlot,
        amount: service.price,
        status: 'PENDING',
      },
      include: { service: true },
    });

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

// GET /api/services/bookings/me  (login required)
async function getMyServiceBookings(req, res, next) {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      where: { customerId: req.user.id },
      include: { service: true },
      orderBy: { date: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

// GET /api/services/bookings  (ADMIN/WORKER only)
async function getAllServiceBookings(req, res, next) {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        service: true,
      },
      orderBy: { date: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/services/bookings/:id/status  (ADMIN/WORKER only)
async function updateServiceBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }
    const booking = await prisma.serviceBooking.update({ where: { id }, data: { status } });
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getServices,
  createService,
  bookService,
  getMyServiceBookings,
  getAllServiceBookings,
  updateServiceBookingStatus,
};
