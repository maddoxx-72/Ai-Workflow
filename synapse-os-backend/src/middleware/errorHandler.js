/**
 * Global error handler middleware
 * Catches all errors thrown in routes and returns a clean JSON response
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
