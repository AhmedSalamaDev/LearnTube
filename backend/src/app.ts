import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/index.ts';
import * as schema from './db/schema.ts';
import { configurePassport } from './config/passport.ts';
import authRoutes from './routes/auth.routes.ts';
import courseRoutes from './routes/course.routes.ts';
import activityRoutes from './routes/activity.routes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

configurePassport();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://learntube-orcin.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to prevent blocking React app assets and inline styles/images
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/activity', activityRoutes);

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

export { app };
