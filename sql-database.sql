-- Enable required extensions
create extension if not exists pgcrypto;

-- 1) Profiles (store user info beyond auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS: users can see/update only their profile
create policy "Profiles: individual read"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles: individual update"
on public.profiles for update
using (auth.uid() = id);

-- 2) Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  portions integer not null check (portions > 0),
  location text not null,
  total_price integer not null check (total_price >= 0),
  status text not null default 'pending'
    check (status in ('pending','preparing','confirmed','delivered','cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','confirmed','failed','refunded')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- RLS: users can insert their own orders
create policy "Orders: insert own"
on public.orders for insert
with check (auth.uid() = user_id);

-- RLS: users can see their own orders
create policy "Orders: select own"
on public.orders for select
using (auth.uid() = user_id);

-- RLS: users can update only their orders (optional; you may restrict to admins only)
create policy "Orders: update own"
on public.orders for update
using (auth.uid() = user_id);

-- 3) Messages (forwarded MoMo SMS)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  txid text not null,
  payer_name text,
  phone_number text,
  amount integer,
  received_at timestamptz not null default now()
);

create unique index if not exists messages_txid_unique on public.messages (txid);
create index if not exists messages_phone_idx on public.messages (phone_number);
create index if not exists messages_received_at_idx on public.messages (received_at);

alter table public.messages enable row level security;

-- Recommended: DO NOT allow broad client access to messages.
-- Keep messages readable only by service role or via a secure RPC.
-- For now, disable all by default (no policies). Add only admin/service policies as needed.

-- 4) Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  txid text not null,
  account_name text,
  phone_number text,
  amount integer,
  message_id uuid references public.messages(id) on delete set null,
  verified_at timestamptz not null default now()
);

create unique index if not exists payments_txid_unique on public.payments (txid);

alter table public.payments enable row level security;

-- RLS: allow reading/creating payments tied to user’s own orders
create policy "Payments: select own via orders"
on public.payments for select
using (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

create policy "Payments: insert own via orders"
on public.payments for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = payments.order_id
      and o.user_id = auth.uid()
  )
);

-- 5) Admins (optional simple role flag)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin'))
);

alter table public.admins enable row level security;

-- RLS: admins can read the admins table (or lock it to service role only)
create policy "Admins: self-read"
on public.admins for select
using (auth.uid() = user_id);

-- Example policies to allow admins full access to orders/messages/payments:
-- You can broaden as needed, or prefer service-role usage for admin UIs.

-- Orders for admins (read/update all)
create policy "Orders: admin read"
on public.orders for select
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "Orders: admin update"
on public.orders for update
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Payments for admins (read all)
create policy "Payments: admin read"
on public.payments for select
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Messages for admins (read all). If you want to keep messages private, skip this and use the RPC below.
create policy "Messages: admin read"
on public.messages for select
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 6) Optional: Secure RPC for payment verification (preferred to exposing messages directly)
--    This lets the client call a function to verify without direct table access.
create or replace function public.verify_payment_rpc(
  in_txid text,
  in_account_name text,
  in_phone_last4 text
)
returns table (
  id uuid,
  txid text,
  payer_name text,
  phone_number text,
  amount integer,
  received_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select m.id, m.txid, m.payer_name, m.phone_number, m.amount, m.received_at
  from public.messages m
  where m.txid = in_txid
    and m.payer_name ilike '%' || in_account_name || '%'
    and right(coalesce(m.phone_number,''), 4) = in_phone_last4
  limit 1;
$$;

-- Allow authenticated users to execute the RPC
grant execute on function public.verify_payment_rpc(text, text, text) to authenticated;
