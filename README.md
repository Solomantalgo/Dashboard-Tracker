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
3. Paste the contents of `pffi_schema_v1.sql` from this repository and run the script.
4. The schema creates all required tables, calculated views (`v_attendance_rate_30d`, `v_at_risk_clients`, `v_membership_status`, `v_finance_ledger`), helper functions (`kampala_today()`), and strict Row Level Security (RLS) policies.

### 3. Local Development

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

The application will launch at `http://localhost:5173`.

---

## Authentication & Role-Based Scoping

The application supports three roles defined in the database `user_roles` table:

1. **Admin (`admin`):** Full access to all screens, members directory, financial ledger, coach reviews, equipment wishlist, and health screening records.
2. **Member (`client`):** Read-only Member Portal (`/portal`). Scoped strictly to their own client record (`clients.user_id = auth.uid()`).
3. **Coach (`coach`):** Coach Portal (`/coach`). Can view today's session, mark attendance, and manage physical assessments for their assigned athletes only.

---

## Member Lifecycle Management

- **Deactivation:** Admins can deactivate a member on their profile. This sets `clients.status = 'inactive'`. Inactive members are excluded from active counts, attendance checklists, and alert panels. History (payments, attendance, assessments) is preserved. Admin can toggle "Show inactive" in the directory to find and reactivate them.
- **Permanent Deletion:** Irreversible action gated behind a safety dialog requiring the admin to type the member's full name. Deletes the member record and cascades through attendance, payments, and assessment history.

---

## Security Testing (RLS Verification)

Row Level Security (RLS) is enforced at the PostgreSQL database boundary on every table.

### Security Test Trajectory & Results

To verify database-level enforcement, open the browser DevTools Console while signed in as a **Member** user (`role = client`) and execute queries using the Supabase JS client:

```js
// 1. Attempt querying all clients
const { data: clients, error: clientErr } = await supabase.from('clients').select('*');
console.log('Clients count:', clients.length); 
// RESULT: Returns ONLY 1 row where clients.user_id matches auth.uid(). Other members are hidden by DB.

// 2. Attempt querying company financial transactions
const { data: txns, error: txnErr } = await supabase.from('transactions').select('*');
console.log('Transactions:', txns); 
// RESULT: Returns [] (empty array). Access blocked by RLS policy.

// 3. Attempt querying coach performance reviews
const { data: reviews, error: revErr } = await supabase.from('coach_reviews').select('*');
console.log('Coach reviews:', reviews); 
// RESULT: Returns [] (empty array). Access blocked by RLS policy.

// 4. Attempt querying sensitive health screenings of other members
const { data: health, error: healthErr } = await supabase.from('health_screenings').select('*');
console.log('Health screenings:', health); 
// RESULT: Returns [] (empty array). Access blocked by RLS policy.
```

All queries targeting unauthorized domain data return empty result sets directly from PostgreSQL, confirming that frontend interface routing is backed by hard database-level security boundaries.
