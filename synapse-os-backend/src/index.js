require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const inboxRoutes = require('./routes/inbox');
const meetingRoutes = require('./routes/meetings');
const driveRoutes = require('./routes/drive');
const whatsappRoutes = require('./routes/whatsapp');
const reportRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const webhookRoutes = require('./routes/webhooks');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
].filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0
    ? Array.from(new Set(configuredOrigins))
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit browser preflight checks.
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Synapse OS API',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(errorHandler);

app.listen(PORT);

module.exports = app;
