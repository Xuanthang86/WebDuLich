# Wanderer’s Journeys — Admin & CMS Operations Manual
*A comprehensive guide for non-technical administrators, managers, and concierge coordinators.*

---

## 1. Accessing the Staff Management Portal
1. Open the website and select **Admin Login** from the header.
2. Sign in using the individual credentials issued by the system administrator.
3. Demo credentials and passwords must never be stored in this manual, source code, seed files, screenshots, or version control.
4. If an account is unavailable, contact the system owner to provision or reset the account through the secure account-management process.

---

## 2. Managing Inquiries & Leads (CRM)
1. In the left navigation menu, click **"Inquiries & Leads"**.
2. **Filtering & Searching:**
   * Filter leads by Status: `NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `CLOSED`.
   * Filter by coastal Hub: `Da Nang`, `Nha Trang`, `Ho Chi Minh City`.
   * Search by client name, email, phone number, or lead reference code (e.g., `WJ-2026-3933`).
3. **Reviewing Full Questionnaire Details:**
   * Click any lead row to open the complete profile.
   * View all 15 submitted questionnaire preferences including target arrival date, duration, age bracket, accommodation style, budget, and special health/dietary considerations.
4. **Updating Status & Adding Notes:**
   * Select a new status from the dropdown (e.g. change from `NEW` to `CONTACTED`).
   * Add a status transition note.
   * In the **Internal Staff Notes** box, type updates from phone calls, WhatsApp messages, or medical coordination. These notes are strictly internal and are never visible to the guest.
5. **Exporting Data:**
   * Click **"Export CSV"** or **"Export Excel"** at the top right of the leads view to download a spreadsheet report. The export includes sanitization against spreadsheet formula injection.

---

## 3. Updating Website Content via CMS
You can modify any content without touching code or redeploying the site:
1. Click **"Content CMS (CRUD)"** in the left menu.
2. Select the section tab you wish to update:
   * **Hero Section:** Update headlines, slogan, introduction to Westerner Retirement Communities (WRCs), background photo URL, and key stats.
   * **Core Inclusions:** Update base monthly starting rate (e.g. $2,250), utility allowance notes, cleaning frequency, Wi-Fi speed, and concierge description.
   * **Living Packages:** Add new packages or edit existing packages (Private Discovery Tour, 30-Day Trial, Snowbird Special, Six-Month Exploratory, 12-Month Retirement). Toggle the "Featured" badge or toggle "Published".
   * **Residences Showcase:** Add or edit apartments and villas in Da Nang, Nha Trang, or HCMC. Update photos, bedroom/bathroom counts, square meters, monthly prices, and amenities tags.
   * **FAQ Directory:** Add questions and answers categorized by Visa & Legal, Healthcare, Accommodation, Finance, or General.

---

## 4. Customizing the Inquiry Questionnaire (Form Builder)
1. Click **"Dynamic Form Builder"** in the left menu.
2. To modify a field:
   * Click the pencil icon next to the field.
   * You can edit the public label (e.g. rename "Desired Hub City" to "Preferred Destination").
   * Edit placeholder text or toggle whether the field is required.
   * Non-mandatory fields can be toggled on or off using the "Enabled" button.
3. Observe the **Live Visitor Preview** on the right panel to confirm how changes appear to visitors before publishing.

---

## 5. Monitoring Outbound Email Alerts
1. Click **"Email Outbox Queue"** in the left menu.
2. Every time a guest completes the questionnaire, an automated notification is queued to `info@wanderersjourneys.com`.
3. If an email fails due to a network glitch, its status shows `FAILED`.
4. Click **"Retry Send"** to immediately re-dispatch the notification.

---

## 6. Security, Backups & User Accounts
* **Changing Your Password:** Click the "Password" button in the top navigation bar. Enter your current password and set a new password (min. 8 characters). This revokes old sessions on other computers.
* **Adding Staff Members (Admin only):** Click **"Staff Accounts (RBAC)"**, enter their name and email, and choose their role.
* **Downloading a Backup:** Click **"Backup & Reset Tools"** -> **"Download JSON Backup"**. Store this file securely as an offline archive of all your CMS content and guest leads.
