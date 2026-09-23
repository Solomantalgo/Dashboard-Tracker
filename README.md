# PFFI Member Tracker

**Prime Form Fitness Initiative (PFFI)** ("Fitness Community Hub. Real Training. Real Results.") runs outdoor group fitness training at Kizungu, Safe Fields Boston in Kampala, Uganda.

This application provides a dual-mode member tracking platform supporting administrative management (attendance, payments, physical assessments, revenue/expense ledger, coach performance) and role-scoped portals for members and coaches.

---

## Technical Stack

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Icons & Visualization:** Lucide React + Recharts
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Supabase Auth)
- **Timezone:** Africa/Kampala (`EAT`, UTC+3)

---

## Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your environment variables in `.env`:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ONLINE_PAYMENTS=false
VITE_DEMO_MODE=false
```

- If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided, the application runs in **Supabase Connected Mode**, querying and mutating real database tables.
- If credentials are empty or `VITE_DEMO_MODE=true`, the application operates in **Local Demo Mode** backed by mock data and `localStorage`.

### 2. Database Setup

1. Create a fresh project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste the contents of `pffi_schema_v1.sql` from this repository and run the script. This is the intended setup path; execution was not verified in this pass.
4. The script is intended to create the required tables, calculated views (`v_attendance_rate_30d`, `v_at_risk_clients`, `v_membership_status`, `v_finance_ledger`), helper functions (`kampala_today()`), and Row Level Security (RLS) policies. Live creation and policy behavior remain unverified.

### Portal Invite Function

Portal invites use the Edge Function at `supabase/functions/invite-user`. Deploy it with:

```bash
supabase functions deploy invite-user
```

The function verifies the caller is an authenticated admin, creates a confirmed Auth user with a one-time temporary password, and links `user_roles` plus the target member or coach record server-side. The service-role key is used only inside the function and must never be placed in the frontend `.env`.

### 3. Local Development

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

The application will launch at `http://localhost:5173`.

---

## Authentication & Role-Based Scoping

The code defines three roles intended to be backed by the database `user_roles` table:

1. **Admin (`admin`):** Intended to have full access to all screens, members directory, financial ledger, coach reviews, equipment wishlist, and health screening records.
2. **Member (`client`):** Intended to use the read-only Member Portal (`/portal`) and be scoped to their own client record (`clients.user_id = auth.uid()`).
3. **Coach (`coach`):** Intended to use the Coach Portal (`/coach`) for today's session, attendance, and assigned athletes.

These role and RLS behaviors require live verification against a Supabase project; the local code inspection found the corresponding Auth and policy paths but does not prove runtime behavior.

---

## Member Lifecycle Management

- **Deactivation:** Admins can deactivate a member on their profile. This sets `clients.status = 'inactive'`. Inactive members are excluded from active counts, attendance checklists, and alert panels. History (payments, attendance, assessments) is preserved. Admin can toggle "Show inactive" in the directory to find and reactivate them.
- **Permanent Deletion:** Irreversible action gated behind a safety dialog requiring the admin to type the member's full name. Deletes the member record and cascades through attendance, payments, and assessment history.

---

## Security Testing (RLS Verification)

The schema contains Row Level Security (RLS) policies intended to enforce boundaries at PostgreSQL. Live enforcement was not verified in this pass.

### Required test, not completed in this pass

To verify database-level enforcement, open the browser DevTools Console while signed in as a **Member** user (`role = client`) and execute queries using the Supabase JS client:

```js
// 1. Attempt querying all clients
const { data: clients, error: clientErr } = await supabase.from('clients').select('*');
console.log('Clients count:', clients?.length, clientErr);

// 2. Attempt querying company financial transactions
const { data: txns, error: txnErr } = await supabase.from('transactions').select('*');
console.log('Transactions:', txns, txnErr);

// 3. Attempt querying coach performance reviews
const { data: reviews, error: revErr } = await supabase.from('coach_reviews').select('*');
console.log('Coach reviews:', reviews, revErr);

// 4. Attempt querying sensitive health screenings of other members
const { data: health, error: healthErr } = await supabase.from('health_screenings').select('*');
console.log('Health screenings:', health, healthErr);
```

No RLS/Auth query results are claimed here: this pass had no real test users, so database-level role enforcement remains unverified.

## Verification status (2026-09-23)

- Static code inspection found Supabase branches with local fallbacks for the requested domain operations, a Supabase Auth login form, deactivate/reactivate and name-confirmed permanent-delete paths, and member/coach invite paths.
- `npm install` completed successfully and `npm run build` completed successfully. Vite emitted a warning that the JavaScript chunk is larger than 500 kB after minification.
- The repository does not contain `PFFI_fix_brief.md`, so that baseline could not be compared directly.
- A1 is statically fixed: protected routes now require a signed-in user unless `VITE_DEMO_MODE=true`; an unconfigured build with demo mode off shows the login screen and warning.
- A2 is statically fixed: coach attendance select and manage policies are restricted to clients assigned to the authenticated coach. No other domain policy uses unscoped `is_coach()`.
- Empty-table fix: connected list reads now return successful Supabase empty results as empty arrays/`undefined`; local mock data is used only when the query errors, with a visible `console.error`.
- Read-only live check on the configured Supabase project returned HTTP 200 and 0 rows for `clients`, `coaches`, `plans`, `payments`, `sessions`, `attendance`, `assessments`, `transactions`, `coach_reviews`, `content_posts`, `equipment_needs`, and `targets`.
- No writes or UI clicks were performed because this workspace does not establish that the configured project is disposable, no admin test credentials are available, and browser automation is unavailable. Adding rows, empty-state rendering, UUID coach selection, and wrong-key console behavior remain unverified.
- Portal controls/layout fix: member identity/admin controls are explicit-demo-only, authenticated client/coach rows are authoritative for real sessions, and both portals use mobile bottom navigation plus desktop/tablet side rails and wider content containers. Real-user login and visual checks at 375px, 768px, and 1440px remain unverified.
