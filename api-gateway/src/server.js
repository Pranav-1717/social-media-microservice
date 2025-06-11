const express = require('express')
const proxyserver  = require('express-http-proxy')
const cors = require('cors')
const helmet = require('helmet')    
const dotenv = require('dotenv')
const logger = require('./utils/logger')
const errorHandler = require('./middlewares/errorHandler')
const redis = require('ioredis')
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const validateToken = require('./middlewares/authMiddleware');
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const redisClient = new redis(process.env.REDIS_URL)

// Middleware
app.use(express.json())
app.use(cors())
app.use(helmet())

// Rate limiting middleware
const ratelimiter = rateLimit({
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    }
});

app.use(ratelimiter);

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body: ${JSON.stringify(req.body)}`)
    next()
})

const proxyOption = {
    proxyReqPathResolver:  (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`)
        res.status(500).json({ success: false, message: 'Internal server error' })
    },
}

//setting proxy for identity service
app.use(
    "/v1/auth",
    proxyserver(process.env.IDENTITY_SERVICE_URL, {
      ...proxyOption,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(
          `Response received from Identity service: ${proxyRes.statusCode}`
        );
  
        return proxyResData;
      },
    })
  );

  //setting proxy for post service
  app.use(
    "/v1/posts",
    validateToken,
    proxyserver(process.env.POST_SERVICE_URL, {
      ...proxyOption,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
  
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(
          `Response received from Post service: ${proxyRes.statusCode}`
        );
  
        return proxyResData;
      },
    })
  );

  //setting proxy for media service
  app.use(
    "/v1/media",
    validateToken,
    proxyserver(process.env.MEDIA_SERVICE_URL, {
      ...proxyOption,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        if(!srcReq.headers['content-type'].startsWith('multipart/form-data')){
            proxyReqOpts.headers["content-type"] = "application/json";
        }
  
        return proxyReqOpts;
      },
      userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(
          `Response received from Media service: ${proxyRes.statusCode}`
        );
  
        return proxyResData;
      },
      parseReqBody:false
    })
  );

  app.use(errorHandler);



app.listen(PORT, ()=>{
    console.log('Gateway listening on port 3000')
})