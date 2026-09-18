create or replace function public.ensure_rest_timer_delivery_cron()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'deliver-rest-timer-notifications'
  ) then
    return;
  end if;

  perform cron.schedule(
    'deliver-rest-timer-notifications',
    '2 seconds',
    $delivery_job$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'liftlog_project_url') || '/functions/v1/deliver-rest-timer-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'liftlog_publishable_key'),
          'x-rest-timer-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'liftlog_rest_timer_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      );
    $delivery_job$
  );
end;
$$;

create or replace function public.stop_rest_timer_delivery_cron_if_idle()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  delivery_job_id bigint;
begin
  if exists (
    select 1
    from public.rest_timer_push_jobs
    where status in ('scheduled', 'processing')
  ) then
    return;
  end if;

  select jobid
  into delivery_job_id
  from cron.job
  where jobname = 'deliver-rest-timer-notifications';

  if delivery_job_id is not null then
    perform cron.unschedule(delivery_job_id);
  end if;
end;
$$;

revoke all on function public.ensure_rest_timer_delivery_cron() from public;
revoke all on function public.stop_rest_timer_delivery_cron_if_idle() from public;
grant execute on function public.ensure_rest_timer_delivery_cron() to service_role;
grant execute on function public.stop_rest_timer_delivery_cron_if_idle() to service_role;
