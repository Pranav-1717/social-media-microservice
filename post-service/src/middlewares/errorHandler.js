const logger = require('../utils/logger');

const errorHandler = (error,req,res,next) => {
    logger.error(error.stack)

    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
      });
};

module.exports = errorHandler;