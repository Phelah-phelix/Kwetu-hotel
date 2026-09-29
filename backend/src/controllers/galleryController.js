const prisma = require('../utils/prisma');
const { saveImage, deleteImage } = require('../services/imageProcessor');

const VALID_CATEGORIES = ['EXTERIOR', 'ROOM', 'SPA', 'GYM', 'POOL', 'CONFERENCE', 'DINING', 'GROUNDS'];

// GET /api/gallery  (public) — optional ?category=SPA filter
async function getGallery(req, res, next) {
  try {
    const { category } = req.query;
    const images = await prisma.galleryImage.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(images);
  } catch (err) {
    next(err);
  }
}

// POST /api/gallery  (ADMIN only)
// multipart/form-data — field "images" (files) + field "category" (one value applied to all files in this batch)
async function uploadGalleryImages(req, res, next) {
  try {
    const { category, caption } = req.body;

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images were uploaded' });
    }

    const created = await Promise.all(
      req.files.map(async (file) => {
        const url = await saveImage(file.buffer, 'gallery');
        return prisma.galleryImage.create({ data: { url, category, caption: caption || null } });
      })
    );

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/gallery/:id  (ADMIN only)
async function deleteGalleryImage(req, res, next) {
  try {
    const { id } = req.params;
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    await deleteImage(image.url);
    await prisma.galleryImage.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getGallery, uploadGalleryImages, deleteGalleryImage };
