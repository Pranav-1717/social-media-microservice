const logger = require('../utils/logger');

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if(!userId) {
        logger.error("User ID not found in request header");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = { userId };
    logger.info(`User authenticated with ID: ${userId}`);
    next();
}

module.exports = authenticateRequest;