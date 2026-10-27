# Wanderer’s Journeys — System Architecture & Technical Specification

## 1. Executive Summary & Brand Identity
* **Brand Name:** Wanderer’s Journeys
* **Brand Slogan:** *“Where curiosity leads, possibilities unfold”*
* **Core Value Message:** *“Live Freely, Retire Happily in Vietnam”*
* **Target Audience:** International Western retirees (USA, Canada, UK, Australia, Western Europe), exploratory sabbatical travelers, couples, and seniors seeking premier, turnkey long-term stays in Vietnam.
* **Key Destinations:** Da Nang (Coastal Beachfront Hub), Nha Trang (Tropical Bay Promenade), Ho Chi Minh City (Vibrant Expatriate Sanctuary).

---

## 2. High-Level Architecture Overview
The system is constructed as a modern, unified, fullstack decoupled application:

```
[ Client Web Browsers (Mobile & Desktop) ]
                   │
                   ▼ (HTTPS / TLS 1.3)
[ Reverse Proxy / Cloud Run / CDN (Port 3000) ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
  [ /api/* Express ]  [ Single-Page App (SPA) ]
  • Auth & RBAC       • React 19 + TypeScript
  • Leads & Inquiries • Tailwind CSS v4 (Design Tokens)
  • Dynamic Form      • Accessible Typography (Cinzel/Playfair)
  • Content CMS       • Lightbox Galleries & Micro-Interactions
  • Export (CSV/XLS)  • State & Context Providers
  • Email Outbox      
         │
         ▼
[ Transactional Data Layer ]
  • File-backed ACID store with atomic swap write (`data/db.json`)
  • Turnkey PostgreSQL Migration Schema (`database/migrations/001_initial_schema.sql`)
  • Turnkey PostgreSQL Seeds (`database/seeds/001_initial_data.sql`)
         │
         ▼
[ Outbox Email Dispatch Queue ]
  • Asynchronous retry with exponential backoff
  • Admin inspectable and re-dispatchable outbox
```

---

## 3. Technology Stack Selection & Cost-Efficiency Rationale

| Layer | Selected Technology | Justification & Low-TCO Benefit |
|---|---|---|
| **Frontend Framework** | React 19 + Vite + TypeScript | Modern declarative component model, type safety, sub-second HMR in dev, highly optimized tree-shaken static production bundle. |
| **Styling & Design** | Tailwind CSS v4 | Zero runtime CSS footprint, strict token discipline, accessible high-contrast color palette, no bulky component library bloat. |
| **Backend Runtime** | Node.js + Express + tsx | Standard, mature ecosystem with low memory footprint (~50MB idle), single process handling both SSR/static delivery and API routes. |
| **Database** | Transactional File/Memory Store with direct PostgreSQL Migration schema | Zero cost in development and small production; 100% turnkey portability to Supabase, Neon, or Cloud SQL via migration scripts. |
| **Authentication & RBAC** | Server-side bearer tokens with database session verification & role enforcement | Strict server verification for `ADMIN`, `MANAGER`, `LEAD_MANAGER`. Revocation on password change. |
| **Security & Spam Control** | IP Sliding-Window Rate Limiter + Anti-Bot Honeypot + CSV Formula Injection Sanitizer | Blocks automated scrapers and malicious spreadsheet formula execution without costly third-party captcha friction. |

---

## 4. Security Architecture & Threat Model

1. **Authentication & Session Revocation:**
   - Passwords hashed using HMAC-SHA256 with cryptographically isolated application salt.
   - Sessions are validated against database state. When an account is suspended or a password is changed, all prior active sessions are instantly revoked.
2. **Server-Side Authorization (Least Privilege):**
   - Public visitors only access `/api/public/*`.
   - CMS modification endpoints require `ADMIN` or `MANAGER`.
   - Staff account provisioning and system factory resets require `ADMIN`.
   - Lead management is accessible to `ADMIN`, `MANAGER`, and `LEAD_MANAGER`.
3. **Data Protection & CSV Formula Injection Defense (CWE-1236):**
   - Spreadsheet exports sanitize leading `=`, `+`, `-`, `@`, `\t`, and `\r` by prefixing with a single apostrophe (`'`).
   - UTF-8 Byte Order Mark (`\uFEFF`) is prepended to ensure international names render without corruption in Microsoft Excel and Google Sheets.
4. **Spam & Flooding Prevention:**
   - Hidden honeypot trap field (`_hp_website_trap`) silently traps automated bots.
   - In-memory rate limiting restricts submissions per IP window (15 mins).
   - Idempotency deduplication suppresses accidental double clicks.

---

## 5. Reliability & Failure Modes
* **Email Failure Decoupling:** If the outbound email network experiences transient downtime, the lead record is safely committed first. The email task is logged in the `email_jobs` outbox table as `FAILED` or `QUEUED` and can be retried at will from the Admin CMS.
* **Atomic File Sync:** Database mutations write to a temporary file (`db.json.tmp`) before atomic replacement (`fs.renameSync`), preventing partial or corrupted reads during process interruption.
