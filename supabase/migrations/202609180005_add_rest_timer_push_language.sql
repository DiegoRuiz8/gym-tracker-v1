alter table public.rest_timer_push_jobs
add column language text not null default 'en'
check (language in ('en', 'es'));
