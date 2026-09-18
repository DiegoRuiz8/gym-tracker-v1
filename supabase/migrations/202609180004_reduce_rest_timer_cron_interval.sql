do $$
declare
  delivery_job_id bigint;
begin
  select jobid
  into delivery_job_id
  from cron.job
  where jobname = 'deliver-rest-timer-notifications';

  if delivery_job_id is not null then
    perform cron.alter_job(delivery_job_id, schedule => '2 seconds');
  end if;
end;
$$;
