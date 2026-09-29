const prisma = require('../utils/prisma');
const { saveImage, deleteImage } = require('../services/imageProcessor');

// GET /api/rooms/types  (public)
async function getRoomTypes(req, res, next) {
  try {
    const roomTypes = await prisma.roomType.findMany({
      orderBy: { basePrice: 'asc' },
    });
    res.json(roomTypes);
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms/available?checkIn=...&checkOut=...  (public)
async function getAvailableRooms(req, res, next) {
  try {
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'checkIn and checkOut query params are required (YYYY-MM-DD)' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const rooms = await prisma.room.findMany({
      where: {
        status: { not: 'MAINTENANCE' },
        bookings: {
          none: {
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        },
      },
      include: { roomType: true },
    });

    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

// GET /api/rooms  (ADMIN/WORKER only) — every room regardless of status
async function getAllRooms(req, res, next) {
  try {
    const rooms = await prisma.room.findMany({
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms  (ADMIN/WORKER only)
async function createRoom(req, res, next) {
  try {
    const { roomNumber, floor, roomTypeId } = req.body;

    if (!roomNumber || floor === undefined || !roomTypeId) {
      return res.status(400).json({ error: 'roomNumber, floor, and roomTypeId are required' });
    }

    const room = await prisma.room.create({
      data: { roomNumber, floor, roomTypeId },
    });

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/rooms/:id/status  (ADMIN/WORKER only)
async function updateRoomStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const room = await prisma.room.update({
      where: { id },
      data: { status },
    });

    res.json(room);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────
// ROOM TYPES — full management (create/edit/delete + images)
// ─────────────────────────────────────────────

// POST /api/rooms/types  (ADMIN only)
async function createRoomType(req, res, next) {
  try {
    const { name, description, basePrice, maxOccupancy, amenities } = req.body;

    if (!name || basePrice === undefined || !maxOccupancy) {
      return res.status(400).json({ error: 'name, basePrice, and maxOccupancy are required' });
    }

    const roomType = await prisma.roomType.create({
      data: {
        name,
        description,
        basePrice,
        maxOccupancy: Number(maxOccupancy),
        amenities: amenities || [],
        images: [],
      },
    });

    res.status(201).json(roomType);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A room type with this name already exists' });
    }
    next(err);
  }
}

// PATCH /api/rooms/types/:id  (ADMIN only) — edit text/price/amenities fields.
// Images are handled separately below, since they're a different content type.
async function updateRoomType(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, basePrice, maxOccupancy, amenities } = req.body;

    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(basePrice !== undefined && { basePrice }),
        ...(maxOccupancy !== undefined && { maxOccupancy: Number(maxOccupancy) }),
        ...(amenities !== undefined && { amenities }),
      },
    });

    res.json(roomType);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Room type not found' });
    }
    next(err);
  }
}

// DELETE /api/rooms/types/:id  (ADMIN only)
async function deleteRoomType(req, res, next) {
  try {
    const { id } = req.params;

    const roomType = await prisma.roomType.findUnique({ where: { id } });
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    const roomCount = await prisma.room.count({ where: { roomTypeId: id } });
    if (roomCount > 0) {
      return res.status(409).json({ error: `Cannot delete — ${roomCount} room(s) still use this type. Remove or reassign them first.` });
    }

    // Clean up the actual image files, not just the DB record.
    await Promise.all(roomType.images.map(deleteImage));
    await prisma.roomType.delete({ where: { id } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/rooms/types/:id/images  (ADMIN only)
// multipart/form-data, field name "images", up to 10 files.
// This is what powers "add pictures" in the admin dashboard.
async function uploadRoomTypeImages(req, res, next) {
  try {
    const { id } = req.params;

    const roomType = await prisma.roomType.findUnique({ where: { id } });
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images were uploaded' });
    }

    const newUrls = await Promise.all(
      req.files.map((file) => saveImage(file.buffer, `room-types/${id}`))
    );

    const updated = await prisma.roomType.update({
      where: { id },
      data: { images: [...roomType.images, ...newUrls] },
    });

    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/rooms/types/:id/images  (ADMIN only)  body: { url }
async function deleteRoomTypeImage(req, res, next) {
  try {
    const { id } = req.params;
    const { url } = req.body;

    const roomType = await prisma.roomType.findUnique({ where: { id } });
    if (!roomType) {
      return res.status(404).json({ error: 'Room type not found' });
    }

    await deleteImage(url);

    const updated = await prisma.roomType.update({
      where: { id },
      data: { images: roomType.images.filter((img) => img !== url) },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoomTypes,
  getAvailableRooms,
  getAllRooms,
  createRoom,
  updateRoomStatus,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  uploadRoomTypeImages,
  deleteRoomTypeImage,
};
