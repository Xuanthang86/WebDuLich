/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Secure Administrator Account Provisioning CLI
 * Creates or updates an Administrator account in Cloudflare D1 or local dev db
 * without storing plain text passwords or secrets in Git.
 * 
 * Usage:
 *   npx tsx scripts/bootstrap_admin.ts --email="admin@yourdomain.com" --name="Admin Name" --password="YourSecurePassword" [--remote]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

function parseArgs(): { email?: string; name?: string; password?: string; remote?: boolean; help?: boolean } {
  const args = process.argv.slice(2);
  const result: any = {};
  for (const arg of args) {
    if (arg === '--remote') result.remote = true;
    else if (arg === '--help' || arg === '-h') result.help = true;
    else if (arg.startsWith('--email=')) result.email = arg.split('=')[1];
    else if (arg.startsWith('--name=')) result.name = arg.split('=')[1];
    else if (arg.startsWith('--password=')) result.password = arg.split('=')[1];
  }
  return result;
}

function hashPasswordPBKDF2(password: string): string {
  const salt = crypto.randomBytes(16);
  const saltHex = salt.toString('hex');
  const key = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `pbkdf2:${saltHex}:${key}`;
}

async function main() {
  const { email, name, password, remote, help } = parseArgs();

  if (help || !email || !password) {
    console.log(`
Wanderer's Journeys - Secure Administrator Provisioning Tool
===========================================================
Usage:
  npx tsx scripts/bootstrap_admin.ts --email="<admin-email>" --name="<full-name>" --password="<secure-password>" [--remote]

Options:
  --email=<email>         Administrator email address (Required)
  --name=<name>           Administrator full display name (Optional, defaults to Admin)
  --password=<pass>       Secure password (at least 8 chars) (Required)
  --remote                Execute directly against Cloudflare D1 (remote production)
  --help, -h              Show this help message

Examples:
  # Local Development Database:
  npx tsx scripts/bootstrap_admin.ts --email="admin@myfirm.com" --name="System Admin" --password="MyStrongPassword123!"

  # Remote Cloudflare D1 Production:
  npx tsx scripts/bootstrap_admin.ts --remote --email="admin@myfirm.com" --name="System Admin" --password="MyStrongPassword123!"
`);
    process.exit(help ? 0 : 1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long for security compliance.');
    process.exit(1);
  }

  const fullName = name || 'Administrator';
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = hashPasswordPBKDF2(password);
  const userId = `usr_admin_${Date.now()}`;
  const now = new Date().toISOString();

  if (remote) {
    console.log(`[Provisioning Remote D1] Creating/Updating administrator: ${cleanEmail}...`);
    const sql = `
      INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES ('${userId}', '${cleanEmail}', '${passwordHash}', '${fullName.replace(/'/g, "''")}', 'ADMIN', 1, '${now}', '${now}')
      ON CONFLICT(email) DO UPDATE SET
        password_hash = '${passwordHash}',
        full_name = '${fullName.replace(/'/g, "''")}',
        role = 'ADMIN',
        is_active = 1,
        updated_at = '${now}';
    `.trim().replace(/\n/g, ' ');

    try {
      execSync(`npx wrangler d1 execute wanderers-journeys-d1 --command="${sql}" --remote`, {
        stdio: 'inherit',
      });
      console.log(`[SUCCESS] Remote Administrator account '${cleanEmail}' provisioned on Cloudflare D1.`);
    } catch (err: any) {
      console.error('[ERROR] Failed to execute remote D1 command. Ensure wrangler is logged in and DB id is set in wrangler.toml.');
      process.exit(1);
    }
  } else {
    console.log(`[Provisioning Local Dev] Updating local database store for: ${cleanEmail}...`);
    const dbDir = path.resolve(process.cwd(), 'data');
    const dbPath = path.join(dbDir, 'db.json');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    let state: any;
    if (fs.existsSync(dbPath)) {
      state = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } else {
      const seedModule = await import('../server/db/seedData');
      state = JSON.parse(JSON.stringify(seedModule.INITIAL_DATABASE_STATE));
    }

    const existingIndex = (state.users || []).findIndex((u: any) => u.email.toLowerCase() === cleanEmail);

    if (existingIndex >= 0) {
      state.users[existingIndex].passwordHash = passwordHash;
      state.users[existingIndex].fullName = fullName;
      state.users[existingIndex].role = 'ADMIN';
      state.users[existingIndex].isActive = true;
      state.users[existingIndex].updatedAt = now;
      console.log(`Updated existing user '${cleanEmail}' as Super Administrator.`);
    } else {
      state.users.unshift({
        id: userId,
        email: cleanEmail,
        passwordHash,
        fullName,
        role: 'ADMIN',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Added new Super Administrator account '${cleanEmail}'.`);
    }

    // Always clear sessions on admin credentials modification
    state.sessions = [];
    fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`[SUCCESS] Local store updated. All session tokens cleared for security.`);
  }
}

main().catch(err => {
  console.error('Fatal bootstrapping error:', err);
  process.exit(1);
});
