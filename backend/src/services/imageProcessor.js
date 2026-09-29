const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Where uploaded files actually live on disk. Anything under here is
// served publicly at /uploads/... (wired up in app.js).
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

// Takes a raw uploaded image buffer, converts it to a web-friendly WebP,
// resizes it down if it's larger than needed, and saves it under
// uploads/<subfolder>/. Returns the public URL path to store in the DB.
async function saveImage(buffer, subfolder) {
  const dir = path.join(UPLOAD_ROOT, subfolder);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${crypto.randomUUID()}.webp`;
  const filepath = path.join(dir, filename);

  await sharp(buffer)
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(filepath);

  return `/uploads/${subfolder}/${filename}`;
}

// Deletes a previously-saved image given its public URL path
// (e.g. "/uploads/room-types/abc/xyz.webp"). Safe to call even if the
// file is already gone — we don't want a missing file to break the API.
async function deleteImage(publicUrl) {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  const filepath = path.join(UPLOAD_ROOT, publicUrl.replace('/uploads/', ''));
  try {
    await fs.unlink(filepath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not delete image file:', err);
  }
}

module.exports = { saveImage, deleteImage };
