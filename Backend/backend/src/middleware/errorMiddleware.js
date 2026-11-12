function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.code === "23505") {
    return res.status(409).json({ message: "This value already exists." });
  }
  if (error.code === "23503" || error.code === "23514") {
    return res.status(400).json({ message: "The submitted data does not satisfy a database rule." });
  }
  res.status(error.status || 500).json({
    message: error.message || "Internal server error."
  });
}

module.exports = { notFound, errorHandler };
