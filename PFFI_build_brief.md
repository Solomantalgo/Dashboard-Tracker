# PFFI Member Tracker: Build Brief (Agent Prompt)

## 0. How to work

You are a senior full-stack engineer and product designer. Build the working web app described below, start to finish.

- Read this whole brief before writing code. Then write a short plan and list any assumptions you are making.
- Build in the phases in section 12. Run and test each phase before starting the next.
- When the brief is silent, choose the simplest sensible option and record it in `DECISIONS.md`. Ask a question only if you are truly blocked.
- Do not build anything listed under "Out of scope" (section 14).
- The developer will read and maintain this code. Keep it simple, use clear names, comment anything non-obvious, and avoid clever abstractions.
- Never put real member data in the repo, seed data, screenshots or logs. Use invented demo members.
- Brand assets are in the project's `assets/` folder (for example `public/assets/`). Use whatever filenames you find there: the logo is the main file, and the flyer is a style reference only.

---

## 1. The business

**Prime Form Fitness Initiative (PFFI)** ("Fitness Community Hub. Real Training. Real Results.") runs structured outdoor group training in Kampala, Uganda.

| Fact | Detail (from the owner's flyer) |
|---|---|
| Location | Safe Fields Boston, Kizungu (single location) |
| Workout days | Monday to Thursday, 7am to 8am |
| Monthly fee | UGX 50,000 |
| Promise | Weight loss, strength building, fitness improvement, fitness assessments, structured group training, progress tracking |
| Size today | About 17 to 25 members, at least 2 coaches |
| Usage | Mostly on phones, outdoors, often on weak mobile data |

The owner currently runs everything in one Google Sheet. Its tabs: Attendance Tracker, Payment Tracker, Finance Tracker, Coach Management, Assessment Tracker, Content Tracker, PFFI Assessment Form, PFFI Dashboard.

Note: the old sheet tracked Monday to Friday, but the flyer says Monday to Thursday. Do not hard-code weekdays. Sessions are created for any date.

## 2. Problem to solve (pain points in the sheet)

| Pain point in the sheet | What the app must do |
|---|---|
| Attendance is weekday tick-boxes that get overwritten, with no dates and no totals | Log each session once. Calculate show-up rate. Flag members who stop coming. |
| Payment expiry and status are typed by hand and mostly blank | Calculate expiry and membership status. Show who is expired, due soon or never paid. |
| The same member is retyped in every tab, and IDs and spellings have drifted apart | One member record, chosen from a list, never retyped. |
| Assessment results are free text ("60 secs", "63kg") and many members are missing them | Structured numeric fields, progress charts, "assessment due" reminders. |
| Intake records are incomplete | Required fields and a consent checkbox. |
| The dashboard tab is empty because it was never worth maintaining by hand | Build the dashboard automatically from the data. |
| Finance, coach and content tabs are empty | Make entry so quick that they actually get used. |

**Success:** the owner can run a normal week (mark attendance, record payments, do assessments) faster than in his sheet, see the state of the business at a glance, and members can see their own progress and payments.

## 3. Users and roles

- **Admin (the owner):** full access to everything.
- **Member:** read-only portal. Sees only their own profile, attendance, progress, membership and payment history. Never sees other members, finance, coach reviews or the health screening.
- **Coach:** not confirmed by the owner. In v1 coaches do not log in and the admin marks attendance. Keep the design ready for a `coach` role later (mark attendance for their own sessions, see their own members).

Health screening data (medical conditions) is admin-only in v1.

## 4. Tech stack (defaults)

- React + Vite + Tailwind CSS (TypeScript preferred)
- Supabase: Postgres, Auth, Row Level Security (RLS), Edge Functions later
- React Router, TanStack Query, react-hook-form + zod, Recharts, lucide-react, date-fns
- Deploy on Vercel
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ONLINE_PAYMENTS=false`
- Never put the Supabase service-role key in frontend code.

## 5. Brand and design system

**Feel:** bold, athletic, premium and clean. Dark by default, mostly black and silver-white surfaces, with red used sparingly as the energy colour (roughly 10% of the screen). Modern, confident, easy to scan.

**Logo:** red arrow rising over a stylised "P" mark, with silver "PRIME FORM" and "FITNESS INITIATIVE" beneath. The file has a near-black background, so place it on dark surfaces (sidebar, login). Do not stretch or recolour it. Crop the arrow mark for the favicon and app icon. A transparent PNG or SVG can replace the file later.

**Colour tokens** (define as CSS variables and in the Tailwind theme):

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0B10` | App background |
| `--surface` | `#12141B` | Cards, sidebar |
| `--surface-2` | `#1A1D26` | Raised elements, inputs, table stripes |
| `--border` | `#262A36` | 1px borders |
| `--text` | `#F5F6F8` | Main text |
| `--text-muted` | `#9AA1AE` | Secondary text |
| `--silver` | `#B9BEC7` | Logo silver, secondary chart series |
| `--brand` | `#DA0E19` | Primary buttons, active nav, key accents (sampled from the logo) |
| `--brand-hover` | `#F0202C` | Hover and focus |
| `--brand-soft` | `rgba(218,14,25,0.14)` | Selected rows, soft badges |
| `--success` | `#22C55E` | Paid, active |
| `--warning` | `#F59E0B` | Due soon |

Because the brand colour is red, do not use plain red to mean "bad". Show problems (expired, overdue, at risk) with a warning-style badge plus an icon plus a text label. Never rely on colour alone.

**Type:** headings in Montserrat (600 to 800, close to the logo lettering), body in Inter. Use tabular numbers for money and stats. KPI numbers should be large and bold.

**Components and style:** 12px radius cards with 1px `--border` and a thin red accent line on KPI cards. Red primary buttons, ghost secondary buttons. Subtle 150ms transitions. Skeleton loaders. Charts use red as the main series, silver as the secondary, and faint white gridlines. Clear focus rings. Minimum 48px touch targets on attendance and payment screens. Meet WCAG AA contrast.

**Photos:** the app does not need photos.
- Member avatars are initials in a circle (`--surface-2` background, silver text).
- Use the logo in the sidebar, login and favicon.
- Do not use the flyer's group photo or any member photos: they show real members and there is no consent for it.
- The login page is a dark split layout with the logo, the tagline "Real Training. Real Results." and a soft red glow.

## 6. Database

Run the SQL in the appendix in the Supabase SQL editor. It defines the tables, calculated views (show-up rate, at-risk members, membership status, finance ledger) and RLS access rules. You may improve it, but keep these rules:

- Every table links to `clients` by id, never by typed name.
- Attendance is one row per member per session. A row means the member attended.
- Show-up rate, membership status, balances and alerts are calculated by views, never typed.
- Only confirmed payments count. Manual payments are confirmed straight away. Online payments (later) start as `pending`.
- Dates use the `kampala_today()` helper (Africa/Kampala, UTC+3), not the database's UTC date.

To create the first admin: create a user in Supabase Auth, then insert a row in `user_roles` with role `admin`.

Rules built into the views (assumptions to confirm with the owner): show-up rate uses a 30-day window and ignores sessions before the member joined. "Stopped coming" means no attendance for 14 days. Show these in Settings as read-only values in v1.

## 7. App layout and screens

**Layout (admin):** fixed left sidebar on desktop (logo, navigation, user menu), top bar with page title, global search and quick actions. On mobile, use a bottom tab bar (Dashboard, Attendance, Members, Payments, More). Content max width about 1280px.

**Admin navigation:** Dashboard, Members, Attendance, Payments, Assessments, Finance, Coaches, Content, Equipment, Settings.

### 7.1 Dashboard (built from the owner's own dashboard tab)

```
+-----------+--------------------------------------------------------------+
| [logo]    | Dashboard                   [+ Session] [+ Payment] [profile]|
|           +--------------------------------------------------------------+
| Dashboard | [Active] [This week] [Show-up %] [Revenue MTD] [Outstanding] |
| Members   +----------------------------------+---------------------------+
| Attendance| Attendance, last 8 weeks (chart) | Weekly targets (3 bars)   |
| Payments  +----------------------------------+---------------------------+
| ...       | Revenue, last 6 months (chart)   | Alerts panel              |
|           +----------------------------------+---------------------------+
|           | Recent payments      |  Recent check-ins                     |
+-----------+--------------------------------------------------------------+
```

- **KPI cards:** Active members; Check-ins this week; Show-up rate (30 days); Revenue this month (UGX); Outstanding (members expired or never paid, with the amount expected).
- **Weekly targets** (owner's tab): Active members, Attendance rate, Monthly revenue. Show goal vs current as progress bars. Goals come from the `targets` table, editable in Settings.
- **Alerts** (owner's tab): Expired memberships, Expiring in 7 days, Stopped coming (14+ days), Inactive members, Equipment needed. Each row has an avatar, a detail line and one action (Record payment, View member, Mark resolved).
- **Quick actions:** Start today's session, Record payment, Add member, New assessment.
- Every card has loading, empty (with a helpful message) and error states.

### 7.2 Members

- Table with search and filters (status, coach, membership status). Columns: member (avatar, name, code), status, coach, membership badge with expiry date, show-up % (30 days), last attended, actions.
- **Add member** drawer: name, phone, area, age, date joined, coach, goals (multi-select: Weight Loss, Fitness, Muscle Gain, Performance), level (A Beginner, B Intermediate, C Advanced), consent checkbox (sets `consent_given_at`), then an optional health screening step and an optional first assessment.
- **CSV import** (see section 10).
- **Member profile** with tabs: Overview (show-up %, sessions attended, streak, membership expiry, attendance calendar), Attendance, Payments, Assessments (charts for weight, pushups, plank, run time, plus a table), Health (admin only, with a sensitive-data banner).

### 7.3 Attendance (built for a coach with a phone, outdoors)

- "Start today's session" creates a session for today (default 07:00, coach dropdown).
- One big list of active members with a search box and large toggles for present. Show a live counter ("14 / 17 present"). Add a quick "walk-in" member option.
- Updates should feel instant (optimistic) and retry on weak networks.
- Past sessions can be opened and corrected.

### 7.4 Payments

- Summary strip: collected this month, outstanding count.
- Table with filters: Paid, Due soon, Expired, Never paid.
- **Record payment** modal: member, plan (prefills the price), amount, paid on (default today), method (Cash, MTN MoMo, Airtel Money, Bank transfer, Other), expires on (default paid on + plan duration, editable), notes.
- **Payment system placeholder** (see section 8): in the modal, show a disabled "Collect online (coming soon)" option. Settings has a "Payments" section reading "Online payments: not connected".

### 7.5 Assessments

- List of members with last assessed date and an "Due" badge (default every 4 weeks, an assumption).
- New assessment form: date, height, weight, waist in cm (with an inches-to-cm helper), pushups plus a "proper form" toggle, plank seconds, run time entered as mm:ss and stored as seconds, notes. Show BMI live and change since the previous assessment. A member's first assessment is their baseline.

### 7.6 Finance

- Cards: revenue this month, expenses this month, balance.
- Ledger table from `v_finance_ledger` with a month filter. A form to add expenses and other income. Member payments appear automatically and are not editable here.

### 7.7 Coaches
List, add coach, and a review form (Leadership, Session quality, Punctuality, Attendance tracking, each 1 to 5, plus notes) with a per-coach average over time.

### 7.8 Content tracker
Simple table or calendar: date, platform (Instagram, WhatsApp status, TikTok, Facebook), content type (photo, video, reel, flyer), posted toggle, notes.

### 7.9 Equipment
List with item, quantity, priority, resolved toggle. The unresolved count feeds the dashboard alert.

### 7.10 Settings
Weekly targets, plans (name, type, price, duration), rules (read-only in v1), users and roles (link a login to a member record), Payments placeholder, CSV export of members.

### 7.11 Member portal (role = client)
Separate, mobile-first layout with a simple bottom nav.
- **Home:** greeting, membership card (status, expiry date, days left), show-up rate ring, sessions this month.
- **Progress:** assessment charts with change since baseline.
- **Payments:** history, balance due (the plan price if expired or never paid, otherwise zero) and a disabled "Pay online (coming soon)" button.
- **Profile:** own details, read-only.
- **Notifications** (in-app, calculated from the views, no extra table): membership expiring or expired, payment received, assessment due.

A member must never be able to see another member's data, finance, coach reviews or health screening.

## 8. Payment system: option now, provider later

The owner has not chosen a provider yet (mobile money such as MTN MoMo or Airtel Money, through an aggregator). Do not pick or integrate one. Do build the seam:

```ts
// src/services/payments/types.ts
export interface PaymentProvider {
  id: 'manual' | string; // later e.g. 'mtn_momo', 'airtel_money', 'flutterwave', 'pesapal'
  createPaymentRequest(input: {
    clientId: string; planId: string; amountUgx: number; phone?: string;
  }): Promise<{ paymentId: string; providerRef?: string; redirectUrl?: string }>;
  handleWebhook(payload: unknown, headers: Record<string, string>):
    Promise<{ paymentId: string; status: 'confirmed' | 'failed' }>;
}
```

- **Now:** implement `ManualProvider`, which inserts a `payments` row with status `confirmed`. All payment screens call the provider interface, not the table directly.
- **Feature flag:** `VITE_ONLINE_PAYMENTS=false`. When false, "Collect online" and "Pay online" are visible but disabled.
- **Later:** create a `pending` payment row, send the request to the provider, and a Supabase Edge Function (service role) receives the webhook, flips the row to `confirmed` or `failed`, and sets `expires_on`. The views already count only confirmed payments.

## 9. Sharing progress (Phase 2)

Add a "Share progress" button on the member profile that exports a clean image or PDF card (name, show-up rate, selected assessment improvements) to send over WhatsApp. The admin chooses which metrics to include. Default excludes weight and always excludes health data. No public links to raw data.

## 10. Data import (from the owner's sheet)

Build a members CSV import in Settings with preview, validation and duplicate detection (same phone or same normalised name). The admin resolves duplicates before saving.

Known problems in the sheet:
- Member IDs do not match across tabs, so the import must use a fresh, unique `member_code`.
- Names are spelled differently across tabs, and a few people appear more than once.
- Phone numbers are stored as numbers without the leading zero (for example `7xxxxxxxx`). Normalise to `+2567xxxxxxxx`.
- Waist is entered in both cm and inches. Store cm.
- Skip importing payments and assessments in v1 (only a handful of rows).

## 11. Security and privacy

- RLS is on for every table. Test with a member account and document the results in the README: they cannot read other members, cannot read health screenings and cannot insert, update or delete anything.
- Health screening is sensitive: admin-only, a visible banner in the UI, excluded from exports and shared cards, never logged.
- Only the anon key in the frontend. The service-role key only in Edge Functions.
- Validate input with zod in the app and with constraints in the database.
- Consent: the intake form requires a consent checkbox. The owner should review his obligations under Uganda's Data Protection and Privacy Act, 2019.
- Member logins are optional in v1: the admin can use the app without any. Invite members by email, and add a temporary-password option for members without email.

## 12. Build phases and definition of done

**Phase 0:** scaffold, design tokens, layout, auth and roles, run the SQL, seed invented demo data (about 20 members, 8 weeks of sessions, some payments, some assessments).

**Phase 1 (must work end to end):** Members (add, edit, list, CSV import), Attendance (session mode), Payments (manual), Dashboard (KPIs, alerts, targets), Member portal (Home, Payments, Profile).

**Phase 2:** Assessments and charts, Finance, Coaches, Content, Equipment, Settings, Share progress.

**Phase 3 (later, not now):** online payments, SMS or WhatsApp reminders (Africa's Talking), coach logins.

**Definition of done:**
- Works well at 360px wide and on desktop.
- Every screen has loading, empty and error states.
- Money shows as `UGX 50,000`. Dates show as dd/mm/yyyy in Africa/Kampala time.
- Keyboard accessible, AA contrast, no colour-only meaning.
- README with setup steps and the RLS test results. `DECISIONS.md` lists every assumption.
- Deployed to Vercel with a working demo login for the admin and a member.

## 13. Assumptions to confirm with the owner (do not block the build)

1. Amounts are in UGX.
2. A monthly plan lasts 30 days (or is it a calendar month?).
3. Session pass: price, number of sessions and expiry are unknown.
4. What "premium member" means (not modelled yet).
5. Expenses are tracked (the sheet's Finance tab suggests yes).
6. Equipment needed is a simple wishlist.
7. Show-up window of 30 days, "stopped coming" after 14 days, assessment every 4 weeks.
8. Sessions run Monday to Thursday (flyer) rather than Monday to Friday (sheet).
9. Coaches do not log in yet.
10. Members will log in to see their own progress and payments.
11. Who besides the admin may see health screening data.
12. Which payment provider to use, and when.

## 14. Out of scope for now

Online payment integration, sending SMS or WhatsApp messages, coach logins, member photo uploads, multiple branches, a light theme, native mobile apps.

---

## Appendix A: Database schema (Postgres / Supabase)

```sql
-- =====================================================================
-- PFFI member tracker: database schema v1 (Postgres / Supabase)
-- Built from the owner's Google Sheet. Lines marked ASSUMPTION need
-- the owner's confirmation before you rely on them.
-- =====================================================================

create extension if not exists "pgcrypto";

-- "Today" in Kampala (EAT, UTC+3), so dates and alerts don't shift around midnight UTC.
create function kampala_today() returns date
language sql stable as $$
  select (now() at time zone 'Africa/Kampala')::date
$$;

-- ---------- Types ----------------------------------------------------
create type client_status as enum ('active', 'inactive');
create type client_level  as enum ('A', 'B', 'C');            -- Beginner / Intermediate / Advanced
create type plan_type     as enum ('monthly', 'session_pass');
create type txn_type      as enum ('revenue', 'expense');
create type payment_status as enum ('pending', 'confirmed', 'failed');  -- 'pending'/'failed' are for online payments later
create type app_role      as enum ('admin', 'coach', 'client');

-- ---------- Users and roles ------------------------------------------
create table user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role    app_role not null
);

-- ---------- People ---------------------------------------------------
create table coaches (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid unique references auth.users (id),
  full_name text not null,
  phone     text,
  active    boolean not null default true
);

-- One row per member. Every other table links here by id, never by typed name.
create table clients (
  id             uuid primary key default gen_random_uuid(),
  member_code    text unique not null,                 -- e.g. PFFI001 (must be unique, fixes the ID mismatch)
  user_id        uuid unique references auth.users (id), -- set when the member gets a portal login
  full_name      text not null,
  status         client_status not null default 'active',
  phone          text,
  area           text,
  age_at_joining int,
  date_joined    date,
  coach_id       uuid references coaches (id),
  goals          text[] not null default '{}',
  level          client_level,                          -- coach evaluation (A/B/C)
  consent_given_at timestamptz,                         -- when the member agreed to their data being stored
  created_at     timestamptz not null default now()
);

-- Most sensitive data in the system. Admin-only in v1 (see policies below).
create table health_screenings (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients (id) on delete cascade,
  screened_on date not null default kampala_today(),
  conditions  text[] not null default '{}',
  notes       text
);

-- ---------- Plans and payments ---------------------------------------
create table plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          plan_type not null,
  price_ugx     int not null,                           -- ASSUMPTION: amounts are in UGX
  duration_days int,                                    -- ASSUMPTION: monthly = 30 days (or calendar month?)
  session_count int,                                    -- for session passes
  active        boolean not null default true
  -- "Premium" is not modelled yet: the owner has to define what it means.
);

create table payments (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients (id),
  plan_id      uuid not null references plans (id),
  amount_ugx   int not null check (amount_ugx >= 0),
  paid_on      date not null,
  expires_on   date,
  method       text,                                    -- cash, MTN MoMo, Airtel Money, bank...
  status       payment_status not null default 'confirmed', -- manual entries are confirmed; online ones start 'pending'
  provider_ref text,                                    -- filled later when a payment provider is connected
  notes        text,
  created_at   timestamptz not null default now()
);

-- ---------- Sessions and attendance ----------------------------------
create table sessions (
  id           uuid primary key default gen_random_uuid(),
  session_date date not null,
  start_time   time,
  coach_id     uuid references coaches (id),
  title        text
);

-- A row here means the member attended that session. No row = did not attend.
create table attendance (
  session_id uuid not null references sessions (id) on delete cascade,
  client_id  uuid not null references clients (id)  on delete cascade,
  primary key (session_id, client_id)
);

-- ---------- Assessments ----------------------------------------------
-- Numbers only. The sheet had free text like "60 secs" and "63kg".
create table assessments (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references clients (id) on delete cascade,
  assessed_on         date not null default kampala_today(),
  height_cm           numeric(5,1),
  weight_kg           numeric(5,1),
  waist_cm            numeric(5,1),                     -- store cm; convert inches on entry (sheet mixes both)
  pushups             int,
  pushups_proper_form boolean,
  plank_seconds       int,
  run_time_seconds    int,
  notes               text,
  bmi numeric(4,1) generated always as (
    case when height_cm > 0 then round(weight_kg / power(height_cm / 100.0, 2), 1) end
  ) stored
);

-- ---------- Finance, coaches, content --------------------------------
-- Member payments already count as revenue (see v_finance_ledger),
-- so only OTHER income and expenses are entered here.
-- ASSUMPTION: the owner wants expenses tracked (the sheet's Finance tab suggests it).
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  txn_date    date not null default kampala_today(),
  type        txn_type not null,
  description text,
  amount_ugx  int not null check (amount_ugx >= 0)
);

create table coach_reviews (
  id                  uuid primary key default gen_random_uuid(),
  coach_id            uuid not null references coaches (id) on delete cascade,
  reviewed_on         date not null default kampala_today(),
  leadership          int check (leadership between 1 and 5),
  session_quality     int check (session_quality between 1 and 5),
  punctuality         int check (punctuality between 1 and 5),
  attendance_tracking int check (attendance_tracking between 1 and 5),
  notes               text
);

create table content_posts (
  id           uuid primary key default gen_random_uuid(),
  post_date    date,
  platform     text,
  content_type text,
  posted       boolean not null default false,
  notes        text
);

-- Owner's dashboard has an "Equipment needed" alert. ASSUMPTION: a simple wishlist.
create table equipment_needs (
  id         uuid primary key default gen_random_uuid(),
  item       text not null,
  quantity   int not null default 1,
  priority   text not null default 'normal' check (priority in ('low','normal','high')),
  resolved   boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);

-- Dashboard "weekly targets": goal vs current. Goals are editable in Settings.
create table targets (
  metric text primary key check (metric in ('active_members','attendance_rate','monthly_revenue')),
  goal   numeric not null
);

-- ---------- Indexes --------------------------------------------------
create index on attendance (client_id);
create index on sessions (session_date);
create index on payments (client_id, paid_on desc);
create index on assessments (client_id, assessed_on desc);

-- ---------- Calculated views (the dashboard reads these) -------------
-- security_invoker makes each view respect the row-level security below,
-- so a client querying a view only ever sees their own rows.

-- Show-up rate over the last 30 days.
-- ASSUMPTION: 30-day window; sessions before the member joined don't count.
create view v_attendance_rate_30d with (security_invoker = true) as
select
  c.id as client_id,
  c.full_name,
  count(s.id)          as sessions_held,
  count(a.client_id)   as sessions_attended,
  case when count(s.id) > 0
       then round(100.0 * count(a.client_id) / count(s.id), 0)
  end                  as show_up_rate_pct
from clients c
left join sessions s
  on s.session_date between greatest(coalesce(c.date_joined, kampala_today() - 30), kampala_today() - 30)
                        and kampala_today()
left join attendance a
  on a.session_id = s.id and a.client_id = c.id
where c.status = 'active'
group by c.id, c.full_name;

-- Members who stopped coming.
-- ASSUMPTION: no attendance in 14 days; members who joined in the last 14 days are excluded.
create view v_at_risk_clients with (security_invoker = true) as
select
  c.id as client_id,
  c.full_name,
  max(s.session_date) as last_attended
from clients c
left join attendance a on a.client_id = c.id
left join sessions   s on s.id = a.session_id
where c.status = 'active'
  and coalesce(c.date_joined, date '1900-01-01') < kampala_today() - 14
group by c.id, c.full_name
having max(s.session_date) is null
    or max(s.session_date) < kampala_today() - 14;

-- Membership status from each member's latest payment.
-- Session passes have no expiry date yet: treated as active until the owner defines the rule.
create view v_membership_status with (security_invoker = true) as
select
  c.id as client_id,
  c.full_name,
  lp.paid_on,
  lp.expires_on,
  case
    when lp.id is null then 'never_paid'
    when lp.expires_on is not null and lp.expires_on < kampala_today() then 'expired'
    else 'active'
  end as membership_status
from clients c
left join lateral (
  select p.*
  from payments p
  where p.client_id = c.id and p.status = 'confirmed'
  order by p.paid_on desc
  limit 1
) lp on true;

-- Revenue, expenses and running balance (member payments + other transactions).
create view v_finance_ledger with (security_invoker = true) as
select
  l.*,
  sum(l.revenue - l.expense) over (order by l.txn_date) as balance
from (
  select paid_on as txn_date, 'Member payment' as description,
         amount_ugx as revenue, 0 as expense
  from payments
  where status = 'confirmed'
  union all
  select txn_date, description,
         case when type = 'revenue' then amount_ugx else 0 end,
         case when type = 'expense' then amount_ugx else 0 end
  from transactions
) l;

-- ---------- Access control -------------------------------------------
create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'admin'
  );
$$;

alter table user_roles enable row level security;
create policy "read own role" on user_roles for select using (user_id = auth.uid());

-- Admin can do everything on every table.
do $$
declare t text;
begin
  foreach t in array array[
    'coaches','clients','health_screenings','plans','payments','sessions',
    'attendance','assessments','transactions','coach_reviews','content_posts',
    'equipment_needs','targets'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "admin all" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- Clients (members) can only read their own data, and never edit anything.
create policy "client reads own profile" on clients
  for select using (user_id = auth.uid());

create policy "client reads own payments" on payments
  for select using (client_id in (select id from clients where user_id = auth.uid()));

create policy "client reads own attendance" on attendance
  for select using (client_id in (select id from clients where user_id = auth.uid()));

create policy "client reads own assessments" on assessments
  for select using (client_id in (select id from clients where user_id = auth.uid()));

-- Plans and sessions are not personal, so any signed-in user can read them.
create policy "signed-in reads plans" on plans
  for select using (auth.uid() is not null);

create policy "signed-in reads sessions" on sessions
  for select using (auth.uid() is not null);

-- Not in v1 (needs owner's answers): coach logins, coach access to their own
-- clients, and who can see health_screenings besides the admin.
-- v_finance_ledger is an admin view. A client querying it would only see
-- their own payments (security_invoker), so don't use it in the client portal.

-- ---------- Seed data ------------------------------------------------
-- From the owner's flyer: monthly fee UGX 50,000. Session pass price is unknown; add it once confirmed.
insert into plans (name, type, price_ugx, duration_days)
values ('Monthly membership', 'monthly', 50000, 30);
```
