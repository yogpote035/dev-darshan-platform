const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { getRequiredSecret, getAllowedOrigins, normalizeOrigin } = require('./src/config/security');

// Configs and Middlewares
const swaggerSpec = require('./src/config/swagger');
const { loadSettings } = require('./src/middlewares/settingsMiddleware');
const { startSubscriptionCron } = require('./src/services/subscriptionCron');

// Route definitions
const adminRoutes = require('./src/routes/admin');
const apiRoutes = require('./src/routes/api');
const webhookRoutes = require('./src/routes/api/webhookRoutes');

const app = express();
const sendMissingImageResponse = (res, status = 404) => {
  const message = 'This image does not exist.';

  return res.status(status).type('html').send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Image Not Found</title>
        <style>
          :root {
            --bg: #0b0b0d;
            --panel: rgba(24, 24, 27, 0.9);
            --border: rgba(255, 191, 94, 0.24);
            --gold: #fbbf24;
            --gold-soft: rgba(251, 191, 36, 0.14);
            --text: #f4f4f5;
            --muted: #a1a1aa;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: radial-gradient(circle at top, rgba(251, 191, 36, 0.12), transparent 30%), var(--bg);
            color: var(--text);
            font-family: Arial, Helvetica, sans-serif;
          }
          .card {
            width: min(92vw, 420px);
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 28px 24px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
          }
          .badge {
            display: inline-block;
            padding: 6px 10px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--gold);
            background: var(--gold-soft);
            border: 1px solid var(--border);
            border-radius: 999px;
            margin-bottom: 18px;
          }
          h1 {
            margin: 0 0 10px;
            font-size: 28px;
            line-height: 1.2;
          }
          p {
            margin: 0;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Image unavailable</div>
          <h1>${message}</h1>
          <p>The QR code or uploaded image was not found.</p>
        </div>
      </body>
    </html>
  `);
};

app.set('trust proxy', 1); // Trust first proxy (Nginx SSL termination)

// ==========================
// SECURITY & SPEED MIDDLEWARES
// ==========================
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP temporarily so embedded iframes (YouTube) load fine in admin/client
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// CORS Configuration
const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204,
  maxAge: 86400
};
app.use(cors(corsOptions));
app.use(compression());
// Razorpay requires the exact raw payload for webhook signature verification.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request Rate Limiter (Prevent API flooding)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500, // Limit each IP to 500 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again later.'
});

// ==========================
// TEMPLATE ENGINE & STATIC FILES
// ==========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Serve static assets (EJS styles, scripts, and file uploads)
app.use(express.static(path.join(__dirname, 'src', 'public')));

// ==========================
// GLOBAL CONFIGS MIDDLEWARE
// ==========================
app.use(loadSettings);

// ==========================
// ROUTE MOUNTING
// ==========================

// Swagger UI Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// REST APIs
app.use('/api', apiLimiter, apiRoutes);

// Admin EJS Panel
app.use('/admin/login', adminLoginLimiter);
app.use('/admin', adminRoutes);

// Root Redirect
app.get('/', (req, res) => {
  res.redirect('/admin/login');
});

// ==========================
// CRON JOBS
// ==========================
if (process.env.NODE_ENV !== 'test') {
  startSubscriptionCron();
}

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/uploads/')) {
    return sendMissingImageResponse(res, 404);
  }

  const err = new Error('Resource Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }

  if (req.originalUrl.startsWith('/uploads/')) {
    return sendMissingImageResponse(res, status);
  }

  // Render EJS error page for EJS views
  res.status(status).render('login', {
    error: `Error ${status}: ${err.message || 'Internal Server Error'}`
  });
});

module.exports = app;
