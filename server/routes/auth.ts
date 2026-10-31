import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/store';
import { hashPassword, verifyPassword } from '../db/seedData';
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

  const isMatch = verifyPassword(password, user.passwordHash);
  if (!isMatch) {
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

  // Seamlessly upgrade legacy hash to salted scrypt
  if (!user.passwordHash.startsWith('scrypt:')) {
    user.passwordHash = hashPassword(password);
    db.save();
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

  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `wj_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CONFIG.SESSION_DURATION_HOURS * 3600}${isProd ? '; Secure' : ''}`
  );

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

// Update Profile (authenticated)
router.put('/profile', authenticate, (req: Request, res: Response): void => {
  const { fullName } = req.body;
  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    res.status(400).json({ success: false, error: { message: 'Full name is required.' } });
    return;
  }
  const updated = db.updateUser(req.user!.id, {
    fullName: fullName.trim(),
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    res.status(404).json({ success: false, error: { message: 'User not found.' } });
    return;
  }
  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'PROFILE_UPDATED',
    entityType: 'USER',
    entityId: req.user!.id,
    details: `User updated profile name to "${fullName.trim()}".`,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
  });
  res.json({
    success: true,
    message: 'Profile updated successfully.',
    data: {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
    },
  });
});

// Logout (resilient: always succeeds even if session already expired/revoked)
router.post('/logout', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)wj_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
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

  res.setHeader('Set-Cookie', 'wj_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Change Password
router.post('/change-password', authenticate, (req: Request, res: Response): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'New password must be at least 8 characters long.' },
    });
    return;
  }

  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/[0-9]/.test(newPassword) ||
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'WEAK_PASSWORD',
        message: 'New password must be strong (at least 8 characters with uppercase, lowercase, number, and special character).',
      },
    });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({
      success: false,
      error: { code: 'SAME_PASSWORD', message: 'New password must be different from current password.' },
    });
    return;
  }

  const isMatch = verifyPassword(currentPassword, req.user!.passwordHash);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INCORRECT_CURRENT_PASSWORD', message: 'Current password does not match.' },
    });
    return;
  }

  const newHashed = hashPassword(newPassword);
  db.updateUser(req.user!.id, { passwordHash: newHashed, updatedAt: new Date().toISOString() });

  // Strictly revoke ALL sessions across all devices for security
  db.revokeUserSessions(req.user!.id);

  // Clear cookie session
  res.setHeader('Set-Cookie', 'wj_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'PASSWORD_CHANGED',
    entityType: 'USER',
    details: 'User updated password and revoked all active sessions across all devices.',
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
  });

  res.json({
    success: true,
    message: 'Password changed successfully. All active sessions have been revoked. Please log in with your new password.',
    requireRelogin: true,
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

router.post('/users/:id/reset-password', authenticate, requireRole(['ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (id === req.user!.id) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SELF_RESET_PROHIBITED',
        message: 'Please update your own password through the Account Profile Change Password section with current password verification.',
      },
    });
    return;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters long.' } });
    return;
  }

  const user = db.getUserById(id);
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'Staff user not found.' } });
    return;
  }

  // Super Administrator and Administrator accounts cannot be reset via the staff directory
  if (user.role === 'ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        code: 'PROTECTED_ADMIN_ACCOUNT',
        message: 'Administrator accounts cannot be reset via the staff directory. The administrator must log in and change their password with current password verification.',
      },
    });
    return;
  }

  const hashed = hashPassword(newPassword);
  db.updateUser(id, { passwordHash: hashed, updatedAt: new Date().toISOString() });
  db.revokeUserSessions(id);

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'USER_PASSWORD_RESET',
    entityType: 'USER',
    entityId: id,
    details: `Admin reset password for staff member ${user.fullName} (${user.email}) and revoked their active sessions.`,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
  });

  res.json({ success: true, message: `Password reset successfully for ${user.fullName}. All active sessions have been revoked.` });
});

// Delete Staff / Administrator User (ADMIN role required)
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), (req: Request, res: Response): void => {
  const { id } = req.params;

  // 1. Cannot self-delete
  if (id === req.user!.id) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SELF_DELETION_PROHIBITED',
        message: 'Security Violation: You cannot delete your currently authenticated account.',
      },
    });
    return;
  }

  const targetUser = db.getUserById(id);
  if (!targetUser) {
    res.status(404).json({ success: false, error: { message: 'User account not found.' } });
    return;
  }

  // 2. Cannot delete the last active Administrator
  if (targetUser.role === 'ADMIN') {
    const activeAdmins = db.getState().users.filter(u => u.role === 'ADMIN' && u.isActive);
    if (activeAdmins.length <= 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'LAST_ADMIN_PROTECTED',
          message: 'Operation Denied: Cannot delete the last remaining active Administrator in the system.',
        },
      });
      return;
    }
  }

  const deleted = db.deleteUser(id);
  if (!deleted) {
    res.status(500).json({ success: false, error: { message: 'Failed to delete user.' } });
    return;
  }

  db.addAuditLog({
    userId: req.user!.id,
    userEmail: req.user!.email,
    action: 'USER_DELETED',
    entityType: 'USER',
    entityId: id,
    details: `Administrator deleted user account "${targetUser.fullName}" (${targetUser.email}) with role ${targetUser.role}. All sessions revoked immediately.`,
    ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
  });

  res.json({
    success: true,
    message: `Account "${targetUser.fullName}" (${targetUser.email}) has been permanently deleted and all sessions revoked.`,
  });
});

export default router;
