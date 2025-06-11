const express = require('express');
const mongoose = require('mongoose');   
const cors = require('cors');
const postRoutes = require('./routes/post-routes');
const dotenv = require('dotenv');   
const helmet = require('helmet');
const redis = require('ioredis');
const { error } = require('winston');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler'); // Import the error handler middleware
const PORT = process.env.PORT || 3002; // Set the port from environment variables or default to 3001
const redisClient = new redis(process.env.REDIS_URL); // Connect to Redis using the URL from environment variables
const {connectRabbitMQ} = require('./utils/rabbitmq'); // Import the RabbitMQ utility


const app = express();
dotenv.config(); // Load environment variables from .env file


//database connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS for all routes
app.use(helmet()); // Set security-related HTTP headers 

app.use((req,res,next)=>{
    logger.info(`Recived ${req.method} request to ${req.url}`);
    logger.info(`Request body , ${req.body}`)
    next();
})


//routes
app.use('/api/posts', (req , res , next)=>{
    req.redisClient = redisClient; // Attach the Redis client to the request object
    next(); // Call the next middleware or route handler    
},
 postRoutes); // Mount post routes at /api/posts

app.use(errorHandler); // Use the error handler middleware


const startServer = async () => {
    try {
        await connectRabbitMQ(); // Connect to RabbitMQ
        logger.info('Connected to RabbitMQ successfully');
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Error connecting to RabbitMQ:', error);
        process.exit(1); // Exit the process if RabbitMQ connection fails
    }
}

startServer(); // Start the server

//unhandled promise rejection

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});
