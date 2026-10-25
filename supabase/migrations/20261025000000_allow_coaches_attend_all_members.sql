-- Coaches can see active members and record attendance for any member.
-- Member records themselves remain admin-write-only.
drop policy if exists "coach reads assigned clients" on clients;
drop policy if exists "coach reads all clients" on clients;
create policy "coach reads all clients" on clients
for select using (is_coach());

drop policy if exists "coach attendance select" on attendance;
create policy "coach attendance select" on attendance
for select using (is_coach());

drop policy if exists "coach attendance manage" on attendance;
create policy "coach attendance manage" on attendance
for all using (is_coach()) with check (is_coach());

drop policy if exists "coach manages sessions" on sessions;
create policy "coach manages sessions" on sessions
for all using (is_coach()) with check (is_coach());
