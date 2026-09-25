-- =====================================================================
-- PFFI member tracker: database schema v1 (Postgres / Supabase)
-- Built from the owner's Google Sheet & Appendix A of PFFI Build Brief.
-- =====================================================================

create extension if not exists "pgcrypto";

-- "Today" in Kampala (EAT, UTC+3), so dates and alerts don't shift around midnight UTC.
create or replace function kampala_today() returns date
language sql stable as $$
  select (now() at time zone 'Africa/Kampala')::date
$$;

-- ---------- Types ----------------------------------------------------
do $$ begin
  create type client_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_level as enum ('A', 'B', 'C');            -- Beginner / Intermediate / Advanced
exception when duplicate_object then null; end $$;

do $$ begin
  create type plan_type as enum ('monthly', 'session_pass');
exception when duplicate_object then null; end $$;

do $$ begin
  create type txn_type as enum ('revenue', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'confirmed', 'failed');  -- 'pending'/'failed' are for online payments later
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('admin', 'coach', 'client');
exception when duplicate_object then null; end $$;

-- ---------- Users and roles ------------------------------------------
create table if not exists user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role    app_role not null
);

-- ---------- People ---------------------------------------------------
create table if not exists coaches (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid unique references auth.users (id),
  portal_email text,
  full_name text not null,
  phone     text,
  active    boolean not null default true
);

