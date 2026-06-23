# Owner Setup Checklist

This project is scaffolded and partially integrated. Complete the checklist below, then we can finish live integration and deployment.

## 1) Supabase
- Create one Supabase project for `staging` and one for `production`.
- In each project:
  - Enable Auth providers: `Google` and `Email`.
  - Add redirect URL: `https://<your-domain>/api/auth/callback`.
  - Run migration file: `supabase/migrations/0001_init.sql`.
- Collect and store:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## 2) OpenAI
- Create API key with access to:
  - `gpt-4o`
  - `gpt-4o-mini`
  - `text-embedding-3-small`
- Set in engine env:
  - `OPENAI_API_KEY`
  - (optional) override model names in `.env`

## 3) Pinecone
- Create index `startup-engine-prod` with:
  - dimensions: `1536`
  - metric: `cosine`
- Set:
  - `PINECONE_API_KEY`
  - `PINECONE_INDEX=startup-engine-prod`

## 4) Redis (Upstash)
- Create Redis database.
- Set:
  - `UPSTASH_REDIS_URL`

## 5) Razorpay
- Create monthly subscription plan at INR `500`.
- Configure webhook endpoint:
  - `POST https://<your-domain>/api/webhooks/razorpay`
- Subscribe to events:
  - `subscription.created`
  - `payment.captured`
  - `payment.failed`
  - `subscription.cancelled`
- Set:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_WEBHOOK_SECRET`

## 6) Email (Resend, optional but recommended)
- Create Resend API key and verified sender domain/email.
- Set:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

## 7) Local Run
- Install Node dependencies at repo root.
- Install Python dependencies:
  - `pip install -r apps/engine/requirements.txt`
- Start web:
  - `npm run -w apps/web dev`
- Start engine:
  - `cd apps/engine && uvicorn main:app --reload --port 8000`

## 8) Worker/Beat
- Start Celery worker:
  - `cd apps/engine && celery -A tasks.celery_app.celery_app worker --loglevel=info`
- Start Celery beat:
  - `cd apps/engine && celery -A tasks.celery_app.celery_app beat --loglevel=info`

## 9) Smoke Tests
- Open landing page and verify seat counter.
- Sign in with Google.
- Create subscription row from settings.
- Trigger webhook test from Razorpay dashboard.
- Run engine endpoints:
  - `GET /health`
  - `POST /ingest/source/reddit`
  - `POST /pipeline/generate-weekly`
- Confirm reports appear in dashboard.
