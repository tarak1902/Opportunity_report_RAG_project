-- 0001_init.sql
create extension if not exists "pgcrypto";

create type public.app_role as enum ('subscriber', 'admin', 'ops_reviewer');
create type public.subscription_status as enum ('inactive', 'active', 'grace_period', 'paused', 'cancelled');
create type public.report_status as enum ('pending_review', 'published', 'rejected');

create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  full_name text,
  role public.app_role not null default 'subscriber',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seat_counter (
  id integer primary key default 1,
  total_seats integer not null default 500,
  reserved_seats integer not null default 10,
  active_seats integer not null default 0,
  waitlist_hold_ttl_minutes integer not null default 120,
  updated_at timestamptz not null default now(),
  check (id = 1),
  check (total_seats > 0),
  check (reserved_seats >= 0),
  check (active_seats >= 0),
  check (active_seats <= total_seats)
);

insert into public.seat_counter (id) values (1) on conflict (id) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  razorpay_subscription_id text unique,
  status public.subscription_status not null default 'inactive',
  amount_inr integer not null default 500,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_ends_at timestamptz,
  seat_allocated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_single_active_seat
  on public.subscriptions (user_id)
  where seat_allocated = true and status in ('active', 'grace_period');

create table if not exists public.waitlist (
  id bigserial primary key,
  email text not null unique,
  referral_code text,
  notified_at timestamptz,
  seat_hold_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_fifo_idx on public.waitlist (created_at asc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  status public.report_status not null default 'pending_review',
  generated_date date not null default current_date,
  report_json jsonb not null,
  similarity_score numeric(4,3),
  india_relevance_score numeric(4,2),
  created_by uuid references auth.users (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_sources (
  id bigserial primary key,
  report_id uuid not null references public.reports (id) on delete cascade,
  source text not null,
  title text,
  url text not null,
  published_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid not null references public.reports (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, report_id)
);

create table if not exists public.user_notes (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid not null references public.reports (id) on delete cascade,
  note text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, report_id)
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_user_id uuid references auth.users (id),
  action text not null,
  entity text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null,
  payload_url text,
  item_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  week_of date not null,
  status text not null,
  generated_count integer not null default 0,
  approved_count integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.payment_webhook_events (
  id text primary key,
  event_name text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users_profile up
    where up.id = auth.uid()
      and up.role in ('admin', 'ops_reviewer')
  );
$$;

create or replace function public.can_signup()
returns boolean
language plpgsql
security definer
as $$
declare
  seats_available boolean;
begin
  select active_seats < (total_seats - reserved_seats)
    into seats_available
  from public.seat_counter
  where id = 1;
  return coalesce(seats_available, false);
end;
$$;

create or replace function public.allocate_seat(p_user_id uuid, p_subscription_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  s public.seat_counter;
  already_allocated boolean;
begin
  select seat_allocated into already_allocated
  from public.subscriptions
  where id = p_subscription_id and user_id = p_user_id;

  if coalesce(already_allocated, false) then
    return true;
  end if;

  select * into s from public.seat_counter where id = 1 for update;

  if s.active_seats >= (s.total_seats - s.reserved_seats) then
    return false;
  end if;

  update public.subscriptions
  set seat_allocated = true,
      status = case when status = 'inactive' then 'active' else status end,
      updated_at = now()
  where id = p_subscription_id
    and user_id = p_user_id;

  update public.seat_counter
  set active_seats = active_seats + 1,
      updated_at = now()
  where id = 1;

  insert into public.audit_logs (actor_user_id, action, entity, entity_id, metadata)
  values (p_user_id, 'seat_allocated', 'subscription', p_subscription_id::text, jsonb_build_object('user_id', p_user_id));

  return true;
end;
$$;

create or replace function public.release_seat(p_user_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  released_count integer;
begin
  update public.subscriptions
  set seat_allocated = false,
      status = case when status in ('active', 'grace_period') then 'cancelled' else status end,
      updated_at = now()
  where user_id = p_user_id and seat_allocated = true;

  get diagnostics released_count = row_count;

  if released_count > 0 then
    update public.seat_counter
    set active_seats = greatest(active_seats - released_count, 0),
        updated_at = now()
    where id = 1;

    insert into public.audit_logs (actor_user_id, action, entity, entity_id, metadata)
    values (p_user_id, 'seat_released', 'user', p_user_id::text, '{}'::jsonb);
  end if;

  return released_count > 0;
end;
$$;

create or replace function public.enqueue_waitlist(p_email text, p_referral_code text default null)
returns bigint
language plpgsql
security definer
as $$
declare
  waitlist_id bigint;
begin
  insert into public.waitlist (email, referral_code)
  values (lower(trim(p_email)), p_referral_code)
  on conflict (email)
  do update set referral_code = excluded.referral_code
  returning id into waitlist_id;

  return waitlist_id;
end;
$$;

create or replace function public.hold_next_waitlist_seat()
returns table (waitlist_id bigint, email text, hold_expires_at timestamptz)
language plpgsql
security definer
as $$
declare
  hold_minutes integer;
begin
  select waitlist_hold_ttl_minutes into hold_minutes from public.seat_counter where id = 1;

  return query
  with next_wait as (
    select w.id, w.email
    from public.waitlist w
    where w.notified_at is null
      or (w.seat_hold_expires_at is not null and w.seat_hold_expires_at < now())
    order by w.created_at asc
    limit 1
    for update skip locked
  )
  update public.waitlist w
  set notified_at = now(),
      seat_hold_expires_at = now() + make_interval(mins => hold_minutes)
  from next_wait nw
  where w.id = nw.id
  returning w.id, w.email, w.seat_hold_expires_at;
end;
$$;

alter table public.users_profile enable row level security;
alter table public.subscriptions enable row level security;
alter table public.waitlist enable row level security;
alter table public.reports enable row level security;
alter table public.report_sources enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ingestion_jobs enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.seat_counter enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy "users can read own profile"
  on public.users_profile for select using (id = auth.uid() or public.is_admin());

create policy "users update own profile"
  on public.users_profile for update using (id = auth.uid());

create policy "subscriptions own"
  on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());

create policy "subscriptions insert own"
  on public.subscriptions for insert with check (user_id = auth.uid() or public.is_admin());

create policy "subscriptions update own"
  on public.subscriptions for update using (user_id = auth.uid() or public.is_admin());

create policy "waitlist insert open"
  on public.waitlist for insert with check (true);

create policy "waitlist select admin"
  on public.waitlist for select using (public.is_admin());

create policy "reports read published"
  on public.reports for select using (
    status = 'published' and auth.uid() is not null or public.is_admin()
  );

create policy "reports admin mutate"
  on public.reports for all using (public.is_admin()) with check (public.is_admin());

create policy "report_sources read published"
  on public.report_sources for select using (
    exists (select 1 from public.reports r where r.id = report_sources.report_id and (r.status = 'published' or public.is_admin()))
  );

create policy "bookmarks own all"
  on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user_notes own all"
  on public.user_notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "audit_logs admin read"
  on public.audit_logs for select using (public.is_admin());

create policy "ingestion_jobs admin read"
  on public.ingestion_jobs for select using (public.is_admin());

create policy "generation_jobs admin read"
  on public.generation_jobs for select using (public.is_admin());

create policy "seat_counter read all authed"
  on public.seat_counter for select using (auth.uid() is not null);

create policy "seat_counter admin update"
  on public.seat_counter for update using (public.is_admin());

create policy "webhook events admin read"
  on public.payment_webhook_events for select using (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_profile_updated_at
before update on public.users_profile
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users_profile (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'subscriber'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
