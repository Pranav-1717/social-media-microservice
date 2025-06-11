const express = require('express');
const cors = require('cors');   
const helmet = require('helmet');
const dotenv = require('dotenv');
const mediaRoutes = require('./routes/media-routes');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const mongoose = require('mongoose');
const {connectRabbitMQ , consumeFromQueue} = require('./utils/rabbitmq'); // Import the RabbitMQ utility
const {handlePostDelete} = require('./handleevent/handle-media-event'); // Import the event handler

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3003;

//database connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => logger.info('MongoDB connected successfully'))
    .catch(err => logger.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Request Method: ${req.method}, Request URL: ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})

//routes
app.use('/api/media', mediaRoutes);

app.use(errorHandler);

const startserver = async () => {
    try {
        await connectRabbitMQ(); // Connect to RabbitMQ
        logger.info('Connected to RabbitMQ successfully');
        await consumeFromQueue('post.deleted',handlePostDelete); // Consume messages from the queue

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
    }
};

startserver();


process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
});