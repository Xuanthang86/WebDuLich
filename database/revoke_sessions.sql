-- ====================================================================
-- Wanderer's Journeys - Emergency Session Revocation Script
-- Purpose: Instantly revoke all active sessions across all devices
-- Run with: npx wrangler d1 execute wanderers-journeys-d1 --file=./database/revoke_sessions.sql --remote
-- ====================================================================

-- 1. Purge all active and expired sessions
DELETE FROM sessions;

-- 2. Invalidate any pending password reset tokens
DELETE FROM password_reset_tokens;

-- 3. Audit log the revocation event
INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, details, created_at)
VALUES (
    'aud_revocation_' || hex(randomblob(6)),
    'SYSTEM',
    'security@xuanthang.io.vn',
    'SESSIONS_MASS_REVOKED',
    'SECURITY',
    'All active user sessions and tokens have been revoked by administrator.',
    datetime('now')
);
