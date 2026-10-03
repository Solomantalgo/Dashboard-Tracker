create sequence if not exists public.clients_member_number_seq;

do $$
declare
  highest_used bigint;
  current_value bigint;
  sequence_called boolean;
begin
  select max(substring(member_code from 5)::bigint)
    into highest_used
    from public.clients
    where member_code ~ '^PFFI[0-9]+$';

  select last_value, is_called into current_value, sequence_called
    from public.clients_member_number_seq;

  -- Preserve a sequence that has already advanced, while making its first
  -- nextval greater than every existing PFFI numeric suffix.
  if highest_used is not null and
     (highest_used > current_value or (highest_used = current_value and not sequence_called)) then
    perform setval('public.clients_member_number_seq', highest_used, true);
  elsif highest_used is null and not sequence_called then
    perform setval('public.clients_member_number_seq', 1, false);
  end if;
end $$;

create or replace function public.next_member_number() returns int
language sql
security definer
set search_path = public
as $$ select nextval('public.clients_member_number_seq')::int $$;

grant execute on function public.next_member_number() to authenticated;
