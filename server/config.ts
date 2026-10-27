import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'wanderers-journeys-jwt-secret-key-2026-prod-grade',
  SESSION_DURATION_HOURS: 24,
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL || 'info@wanderersjourneys.com',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 mins
  RATE_LIMIT_MAX_SUBMISSIONS: 25, // anti-spam lead submissions per IP per window
};
