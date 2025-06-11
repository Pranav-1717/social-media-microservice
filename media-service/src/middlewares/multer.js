const logger = require('../utils/logger');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 10 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
        if (!allowedTypes.includes(file.mimetype)) {
            logger.error("Invalid file type");
            return cb(new Error('Invalid file type'), false);
        }
        cb(null, true);
    }
}).single('file');

const uploadMediaMiddleware = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          logger.error("Multer error while uploading:", err);
          return res.status(400).json({
            message: "Multer error while uploading:",
            error: err.message,
            stack: err.stack,
          });
        } else if (err) {
          logger.error("Unknown error occured while uploading:", err);
          return res.status(500).json({
            message: "Unknown error occured while uploading:",
            error: err.message,
            stack: err.stack,
          });
        }
  
        if (!req.file) {
          return res.status(400).json({
            message: "No file found!",
          });
        }
  
        next();
      });
}

module.exports = { uploadMediaMiddleware };

