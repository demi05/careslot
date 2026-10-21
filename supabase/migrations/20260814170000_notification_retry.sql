-- =========================================================
-- Automatic retry for failed notification deliveries (FR3 / NFR4): a
-- notification row stores enough of its own content (subject/body) to be
-- resent without re-deriving it from the triggering appointment event,
-- and retry_count bounds how many times the cron retry route
-- (app/api/cron/retry-notifications) will attempt it before giving up.
-- =========================================================
alter table public.notifications
  add column if not exists retry_count integer not null default 0,
  add column if not exists subject text,
  add column if not exists body text;
