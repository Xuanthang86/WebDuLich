import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';

// In-memory sliding window rate limiter
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimitLeadSubmission(req: Request, res: Response, next: NextFunction): void {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = ipRequestCounts.get(ip);
  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }

  if (record.count >= CONFIG.RATE_LIMIT_MAX_SUBMISSIONS) {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many submissions detected from your connection. Please wait a few moments before trying again.',
      },
    });
    return;
  }

  record.count += 1;
  next();
}

// Honeypot anti-bot validation
export function verifyHoneypot(req: Request, res: Response, next: NextFunction): void {
  const honeypot = req.body?._hp_website_trap;
  if (honeypot && String(honeypot).trim() !== '') {
    // Silently reject or simulate success to trap malicious scrapers
    res.status(200).json({
      success: true,
      data: {
        leadCode: `WJ-${new Date().getFullYear()}-SPAM`,
        message: 'Thank you for reaching out. A specialist will be in touch shortly.',
      },
    });
    return;
  }
  next();
}

/**
 * Sanitizes spreadsheet inputs to prevent CSV/Excel Formula Injection (CWE-1236)
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  let str = String(value).trim();
  // If value begins with =, +, -, @, or tab/CR which spreadsheet apps execute
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
