import { Request, Response, NextFunction } from 'express';
import { db } from '../db/store';
import { User, UserRole } from '../db/schema';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)wj_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token or session cookie required.',
      },
    });
    return;
  }

  const session = db.getSession(token);

  if (!session) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_SESSION',
        message: 'Session has expired or was revoked. Please log in again.',
      },
    });
    return;
  }

  const user = db.getUserById(session.userId);
  if (!user || !user.isActive) {
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'This user account is deactivated.',
      },
    });
    return;
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      db.addAuditLog({
        userId: req.user.id,
        userEmail: req.user.email,
        action: 'ACCESS_DENIED_RBAC',
        entityType: 'ENDPOINT',
        details: `Role ${req.user.role} attempted to access restricted endpoint: ${req.method} ${req.originalUrl}`,
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient privileges for this operation.',
        },
      });
      return;
    }

    next();
  };
}
