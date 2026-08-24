
create or replace function public.seed_demo_subscriptions()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_today date := current_date;
  v_count integer := 0;
  v_id    uuid;
  r       record;
begin
  if v_user is null then
    raise exception 'seed_demo_subscriptions requiere sesión iniciada';
  end if;

  if exists (select 1 from public.subscriptions where user_id = v_user) then
    return 0;
  end if;

  for r in
    select *
    from (values
      ('Streamly',       'Vídeo',          12.99, 'monthly',  4,  2,  18, 9.99),
      ('Radar Noticias', 'Noticias',        8.50, 'monthly',  1, 41,  11, 7.50),
      ('Nimbus Drive',   'Almacenamiento',  2.99, 'monthly',  2,  1,  30, null),
      ('Pixel Suite',    'Diseño',         24.99, 'monthly',  7,  9,  26, 21.99),
      ('Atlas Fitness',  'Gimnasio',       39.00, 'monthly',  9, 63,  19, null),
      ('Sonora',         'Música',         10.99, 'monthly', 10,  1,  39, 9.99),
      ('Correo Pro',     'Productividad',   6.00, 'monthly', 16,  1,  21, null),
      ('Vía Rápida',     'Transporte',      4.99, 'monthly', 22, 34,  17, null),
      ('Cloud Code',     'Desarrollo',    180.00, 'yearly',  73, 12,  21, 150.00),
      ('Lectura Plus',   'Libros',         89.00, 'yearly', 172, 88,  18, null)
    ) as t(name, category, amount, cycle, in_days, idle_days, age_months, old_amount)
  loop
    insert into public.subscriptions
      (user_id, name, category, amount, cycle, next_charge, last_used_on, started_on)
    values (
      v_user,
      r.name,
      r.category,
      r.amount,
      r.cycle::public.billing_cycle,
      v_today + r.in_days,
      v_today - r.idle_days,
      (v_today - make_interval(months => r.age_months))::date
    )
    returning id into v_id;

    if r.old_amount is not null then
      update public.subscription_prices
         set amount = r.old_amount
       where subscription_id = v_id;

      insert into public.subscription_prices (subscription_id, user_id, amount, effective_from)
      values (v_id, v_user, r.amount, (v_today - interval '3 months')::date);
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.seed_demo_subscriptions() to authenticated;