-- One row per member. Every other table links here by id, never by typed name.
create table if not exists clients (
  id             uuid primary key default gen_random_uuid(),
  member_code    text unique not null,                 -- e.g. PFFI001 (must be unique, fixes the ID mismatch)
  user_id        uuid unique references auth.users (id), -- set when the member gets a portal login
  portal_email   text,                                   -- display copy of the portal login identity
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

-- Keep the canonical schema safe to re-run against projects created before portal emails were added.
alter table coaches add column if not exists portal_email text;
alter table clients add column if not exists portal_email text;

-- Most sensitive data in the system. Admin-only in v1 (see policies below).
create table if not exists health_screenings (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients (id) on delete cascade,
  screened_on date not null default kampala_today(),
  conditions  text[] not null default '{}',
  notes       text
);

-- ---------- Plans and payments ---------------------------------------
create table if not exists plans (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          plan_type not null,
  price_ugx     int not null,                           -- ASSUMPTION: amounts are in UGX
  duration_days int,                                    -- ASSUMPTION: monthly = 30 days (or calendar month?)
  session_count int,                                    -- for session passes
  active        boolean not null default true
);

create table if not exists payments (
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
create table if not exists sessions (
  id           uuid primary key default gen_random_uuid(),
  session_date date not null,
  start_time   time,
  coach_id     uuid references coaches (id),
  title        text
);

-- A row here means the member attended that session. No row = did not attend.
create table if not exists attendance (
  session_id uuid not null references sessions (id) on delete cascade,
  client_id  uuid not null references clients (id)  on delete cascade,
  primary key (session_id, client_id)
);

-- ---------- Assessments ----------------------------------------------
create table if not exists assessments (
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
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  txn_date    date not null default kampala_today(),
  type        txn_type not null,
  description text,
  amount_ugx  int not null check (amount_ugx >= 0)
);

create table if not exists coach_reviews (
  id                  uuid primary key default gen_random_uuid(),
  coach_id            uuid not null references coaches (id) on delete cascade,
  reviewed_on         date not null default kampala_today(),
  leadership          int check (leadership between 1 and 5),
  session_quality     int check (session_quality between 1 and 5),
  punctuality         int check (punctuality between 1 and 5),
  attendance_tracking int check (attendance_tracking between 1 and 5),
  notes               text
);

create table if not exists content_posts (
  id           uuid primary key default gen_random_uuid(),
  post_date    date,
  platform     text,
  content_type text,
  posted       boolean not null default false,
  notes        text
);

create table if not exists equipment_needs (
  id         uuid primary key default gen_random_uuid(),
  item       text not null,
  quantity   int not null default 1,
  priority   text not null default 'normal' check (priority in ('low','normal','high')),
  resolved   boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists targets (
  metric text primary key check (metric in ('active_members','attendance_rate','monthly_revenue')),
  goal   numeric not null
);

-- ---------- Indexes --------------------------------------------------
create index if not exists idx_attendance_client_id on attendance (client_id);
create index if not exists idx_sessions_session_date on sessions (session_date);
create index if not exists idx_payments_client_paid on payments (client_id, paid_on desc);
create index if not exists idx_assessments_client_date on assessments (client_id, assessed_on desc);

-- ---------- Calculated views (the dashboard reads these) -------------
create or replace view v_attendance_rate_30d with (security_invoker = true) as
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

create or replace view v_at_risk_clients with (security_invoker = true) as
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

create or replace view v_membership_status with (security_invoker = true) as
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

create or replace view v_finance_ledger with (security_invoker = true) as
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
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_coach() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'coach'
  );
$$;

alter table user_roles enable row level security;

drop policy if exists "read own role" on user_roles;
create policy "read own role" on user_roles for select using (user_id = auth.uid());

drop policy if exists "admin all user_roles" on user_roles;
create policy "admin all user_roles" on user_roles for all using (is_admin()) with check (is_admin());

-- Enable RLS on all domain tables & Admin policies
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
    execute format('drop policy if exists "admin all" on %I', t);
    execute format('create policy "admin all" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- Clients (members) policies: can only read their own data, and never edit anything.
drop policy if exists "client reads own profile" on clients;
create policy "client reads own profile" on clients for select using (user_id = auth.uid());

drop policy if exists "client reads own payments" on payments;
create policy "client reads own payments" on payments for select using (client_id in (select id from clients where user_id = auth.uid()));

drop policy if exists "client reads own attendance" on attendance;
create policy "client reads own attendance" on attendance for select using (client_id in (select id from clients where user_id = auth.uid()));

drop policy if exists "client reads own assessments" on assessments;
create policy "client reads own assessments" on assessments for select using (client_id in (select id from clients where user_id = auth.uid()));

-- Coach policies: can read own coach record, assigned clients, attendance, sessions, and assigned assessments.
drop policy if exists "coach reads own record" on coaches;
create policy "coach reads own record" on coaches for select using (user_id = auth.uid());

drop policy if exists "coach reads assigned clients" on clients;
create policy "coach reads assigned clients" on clients for select using (coach_id in (select id from coaches where user_id = auth.uid()));

drop policy if exists "coach attendance select" on attendance;
create policy "coach attendance select" on attendance for select using (
  client_id in (select id from clients where coach_id in (select id from coaches where user_id = auth.uid()))
);

drop policy if exists "coach attendance manage" on attendance;
create policy "coach attendance manage" on attendance for all using (
  client_id in (select id from clients where coach_id in (select id from coaches where user_id = auth.uid()))
) with check (
  client_id in (select id from clients where coach_id in (select id from coaches where user_id = auth.uid()))
);

drop policy if exists "coach reads assigned assessments" on assessments;
create policy "coach reads assigned assessments" on assessments for select using (
  client_id in (select id from clients where coach_id in (select id from coaches where user_id = auth.uid()))
);

drop policy if exists "coach inserts assigned assessments" on assessments;
create policy "coach inserts assigned assessments" on assessments for insert with check (
  client_id in (select id from clients where coach_id in (select id from coaches where user_id = auth.uid()))
);

-- Plans and sessions are general metadata, so any signed-in user can read them.
drop policy if exists "signed-in reads plans" on plans;
create policy "signed-in reads plans" on plans for select using (auth.uid() is not null);

drop policy if exists "signed-in reads sessions" on sessions;
create policy "signed-in reads sessions" on sessions for select using (auth.uid() is not null);

-- ---------- Initial Seed Data ---------------------------------------
insert into plans (name, type, price_ugx, duration_days)
values ('Monthly membership', 'monthly', 50000, 30)
on conflict do nothing;

insert into targets (metric, goal)
values 
  ('active_members', 25),
  ('attendance_rate', 80),
  ('monthly_revenue', 1000000)
on conflict (metric) do nothing;
