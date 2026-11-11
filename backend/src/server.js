const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const os = require('os');

dotenv.config();

const app = express();

// Trust reverse proxy headers (Render/Vercel TLS termination & client IP rate limiting)
app.set('trust proxy', 1);

const DEFAULT_ALLOWED_ORIGINS = [
  'https://mini-project-1-z0mo.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const buildCorsOptions = () => {
  const configuredOrigins = [process.env.FRONTEND_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedSet = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);
  const allowAll = configuredOrigins.includes('*') || process.env.ALLOW_ALL_ORIGINS === 'true';

  return {
    origin: (origin, callback) => {
      if (!origin || allowAll) {
        return callback(null, true);
      }
      const normalized = origin.trim().replace(/\/+$/, '');
      if (allowedSet.has(normalized)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
};

// Middleware
app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check (used by Render)
app.get('/healthz', (req, res) => res.status(200).send('ok'));

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : isServerless
    ? path.join(os.tmpdir(), 'civicconnect-uploads')
    : path.join(__dirname, '../uploads');

const uploadStaticOptions = {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
};

// Static folder for uploads
app.use('/uploads', express.static(uploadDir, uploadStaticOptions));
if (isServerless || process.env.UPLOAD_DIR) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), uploadStaticOptions));
}

// Routes
const authRoutes = require('./routes/authRoutes');
const issueRoutes = require('./routes/issueRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const departmentsRoutes = require('./routes/departmentsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/departments', departmentsRoutes);

// Serve the built React frontend unless running in standalone backend-only mode.
const frontendDist = path.join(__dirname, '../../frontend/dist');
const serveFrontend =
  process.env.BACKEND_ONLY !== 'true' &&
  process.env.SERVE_FRONTEND !== 'false' &&
  fs.existsSync(path.join(frontendDist, 'index.html'));

if (serveFrontend) {
  app.use(express.static(frontendDist));

  // SPA fallback so React Router URLs work on refresh
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'CivicConnect Backend API',
      health: '/healthz'
    });
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message && err.message.includes('not allowed by CORS')) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;