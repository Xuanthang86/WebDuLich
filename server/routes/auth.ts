import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { hashPassword } from '../db/seedData';
import { authenticate, requireRole } from '../middleware/auth';
import { CONFIG } from '../config';

const router = Router();

// Login
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Email and password are required.' },
    });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // Constant time-ish failure to prevent user enumeration
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_DEACTIVATED', message: 'This account has been deactivated. Contact an administrator.' },
    });
    return;
  }

  const hashedPassword = hashPassword(password);
  if (user.passwordHash !== hashedPassword) {
    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN_FAILED',
      entityType: 'AUTH',
      details: 'Incorrect password attempt.',
      ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
    });

    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    });
    return;
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + CONFIG.SESSION_DURATION_HOURS * 3600 * 1000).toISOString();

  db.createSession({
    id: `ses_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    token,
    userId: user.id,
    expiresAt,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
    createdAt: new Date().toISOString(),
  });

  db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    action: 'LOGIN_SUCCESS',
    entityType: 'AUTH',
    details: `User logged in successfully with role ${user.role}.`,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
  });

  res.json({
    success: true,
    data: {
      token,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    },
  });
});

// Current User Me
router.get('/me', authenticate, (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user!.id,
        email: req.user!.email,
        fullName: req.user!.fullName,
        role: req.user!.role,
      },
    },
  });
});

// Logout (resilient: always succeeds even if session already expired/revoked)
router.post('/logout', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = db.getSession(token);
    if (session) {
      const user = db.getUserById(session.userId);
      db.deleteSession(token);
      if (user) {
        db.addAuditLog({
          userId: user.id,
          userEmail: user.email,
          action: 'LOGOUT',
          entityType: 'AUTH',
          details: 'User logged out.',
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        });
      }
    }
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Change Password
router.post('/change-password', authenticate, (req: Request, res: Response): void => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'New password must be at least 8 characters.' },
    });
    return;
  }

  const currentHashed = hashPassword(currentPassword);
  if (req.user!.passwordHash !== currentHashed) {
    res.status(400).json({
      success: false,
      error: { code: 'INCORRECT_CURRENT_PASSWORD', message: 'Current password does not match.' },
    });
    return;
  }

  const newHashed = hashPassword(newPassword);
  db.updateUser(req.user!.id, { passwordHash: newHashed });

  // Revoke other sessions for security
  db.revokeUserSessions(req.user!.id);

  // Issue new session for current device
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + CONFIG.SESSION_DURATION_HOURS * 3600 * 1000).toISOString();
  db.createSession({
    id: `ses_${Date.now()}`,
    token,
    userId: req.user!.id,
    expiresAt,
    createdAt: new Date().toISOString(),
  });

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'PASSWORD_CHANGED',
    entityType: 'USER',
    details: 'User updated password and revoked previous sessions.',
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: 'Password changed successfully.',
    data: { token, expiresAt },
  });
});

// User Management (Admin only)
router.get('/users', authenticate, requireRole(['ADMIN']), (req: Request, res: Response): void => {
  const users = db.getState().users.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  }));
  res.json({ success: true, data: users });
});

router.post('/users', authenticate, requireRole(['ADMIN']), (req: Request, res: Response): void => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName || !role) {
    res.status(400).json({ success: false, error: { message: 'All fields are required.' } });
    return;
  }

  if (db.getUserByEmail(email)) {
    res.status(400).json({ success: false, error: { message: 'Email already exists.' } });
    return;
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    passwordHash: hashPassword(password),
    fullName,
    role,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getState().users.push(newUser);
  db.save();

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'USER_CREATED',
    entityType: 'USER',
    entityId: newUser.id,
    details: `Created new user ${email} with role ${role}.`,
  });

  res.json({
    success: true,
    data: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      isActive: newUser.isActive,
    },
  });
});

router.put('/users/:id/status', authenticate, requireRole(['ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (id === req.user!.id) {
    res.status(400).json({ success: false, error: { message: 'Cannot deactivate your own account.' } });
    return;
  }

  const user = db.updateUser(id, { isActive: Boolean(isActive) });
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found.' } });
    return;
  }

  if (!isActive) {
    db.revokeUserSessions(id);
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    entityType: 'USER',
    entityId: id,
    details: `Account ${user.email} status set to ${isActive ? 'active' : 'inactive'}.`,
  });

  res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
});

export default router;
