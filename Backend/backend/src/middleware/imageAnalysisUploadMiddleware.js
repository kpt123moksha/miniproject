const multer = require("multer");

const allowed = ["image/jpeg", "image/png", "image/webp"];

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }
    cb(null, true);
  }
}).single("photo");

module.exports = (req, res, next) => {
  uploadImage(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      return res.status(tooLarge ? 413 : 400).json({
        message: tooLarge ? "Image must be 5 MB or smaller." : error.message
      });
    }

    return res.status(400).json({ message: error.message });
  });
};
