import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Connect to Database
connectDB();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = [
  'https://ai-hackathon-task.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://localhost:4173',
];
if (config.clientUrl && !allowedOrigins.includes(config.clientUrl)) {
  allowedOrigins.push(config.clientUrl);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, postman, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      /^http:\/\/localhost:\d+$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }
    // Fallback: reflect origin to prevent CORS blocking for preview deployments
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Version', 'Origin', 'Accept'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Database connection middleware ensures DB connection is established for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err.message);
    next(err);
  }
});

// Rate limiting (Global)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'development' ? 10000 : 1000, // relaxed limit for full-stack usage
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1', routes);

// Base route for health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'AI Clinic Management API is running' });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Clinic Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
