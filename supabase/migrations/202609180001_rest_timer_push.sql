create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rest_timer_push_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions (id) on delete cascade,
  session_id text not null,
  timer_key text not null,
  due_at timestamptz not null,
  title text not null,
  body text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'processing', 'delivered', 'cancelled', 'failed')),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, session_id)
);

create index rest_timer_push_jobs_due_at_idx
  on public.rest_timer_push_jobs (status, due_at);

alter table public.push_subscriptions enable row level security;
alter table public.rest_timer_push_jobs enable row level security;

create or replace function public.claim_due_rest_timer_push_jobs(batch_size integer default 100)
returns setof public.rest_timer_push_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rest_timer_push_jobs
  set status = 'scheduled', updated_at = now()
  where status = 'processing'
    and updated_at < now() - interval '1 minute';

  return query
  with due_jobs as (
    select id
    from public.rest_timer_push_jobs
    where status = 'scheduled'
      and due_at <= now()
    order by due_at
    for update skip locked
    limit greatest(1, least(batch_size, 100))
  )
  update public.rest_timer_push_jobs as jobs
  set status = 'processing', updated_at = now()
  from due_jobs
  where jobs.id = due_jobs.id
  returning jobs.*;
end;
$$;

revoke all on function public.claim_due_rest_timer_push_jobs(integer) from public;
grant execute on function public.claim_due_rest_timer_push_jobs(integer) to service_role;
