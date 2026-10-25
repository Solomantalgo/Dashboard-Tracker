-- Avoid a circular RLS dependency:
-- coaches policy -> clients policy -> coaches policy.
-- SECURITY DEFINER lets this narrowly scoped lookup read the caller's client
-- assignment without recursively applying clients RLS.
create or replace function public.client_has_assigned_coach(target_coach_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clients
    where user_id = auth.uid()
      and coach_id = target_coach_id
  );
$$;

drop policy if exists "client reads assigned coach" on public.coaches;
create policy "client reads assigned coach" on public.coaches
for select
using (public.client_has_assigned_coach(id));
