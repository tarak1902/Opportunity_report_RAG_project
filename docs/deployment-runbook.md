# Deployment Runbook

## 1) Supabase
1. Create staging and production projects.
2. Apply `supabase/migrations/0001_init.sql`.
3. Enable Google and email auth providers.
4. Add service role key and anon key to web + engine environments.

## 2) Web (Vercel)
1. Import repository.
2. Root directory: `apps/web`.
3. Set env vars from `apps/web/.env.example`.
4. Configure Razorpay webhook to `https://<domain>/api/webhooks/razorpay`.

## 3) Engine (Railway)
1. Deploy from `apps/engine/Dockerfile`.
2. Set env vars from `apps/engine/.env.example`.
3. Add Redis URL (Upstash) and Supabase service role key.
4. Start worker and beat processes:
   - `celery -A tasks.celery_app.celery_app worker --loglevel=info`
   - `celery -A tasks.celery_app.celery_app beat --loglevel=info`

## 4) Data Services
1. Create Pinecone index `startup-engine-prod` (dim 1536, cosine).
2. Configure Cloudflare R2 bucket for raw payloads and generated PDFs.

## 5) Release Gate
1. Deploy to staging and run smoke checks.
2. Validate auth, webhook, seat cap, report publish flow.
3. Promote to production.
