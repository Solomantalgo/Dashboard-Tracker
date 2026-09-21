-- =====================================================================
-- PFFI member tracker: database schema v1 (Postgres / Supabase)
-- Built from the owner's Google Sheet. Lines marked ASSUMPTION need
-- the owner's confirmation before you rely on them.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Types ----------------------------------------------------
create type client_status as enum ('active', 'inactive');
create type client_level  as enum ('A', 'B', 'C');            -- Beginner / Intermediate / Advanced
create type plan_type     as enum ('monthly', 'session_pass');
create type txn_type      as enum ('revenue', 'expense');
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
  created_at     timestamptz not null default now()
);

-- Most sensitive data in the system. Admin-only in v1 (see policies below).
create table health_screenings (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients (id) on delete cascade,
  screened_on date not null default current_date,
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
  assessed_on         date not null default current_date,
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
  txn_date    date not null default current_date,
  type        txn_type not null,
  description text,
  amount_ugx  int not null check (amount_ugx >= 0)
);

create table coach_reviews (
  id                  uuid primary key default gen_random_uuid(),
  coach_id            uuid not null references coaches (id) on delete cascade,
  reviewed_on         date not null default current_date,
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
  on s.session_date between greatest(coalesce(c.date_joined, current_date - 30), current_date - 30)
                        and current_date
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
  and coalesce(c.date_joined, date '1900-01-01') < current_date - 14
group by c.id, c.full_name
having max(s.session_date) is null
    or max(s.session_date) < current_date - 14;

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
    when lp.expires_on is not null and lp.expires_on < current_date then 'expired'
    else 'active'
  end as membership_status
from clients c
left join lateral (
  select p.*
  from payments p
  where p.client_id = c.id
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
    'attendance','assessments','transactions','coach_reviews','content_posts'
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
