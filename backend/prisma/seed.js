const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const standard = await prisma.roomType.upsert({
    where: { name: 'Standard' }, update: {},
    create: {
      name: 'Standard',
      description: 'Comfortable room with garden view, ideal for solo travelers or couples.',
      basePrice: 4500.00, maxOccupancy: 2,
      amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Hot Shower'],
    },
  });

  const deluxe = await prisma.roomType.upsert({
    where: { name: 'Deluxe' }, update: {},
    create: {
      name: 'Deluxe',
      description: 'Spacious room with a balcony overlooking the pool.',
      basePrice: 8000.00, maxOccupancy: 3,
      amenities: ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Mini Fridge', 'Balcony'],
    },
  });

  const suite = await prisma.roomType.upsert({
    where: { name: 'Suite' }, update: {},
    create: {
      name: 'Suite',
      description: 'Luxury suite with separate living area, perfect for families or executives.',
      basePrice: 15000.00, maxOccupancy: 4,
      amenities: ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Mini Bar', 'Living Area', 'Jacuzzi'],
    },
  });

  const roomsToCreate = [
    { roomNumber: '101', floor: 1, roomTypeId: standard.id },
    { roomNumber: '102', floor: 1, roomTypeId: standard.id },
    { roomNumber: '103', floor: 1, roomTypeId: standard.id },
    { roomNumber: '201', floor: 2, roomTypeId: deluxe.id },
    { roomNumber: '202', floor: 2, roomTypeId: deluxe.id },
    { roomNumber: '301', floor: 3, roomTypeId: suite.id },
  ];

  for (const room of roomsToCreate) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber }, update: {}, create: room,
    });
  }

  // ── Services: Spa, Gym, Pool, National Park Tour ──
  const services = [
    { name: 'Swedish Massage', category: 'SPA', description: 'Full body relaxation massage.', price: 3500, durationMins: 60 },
    { name: 'Facial Treatment', category: 'SPA', description: 'Deep cleansing facial with organic products.', price: 2500, durationMins: 45 },
    { name: 'Gym Day Pass', category: 'GYM', description: 'Full access to gym equipment for the day.', price: 800, durationMins: null },
    { name: 'Personal Training Session', category: 'GYM', description: 'One-on-one session with a certified trainer.', price: 2000, durationMins: 60 },
    { name: 'Pool Day Pass', category: 'POOL', description: 'Full day access to the swimming pool.', price: 1000, durationMins: null },
    { name: 'Ruma National Park Day Tour', category: 'PARK_TOUR', description: 'Guided day tour of Ruma National Park with transport.', price: 6000, durationMins: 480 },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
    }
  }

  // ── Conference room ──
  await prisma.conferenceRoom.upsert({
    where: { name: 'Homabay Conference Hall' }, update: {},
    create: {
      name: 'Homabay Conference Hall',
      capacity: 100,
      hourlyRate: 5000.00,
      equipment: ['Projector', 'Sound System', 'Whiteboard', 'Wi-Fi'],
    },
  });

  console.log('Seed complete: room types, rooms, services, and conference room created.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
