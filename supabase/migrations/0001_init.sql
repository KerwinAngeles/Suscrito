
create extension if not exists "pgcrypto";

do $$ begin
  create type public.billing_cycle as enum ('monthly', 'yearly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'paused', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_kind as enum
    ('created', 'price_change', 'charge', 'cancelled', 'reactivated', 'paused', 'resumed');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text,
  currency       text           not null default '€' check (currency in ('€', '$', '£')),
  monthly_budget numeric(10, 2) not null default 120 check (monthly_budget > 0),
  preferred_view text           not null default 'month' check (preferred_view in ('month', 'year')),
  remind_days    smallint       not null default 3 check (remind_days in (0, 1, 3, 7)),
  unused_days    smallint       not null default 45 check (unused_days in (30, 45, 60, 90)),
  alert_hikes    boolean        not null default true,
  alert_unused   boolean        not null default true,
  alert_trials   boolean        not null default false,
  created_at     timestamptz    not null default now(),
  updated_at     timestamptz    not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 80),
  category     text not null default 'Otros' check (char_length(btrim(category)) between 1 and 40),
  amount       numeric(10, 2) not null check (amount > 0),
  cycle        public.billing_cycle not null default 'monthly',
  next_charge  date not null,
  last_used_on date not null default current_date,
  started_on   date not null default current_date,
  status       public.subscription_status not null default 'active',
  cancelled_at timestamptz,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);
create index if not exists subscriptions_user_next_charge_idx
  on public.subscriptions (user_id, next_charge);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.sync_cancelled_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and (old.status is distinct from 'cancelled') then
    new.cancelled_at = now();
  elsif new.status <> 'cancelled' then
    new.cancelled_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists subscriptions_sync_cancelled_at on public.subscriptions;
create trigger subscriptions_sync_cancelled_at
  before update on public.subscriptions
  for each row execute function public.sync_cancelled_at();

create table if not exists public.subscription_prices (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  amount          numeric(10, 2) not null check (amount > 0),
  effective_from  date not null default current_date,
  created_at      timestamptz not null default now()
);

create index if not exists subscription_prices_sub_idx
  on public.subscription_prices (subscription_id, effective_from desc);

create table if not exists public.activity_log (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  subscription_id   uuid references public.subscriptions (id) on delete set null,
  subscription_name text not null,
  kind              public.activity_kind not null,
  description       text not null,
  created_at        timestamptz not null default now()
);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);

create or replace function public.log_subscription_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscription_prices (subscription_id, user_id, amount, effective_from)
  values (new.id, new.user_id, new.amount, new.started_on);

  insert into public.activity_log (user_id, subscription_id, subscription_name, kind, description)
  values (new.user_id, new.id, new.name, 'created', 'suscripción añadida');

  return new;
end;
$$;

drop trigger if exists subscriptions_after_insert on public.subscriptions;
create trigger subscriptions_after_insert
  after insert on public.subscriptions
  for each row execute function public.log_subscription_insert();

create or replace function public.log_subscription_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta numeric;
begin
  if new.amount is distinct from old.amount then
    insert into public.subscription_prices (subscription_id, user_id, amount)
    values (new.id, new.user_id, new.amount);

    v_delta := new.amount - old.amount;
    insert into public.activity_log (user_id, subscription_id, subscription_name, kind, description)
    values (
      new.user_id, new.id, new.name, 'price_change',
      case when v_delta > 0 then 'subió a ' else 'bajó a ' end
        || to_char(new.amount, 'FM999999990D00')
    );
  end if;

  if new.status is distinct from old.status then
    insert into public.activity_log (user_id, subscription_id, subscription_name, kind, description)
    values (
      new.user_id, new.id, new.name,
      case new.status
        when 'cancelled' then 'cancelled'::public.activity_kind
        when 'paused'    then 'paused'::public.activity_kind
        else case
               when old.status = 'cancelled' then 'reactivated'::public.activity_kind
               else 'resumed'::public.activity_kind
             end
      end,
      case new.status
        when 'cancelled' then 'cancelada'
        when 'paused'    then 'pausada un mes'
        else case when old.status = 'cancelled' then 'reactivada' else 'reanudada' end
      end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists subscriptions_after_update on public.subscriptions;
create trigger subscriptions_after_update
  after update on public.subscriptions
  for each row execute function public.log_subscription_update();

drop view if exists public.subscription_metrics;
create view public.subscription_metrics
with (security_invoker = on) as
select
  s.*,
  case when s.cycle = 'yearly' then round(s.amount / 12, 2) else s.amount end as monthly_amount,
  case when s.cycle = 'yearly' then s.amount else round(s.amount * 12, 2) end as yearly_amount,
  (s.next_charge - current_date)  as days_until_charge,
  (current_date - s.last_used_on) as days_since_use
from public.subscriptions s;

create or replace function public.monthly_spend_history(p_months integer default 12)
returns table (month date, total numeric)
language sql
stable
security invoker
set search_path = public
as $$
  with months as (
    select (date_trunc('month', current_date) - make_interval(months => g))::date as month
    from generate_series(0, greatest(coalesce(p_months, 12), 1) - 1) as g
  )
  select
    m.month,
    coalesce(
      sum(case when s.cycle = 'yearly' then p.amount / 12 else p.amount end),
      0
    )::numeric(10, 2) as total
  from months m
  left join public.subscriptions s
    on s.user_id = auth.uid()
   and s.started_on <= (m.month + interval '1 month - 1 day')::date
   and (s.cancelled_at is null or s.cancelled_at >= m.month)
  left join lateral (
    select sp.amount
    from public.subscription_prices sp
    where sp.subscription_id = s.id
      and sp.effective_from <= (m.month + interval '1 month - 1 day')::date
    order by sp.effective_from desc, sp.created_at desc
    limit 1
  ) p on true
  group by m.month
  order by m.month;
$$;

alter table public.profiles            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.subscription_prices enable row level security;
alter table public.activity_log        enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "subscriptions_own" on public.subscriptions;
create policy "subscriptions_own" on public.subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "subscription_prices_own" on public.subscription_prices;
create policy "subscription_prices_own" on public.subscription_prices
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "activity_log_own" on public.activity_log;
create policy "activity_log_own" on public.activity_log
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

do $$ begin
  alter publication supabase_realtime add table public.subscriptions;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.activity_log;
exception when duplicate_object then null; end $$;
