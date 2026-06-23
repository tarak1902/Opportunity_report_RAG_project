# Codex Project Status

## Current Status
- Monorepo scaffold is complete: `apps/web`, `apps/engine`, `packages/shared`, `supabase/migrations`, CI workflows.
- Web app runs on Next.js with:
  - Auth callback flow
  - Signup gating + waitlist UI
  - Dashboard, report detail, notes/bookmark actions
  - Admin publish + waitlist notify endpoints
- Engine runs on FastAPI + Celery with:
  - Source ingestion (X/Reddit/HN)
  - Chunking, embedding, vector indexing
  - Retrieval + 7-stage generation pipeline
  - Quality gate checks + schema validation
- Supabase migration is implemented with:
  - Core tables (users, subscriptions, seat counter, waitlist, reports, logs, jobs)
  - RLS policies
  - Seat allocation/release and waitlist helper SQL functions
- OpenRouter compatibility added:
  - `OPENAI_BASE_URL` support
  - OpenRouter headers support
  - Model smoke and small batch evaluation executed successfully after normalization hardening.

## Known Constraints / Risks
- Razorpay and Resend are intentionally deferred.
- Prompt pipeline still needs stricter deterministic controls for production-grade consistency at scale.
- Some ingestion modules still rely on fallback behavior when upstream APIs fail.
- Local Next.js startup required SWC handling workaround in this environment.

## Future Project Needs (Priority Order)
- Prompt and model behavior rules finalization:
  - Source weighting
  - Problem selection filters
  - Rejection criteria
  - Output style and evidence requirements
- Prompt eval framework expansion:
  - 20–30+ scenario batch
  - pass/fail rubric per stage
  - regression tracking per prompt version
- Retrieval quality upgrades:
  - stronger metadata filters
  - reranking integration
  - source freshness controls
- Production hardening:
  - robust retry/circuit-breaker telemetry
  - better operational dashboards and alerting
  - stricter API auth/rate-limit posture
- Payments and launch path:
  - Razorpay checkout + webhook lifecycle completion
  - seat release + waitlist auto-notification flow with retries
- Content delivery polish:
  - PDF export watermarking
  - account/billing UX finish
  - final dashboard UX cleanup
- Deployment readiness:
  - staging-to-prod runbook execution
  - rollback validation
  - end-to-end smoke checklist automation

## Immediate Next Step
- Freeze the model behavior specification (your custom rules) before more prompt changes.
