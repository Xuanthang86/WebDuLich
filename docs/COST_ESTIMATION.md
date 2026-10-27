# Wanderer’s Journeys — Infrastructure Cost Model & Provider Verification

## 1. Operating Cost Principles
The system follows a strict **Low Total Cost of Ownership (Low-TCO)** architecture:
1. **No Unapproved Paid Subscriptions:** System is engineered to operate on robust, generous free tiers during initial launch and steady state.
2. **Turnkey Portability:** Code and data are never locked into proprietary cloud traps; migrations to self-hosted Docker, VPS, or alternate serverless providers require zero application refactoring.
3. **Mandatory Domain Expense:** The only non-negotiable expense is the custom top-level domain (e.g. `wanderersjourneys.com`).

---

## 2. Infrastructure Comparison & Free-Tier Quota Audit

| Provider & Resource | Free Tier Limits (Current Active Policy) | Suitable For | Scale Transition Threshold |
|---|---|---|---|
| **Static / Serverless Hosting** (Cloudflare Pages / Vercel) | • Unlimited requests on Cloudflare Pages<br>• 100GB bandwidth on Vercel | Frontend SPA & Edge static distribution | >100,000 monthly unique visitors |
| **Compute / API Backend** (Cloud Run / Render) | • Cloud Run: 2 million requests/month free, 360,000 vCPU-seconds, 180GB-hours memory | Express API proxy, lead ingestion, CMS | >2,000,000 API requests/month |
| **Relational Database** (PostgreSQL on Neon / Supabase) | • Neon: 0.5 GB storage, serverless scale-to-zero<br>• Supabase: 500 MB database, 50,000 monthly active users | Structured schema, relational indexes, leads | >50,000 leads with full history |
| **Media / Object Storage** (Cloudflare R2 / Supabase Storage) | • Cloudflare R2: 10 GB storage free, 1 million Class A ops, zero egress bandwidth fees | Residence photo gallery, floorplans | >10,000 high-res photos |
| **Transactional Email API** (Resend / Brevo / Postmark) | • Brevo: 300 emails/day free (~9,000/mo)<br>• Resend: 3,000 emails/month free | Immediate lead notifications & confirmations | >3,000 inquiries/month |
| **Custom Domain** (Namecheap / Cloudflare Registrar) | • ~$10.00 - $14.00 / year for `.com` | Brand authority & deliverability | Fixed annual expense |

---

## 3. Projected Cost Scenarios (Monthly & Annualized)

### Scenario A: Launch & Early Exploration (0 - 5,000 monthly visitors, 10 - 50 monthly leads)
* **Hosting & Compute:** $0.00 / month (within free limits)
* **Database & Storage:** $0.00 / month (file store or Neon free tier)
* **Transactional Email:** $0.00 / month (within 3,000 free quota)
* **Custom Domain:** $1.00 / month (amortized ~$12/year)
* **Total Estimated Cost:** **$1.00 / month (~$12.00 / year)**

### Scenario B: Steady Growth & Active Seasonal Campaigns (5,000 - 35,000 monthly visitors, 100 - 300 monthly leads)
* **Hosting & Compute:** $0.00 / month (Cloudflare Pages + Cloud Run free tier)
* **Database & Storage:** $0.00 / month (under 100MB data)
* **Transactional Email:** $0.00 / month (under 1,000 emails dispatched)
* **Custom Domain:** $1.00 / month
* **Total Estimated Cost:** **$1.00 / month (~$12.00 / year)**

### Scenario C: High Scale & International Multi-Hub Expansion (>100,000 visitors, 1,000+ monthly leads)
* **Hosting & Compute:** ~$15.00 - $20.00 / month (Cloud Run scaled compute)
* **Managed PostgreSQL:** ~$15.00 - $25.00 / month (Neon / Supabase Pro with daily automated point-in-time recovery)
* **Object Storage (R2):** ~$1.00 - $3.00 / month (100GB+ catalog images)
* **Dedicated Email Deliverability:** ~$10.00 / month (dedicated IP and volume)
* **Custom Domain & DNS Security:** ~$1.50 / month
* **Total Estimated Cost:** **~$42.50 - $60.00 / month (~$510.00 - $720.00 / year)**

---

## 4. Cost Safeguards & Inactivity Policies
* **Neon / Supabase Scale-to-Zero Caveat:** Free serverless databases can spin down after days of inactivity. Our backend implements a keep-alive lightweight query and fallback transactional JSON store ensuring the site never hangs or displays database connection errors.
* **No Uncapped Billing:** Alerts are configured at 80% quota thresholds. No paid upgrades can be enabled without explicit administrative approval.
