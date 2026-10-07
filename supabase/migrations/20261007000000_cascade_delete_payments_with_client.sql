alter table public.payments
  drop constraint if exists payments_client_id_fkey;

alter table public.payments
  add constraint payments_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete cascade;
