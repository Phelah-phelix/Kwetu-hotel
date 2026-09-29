// A single, shared Prisma Client instance.
// Why: creating `new PrismaClient()` in every file would open a new
// database connection pool each time — this file makes sure the whole
// app reuses ONE connection pool.

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
