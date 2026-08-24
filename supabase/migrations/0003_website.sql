alter table public.subscriptions
  add column if not exists website text;

alter table public.subscriptions
  drop constraint if exists subscriptions_website_format;

alter table public.subscriptions
  add constraint subscriptions_website_format
  check (website is null or website ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$');

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

notify pgrst, 'reload schema';
