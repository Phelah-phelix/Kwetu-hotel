const prisma = require('../utils/prisma');

// POST /api/reviews  (login required — CUSTOMER)
async function createReview(req, res, next) {
  try {
    const customerId = req.user.id;
    const { category, rating, comment } = req.body;

    if (!category || !rating) {
      return res.status(400).json({ error: 'category and rating are required' });
    }

    const validCategories = ['ROOM', 'SPA', 'SERVICE', 'CONFERENCE', 'OVERALL'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
    }

    const ratingNum = Number(rating);
    if (ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const review = await prisma.review.create({
      data: { customerId, category, rating: ratingNum, comment },
      include: { customer: { select: { id: true, name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

// GET /api/reviews  (public — the website's reviews section)
async function getReviews(req, res, next) {
  try {
    const { category } = req.query;

    const reviews = await prisma.review.findMany({
      where: category ? { category } : undefined,
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, averageRating: Math.round(avgRating * 10) / 10, totalReviews: reviews.length });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/reviews/:id/respond  (ADMIN only — reply to a review)
async function respondToReview(req, res, next) {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;

    if (!adminResponse) {
      return res.status(400).json({ error: 'adminResponse is required' });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { adminResponse },
    });

    res.json(review);
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getReviews, respondToReview };
