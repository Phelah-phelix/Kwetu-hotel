// Express recognizes this as an error handler because it takes 4 arguments.
// Any route that calls next(err) — or throws inside an async wrapper —
// ends up here, so error responses are consistent across the whole API.
function errorHandler(err, req, res, next) {
  console.error(err); // full error logged server-side for debugging

  // Multer's own errors (file too large, too many files) come through
  // without a statusCode — treat them as bad requests, not server errors.
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }
  // Our upload middleware's fileFilter also throws a plain Error for
  // disallowed file types — same treatment.
  if (err.message && err.message.includes('Only JPEG, PNG, or WEBP')) {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong on our end';

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
