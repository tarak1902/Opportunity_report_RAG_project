# India Startup Opportunity Engine — CLAUDE.md

Project root: `ideabrowser1/`
Web app: `apps/web/` (Next.js 14 App Router)
AI engine: `apps/engine/` (Python, FastAPI + Celery)

---

## Environment Variables

### `apps/web/.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
APP_URL=http://localhost:3000
ENGINE_URL=http://localhost:8000
```

### `apps/engine/.env`
```
OPENAI_API_KEY=<your-openrouter-key>
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=openai/gpt-4o-mini
PINECONE_API_KEY=<your-pinecone-key>
PINECONE_INDEX=startup-signals
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
REDDIT_CLIENT_ID=<optional>
REDDIT_CLIENT_SECRET=<optional>
TWITTER_BEARER_TOKEN=<optional — needed for X/Twitter ingestion>
CELERY_BROKER_URL=redis://localhost:6379/0
# Production: replace with Upstash Redis URL
# CELERY_BROKER_URL=rediss://:password@host:port/0
```

---

## Supabase Schema (required tables)

| Table | Purpose |
|---|---|
| `users_profile` | `id`, `email`, `full_name`, `role` (`user`/`admin`/`ops_reviewer`) |
| `subscriptions` | `id`, `user_id`, `status` (`active`/`inactive`/`grace`), `plan` |
| `seat_counter` | Single row `id=1`: `active_seats`, `total_seats`, `reserved_seats` |
| `reports` | `id`, `title`, `category`, `generated_date`, `status`, `report_json`, `similarity_score`, `india_relevance_score` |
| `report_sources` | `report_id`, `source`, `title`, `url`, `published_date` |
| `bookmarks` | `user_id`, `report_id` — unique on `(user_id, report_id)` |
| `user_report_notes` | `user_id`, `report_id`, `note` |
| `waitlist` | `email`, `created_at`, `notified_at` |
| `audit_logs` | `actor_user_id`, `action`, `entity`, `entity_id`, `metadata` |
| `ingestion_jobs` | `id`, `source`, `status`, `started_at`, `finished_at`, `error_message` |

### Required SQL function
```sql
-- allocate_seat: increments active_seats atomically, returns false if full
create or replace function allocate_seat(p_user_id uuid, p_subscription_id uuid)
returns boolean language plpgsql security definer as $$
declare v_ok boolean;
begin
  update seat_counter set active_seats = active_seats + 1
  where id = 1 and active_seats < (total_seats - reserved_seats)
  returning true into v_ok;
  return coalesce(v_ok, false);
end; $$;
```

### Required DB trigger (runs on new Supabase Auth user)
```sql
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into users_profile(id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user')
  on conflict(id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();
```

---

## Auth Flow

1. User visits `/signup` → fills name + email + password → `supabase.auth.signUp()` with `data: { full_name }`
2. Supabase sends confirmation email; after confirmation → `/api/auth/callback?next=/dashboard`
3. No-subscription users in `/dashboard` middleware → redirect to `/dashboard/settings?setup=1`
4. User clicks "Activate Access" → `POST /api/billing/create-subscription`
5. Server creates `active` subscription + calls `allocate_seat()` RPC; increments `seat_counter.active_seats`
6. Google OAuth also supported via `signInWithOAuth({ provider: "google" })`

---

## Module Completion Status

### Web App (`apps/web`)
- [x] Auth — email+password signup/login, Google OAuth, email confirmation
- [x] Seat system — `seat_counter` updated via `allocate_seat()` RPC; `/api/seats/status`
- [x] Subscription — create-subscription route with seat allocation + rollback
- [x] Middleware — session guard, subscription check (exempts `/dashboard/settings`), admin guard
- [x] Navbar — shows user email, admin badge, sign-out
- [x] Landing page (`/`) — auth-aware, seat counter progress bar
- [x] Signup page (`/signup`) — seats-available badge, seats-full state
- [x] Login page (`/login`) — password login + Google OAuth
- [x] Dashboard (`/dashboard`) — published reports list
- [x] Report detail (`/dashboard/reports/[id]`) — full sections + sources + bookmark/notes
- [x] Dashboard bookmarks (`/dashboard/bookmarks`) — user's saved reports
- [x] Account settings (`/dashboard/settings`) — subscription status, activate access
- [x] Admin layout — auth + role guard (`admin` / `ops_reviewer`)
- [x] Admin overview (`/admin`) — pending/published/rejected counts + pending list
- [x] Admin reports (`/admin/reports`) — tabbed: pending / published / rejected
- [x] Admin users (`/admin/users`) — user list + role management
- [x] Admin pipeline (`/admin/pipeline`) — trigger ingestion + generation jobs
- [x] Admin logs (`/admin/logs`) — ingestion job history
- [x] Admin sidebar navigation
- [x] API: `GET /api/admin/reports` — reports by status
- [x] API: `PATCH /api/admin/reports/[id]` — approve/reject report
- [x] API: `GET /api/admin/users` — all users
- [x] API: `PATCH /api/admin/users/[id]` — change user role
- [x] API: `POST /api/admin/pipeline/trigger` — trigger engine job
- [x] API: `POST /api/admin/waitlist/notify-next` — notify next waitlist user
- [x] API: `POST /api/reports/[id]/bookmark` — add bookmark
- [x] API: `DELETE /api/reports/[id]/bookmark` — remove bookmark
- [x] API: `POST/PATCH /api/reports/[id]/notes` — save note

### AI Engine (`apps/engine`)
- [x] Reddit + HN scrapers (no API key required)
- [x] Twitter/X scraper (requires `TWITTER_BEARER_TOKEN`)
- [x] Signal processor + deduplication
- [x] 6-stage LLM pipeline (OpenRouter): signal detection → thesis → market → feasibility → execution → fact verification
- [x] Pinecone RAG: embed signals → upsert → similarity retrieval
- [x] Celery beat schedule: Reddit/HN every 6h, X every 12h
- [ ] Production Redis (currently uses localhost:6379)
- [ ] Twitter Bearer Token configured

---

## Known Issues / TODOs

1. **Celery Redis** — `CELERY_BROKER_URL` defaults to `redis://localhost:6379/0`. For production, replace with Upstash Redis URL.
2. **Twitter scraper** — disabled until `TWITTER_BEARER_TOKEN` is set.
3. **Razorpay webhook** (`/api/webhooks/razorpay`) — skeleton only; implement signature verification + subscription update when payment is enabled.
4. **Rate limiting** — API routes have no rate limiting yet; add before public launch.

---

## Key Design Decisions

- Admin client (`SUPABASE_SERVICE_ROLE_KEY`) used only in server-side API routes — never exposed to client
- `allocate_seat()` uses `security definer` to prevent RLS bypass by regular users
- `/dashboard/settings` is exempt from subscription check to avoid infinite redirect loop
- Report `status` values: `pending_review` → `published` or `rejected`
- `report_json` is unstructured JSONB — LLM output varies by pipeline version
