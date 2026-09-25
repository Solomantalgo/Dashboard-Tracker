drop policy if exists "client reads assigned coach" on coaches;
create policy "client reads assigned coach" on coaches for select using (
  id in (select coach_id from clients where user_id = auth.uid())
);
