# AIOS — AI Operating System · Full-Stack Summary

> A multi-agent "AI company" platform. A **CEO agent** delegates goals to **departments** of
> **17 AI employees** who execute configurable **workflows** through background **queues**,
> coordinated by a **manager**, gated by **human approvals**, and observable in real time via a
> React dashboard.

This document summarizes **both** the backend (`server/`) and frontend (`client/`) and ends with a
**gap analysis / suggested features**. Deep-dive docs live in [server/SUMMARY.md](server/SUMMARY.md),
[client/SUMMARY.md](client/SUMMARY.md), and [server/ARCHITECTURE_ANALYSIS.md](server/ARCHITECTURE_ANALYSIS.md).

---

## 1. System at a Glance

```
                          ┌──────────────────────────┐
        React SPA  ◄─────►│   Express REST + Socket.IO│◄──── JWT auth
      (client/, Vite)     └────────────┬─────────────┘
                                       │
                    ┌──────────────────▼───────────────────┐
                    │  CEO → Manager → Departments →         │
                    │  17 AI Employees (plugin registry)     │
                    │  Workflow Engine · Event Bus           │
                    └───────┬───────────────────┬────────────┘
                            │                   │
                   BullMQ queues (17)     Memory system (7 stores)
                            │                   │
                    ┌───────▼────────┐  ┌────────▼─────────┐
                    │ Redis          │  │ MongoDB (19 coll)│
                    └────────────────┘  └──────────────────┘
                            │
                    6 LLM providers (OpenAI · Gemini · Groq · OpenRouter · Mistral · GitHub Models)
```

---

## 2. Backend (`server/`)

**Stack:** Node.js · TypeScript (strict) · Express · MongoDB/Mongoose · Redis · BullMQ · Socket.IO ·
JWT · Zod · Winston · Docker · Jest.

### Core concepts
| Concept | What it does |
|---------|--------------|
| **CEO Agent** | Accepts a goal, auto-detects a workflow, creates a project with all steps. Never does work itself. |
| **Manager** | Orchestrates tasks over BullMQ, resolves dependencies, decides auto-continue vs. approval. |
| **17 Employees** | Research, Planning, Writer, Reviewer, Voice, Image, Video, Editor, Publisher, Analytics, Memory, **SEO, Social/Community, Strategist, Translator, QA/Compliance, Designer** *(new)*. Each is a self-registering plugin extending `BaseEmployee`; queues + workers + departments auto-derive from the registry. |
| **Registries (6)** | Employee · Tool · Provider · Queue · Workflow · Department — everything is discovered, not hardcoded. |
| **Workflow Engine** | 3 JSON-configurable workflows (YouTube, Podcast, Blog) with step deps, approval gates, retries. As of v1.1 each pipeline uses the new employees — Strategist → SEO → … → QA → Publisher → Social (+ Designer in YouTube). Steps can be marked `optional` (failure doesn't block dependents or fail the project). |
| **Event Bus** | Pub/sub for `task:started/completed/failed` decoupling employees from the manager. |
| **Memory System** | 7 stores: Short (1h TTL) · Long · Learning · ExecutionLog (90d) · ProjectHistory · legacy AgentMemory · Knowledge. `MemoryManager.smartRecall()` searches all. |
| **Approvals** | Workflow pauses for human decisions (approve/reject/retry/skip). |
| **Execution Mode** | Company-wide AUTO vs. MANUAL, resolved hierarchically: project → user settings → AUTO. |
| **Scheduler** | Cron-based recurring jobs (create/pause/resume/delete). |
| **Analytics** | Auto-aggregated summary, per-employee performance, cost trends, performance trends. |
| **AI Inspector** *(newest, WIP)* | Per-employee live "cockpit": snapshot of current task, provider/model, tokens, cost, retries, health + streaming logs over Socket.IO rooms. |

### Employee roster (17)
| Employee | Department | Purpose | Key skills |
|----------|-----------|---------|-----------|
| Research | research | Internet research, fact-checking, source verification | internet-research, fact-checking, summarization |
| Planning | management | Task decomposition, estimation, dependency analysis | task-decomposition, estimation |
| Writer | content | Blog posts, scripts, captions, copy | blog, script, copywriting, markdown |
| Reviewer | content | Fact-check, grammar, quality scoring, hallucination detection | fact-checking, grammar, quality-scoring |
| **SEO** *(new)* | content | Keyword research, meta tags, SERP/competitor analysis, on-page scoring | keyword-research, meta-optimization, serp-analysis |
| **Translator** *(new)* | content | Multi-language translation, subtitle & cultural localization | translation, localization, subtitle-translation |
| **QA/Compliance** *(new)* | content | Pre-publish gate: plagiarism, copyright, brand-safety, policy | plagiarism-detection, copyright-check, brand-safety |
| Voice | media | TTS narration, timing, voice selection | tts, narration, audio-timing |
| Image | media | Image generation, prompt engineering, thumbnails | image-generation, prompt-engineering |
| Video | media | Storyboarding, scene planning, production | storyboarding, scene-planning |
| Editor | media | Video editing, subtitling, mixing, transitions | video-editing, subtitling |
| **Designer** *(new)* | media | Thumbnail concepts, layout, brand-consistent design specs | thumbnail-design, brand-identity, visual-consistency |
| Publisher | publishing | Multi-platform publishing, cross-posting | multi-platform-publishing, cross-posting |
| **Social/Community** *(new)* | publishing | Engagement, reply drafting, moderation, post scheduling | engagement, reply-drafting, post-scheduling |
| Analytics | analytics | Metrics tracking, performance, A/B testing, reporting | data-analysis, reporting |
| **Strategist** *(new)* | analytics | Trend detection, content strategy, ideation — decides what to make next | trend-detection, content-strategy, topic-ideation |
| Memory | memory | Knowledge organization, pattern recognition, consolidation | memory-management, pattern-recognition |

> The 6 new employees fill roles that were previously only *sub-skills* of other employees (SEO), or
> missing entirely (community engagement, localization, compliance gating, strategy, brand design).
> Each was added as **one file + one registration line + one barrel import** — no changes to Manager,
> workers, queues, or departments (all auto-derive from the registry). Server typechecks clean.

### Real-time layer (`src/socket.ts` — new)
Socket.IO with JWT handshake auth and room-based fan-out (`project:<id>`, `inspector:<type>`).1
Emits `inspector:updated`, `inspector:log_created`, `inspector:status_changed`, `inspector:performance_updated`.

### API surface (~63 endpoints)
Auth · CEO/Projects/Tasks · Research (legacy) · Approvals · Employees/Departments · Inspector
(`/api/employees/:type/inspector|logs|history|performance`) · **Output retrieval** *(new)*
(`/api/projects/:id/output`, `/api/projects/:id/tasks/:taskId/output`, `/api/projects/:id/documents`) ·
Memory · Scheduler · Analytics · System/Tools/Providers/Workflows · Settings · Health.
Full table in [server/SUMMARY.md](server/SUMMARY.md).

### Content output pipeline *(new)*
Employee execution `output` now flows end-to-end: the worker factory passes `result.output` to
`Manager.onTaskCompleted()`, which persists it on the `Task`. Users retrieve generated content
(blogs, scripts, etc.) via the output endpoints, which join tasks with their `ContentDocument` and
`Knowledge` records and return a per-project summary (`hasOutput`, completed/failed counts). The
client `projectsService` exposes `getOutput`, `getTaskOutput`, and `getDocuments`.

### Data (MongoDB, 19 collections)
`users`, `projects`, `tasks`, `approvals`, `employee_profiles/sessions`, `activity_logs`,
`knowledge`, `documents`, `short/long/learning_memories`, `execution_logs`, `project_history`,
`scheduled_jobs`, `user_settings`, `inspector_snapshots` *(new)*, plus legacy research/report collections.

---

## 3. Frontend (`client/`)

**Stack:** React 19 · TypeScript · Vite · React Router 7 · Zustand 5 · TanStack Query 5 ·
Tailwind 4 · Radix UI · Recharts · React Hook Form + Zod · Framer Motion · Socket.IO client · Axios.

### Pages (21 routes, all lazy-loaded)
Dashboard (Mission Control) · Company org-chart · Projects + detail · Tasks · Employees + detail
(with **Inspector** tab, new) · Departments + detail · Workflows · Analytics · Memory · Scheduler ·
Approvals · Providers · Tools · Queues · Notifications · Settings · Login/Register.

### App architecture
- **`api.ts`** Axios with auth-token injection + automatic 401 refresh & request queuing.
- **Stores:** `auth` (persisted), `theme` (persisted), `app` (sidebar/notifications),
  `execution-mode` (persisted AUTO/MANUAL).
- **Socket lifecycle** tied to auth state in `App.tsx`; Company + Inspector pages subscribe to live events.
- **UI kit:** Button, Card (glassmorphism), Badge, Progress, Skeleton, ErrorBoundary — dark-first theme.

### Notable UI features
- **Company page:** live org chart (CEO → managers → departments → employees) with real-time status,
  demo-mode simulated "thoughts", auto-refresh.
- **Execution Mode:** global toggle in Settings + per-project override + inline approval cards.
- **Mission Control** dashboard strip: mode, employees, running/completed/failed, waiting approvals.

---

## 4. Running It

```bash
# Server
cd server && npm install && cp .env.example .env   # set MONGODB_URI, REDIS_*, JWT_*, AI keys
npm run dev              # or: docker-compose up

# Client
cd client && npm install && npm run dev             # Vite on :5173, proxies /api → :3000
```

**Status:** TypeScript ✅ · existing Jest suite (auth/memory/research) ✅ · Inspector + Socket.IO
feature in progress (uncommitted).

---

## 5. Gap Analysis — Required / Missing Features

Grouped by priority. Items marked ⚠️ are correctness/security gaps, not just enhancements.

### High priority
| # | Area | Gap | Suggested fix |
|---|------|-----|---------------|
| 1 | ⚠️ **Rate limiting** | The architecture doc claims "Rate Limit" but `app.ts` only wires `helmet` + `cors` — there is no `express-rate-limit`. Auth endpoints are brute-forceable. | Add `express-rate-limit` (tight limits on `/api/auth/*`, global default elsewhere). |
| 2 | ⚠️ **CORS + Socket.IO `origin: '*'`** | `socket.ts` allows any origin *with* `credentials: true`, and JWTs are sent in the handshake. | Restrict `origin` to the client URL from env; do the same for Express CORS. |
| 3 | **Real media generation** | Voice/Image/Video/Editor employees produce *metadata/segments only* (e.g. voice computes timings, no actual TTS). Tools like `tts`, `image`, `video`, `youtube`, `instagram` are registered names without real integrations. | Wire real providers (ElevenLabs/OpenAI TTS, DALL·E/SD, ffmpeg, YouTube/Instagram APIs) behind the existing Tool registry. |
| 4 | **Test coverage** | Only 3 test files (auth, memory, research). No tests for workflow engine, manager orchestration, approvals, execution-mode resolution, or the new inspector. | Add unit tests for `WorkflowEngine.resolveExecutionMode`, manager dependency handling, and approval gating; add an integration test for a full workflow run. |
| 5 | **CI/CD** | No `.github/` workflows. | Add GitHub Actions: install → typecheck → lint → test → build for both `client` and `server`. |
| 6 | **Empty root README** | `README.md` is effectively blank (just "AI-LLM"). | Replace with a real quickstart pointing at this `summary.md`. |

### Medium priority
| # | Area | Gap | Suggested fix |
|---|------|-----|---------------|
| 7 | **Streaming LLM output** | Responses are awaited whole; no token streaming to the UI. | Stream via the existing Socket.IO layer (inspector rooms are a natural fit). |
| 8 | **Cost budgets / guardrails** | Costs are *tracked* (analytics/inspector) but nothing *enforces* a ceiling. | Per-project/user budget caps that pause work and raise an approval when exceeded. |
| 9 | **Retry/dead-letter visibility** | BullMQ retries exist but there's no UI for failed/stuck jobs or manual requeue. | Surface a Queues "failed jobs" view with retry/discard actions. |
| 10 | **RBAC** | Users have a `role` but authorization is coarse (auth-guard only). | Enforce role checks on admin routes (providers, settings, scheduler, delete project). |
| 11 | **Secrets handling** | Provider API keys are stored/managed via `/api/providers`; confirm encryption at rest. | Encrypt API keys in Mongo (e.g. AES via a KMS/env key), never return them in responses. |
| 12 | **Notifications backend** | Frontend has a Notifications page + store, but there's no persistent server-side notification model/endpoint. | Add a `notifications` collection + `/api/notifications` + push over Socket.IO. |
| 13 | **File/artifact storage** | Employees "generate files" but there's no object store or download endpoint. | Add S3/MinIO-backed artifact storage with signed download URLs. |

> ✅ **Resolved:** *Output/content retrieval* (previously the top gap) is now implemented —
> task output is persisted and exposed via `/api/projects/:id/output` and consumed by the client.
>
> ✅ **Resolved (critical):** *Workflow dependency resolution* was broken — the engine stored
> dependencies as step ids while the Manager matched task ids, so no multi-step workflow could
> advance past step 0. The engine now remaps step ids → task ids at creation, and the Manager
> honors an `optional` flag on tasks (optional-failed steps no longer deadlock dependents or fail
> the project). This is what makes the 17-employee pipelines actually runnable end-to-end.
>
> ✅ **Resolved:** *6 missing employee roles* (SEO, Social/Community, Strategist, Translator,
> QA/Compliance, Designer) added and wired into the workflows.

### Lower priority / polish
| # | Area | Gap |
|---|------|-----|
| 14 | **Observability** | Winston logs only — no metrics/tracing. Add OpenTelemetry or a `/metrics` (Prometheus) endpoint. |
| 15 | **API docs** | Postman collection exists; add OpenAPI/Swagger generated from Zod schemas. |
| 16 | **Pagination consistency** | Some list endpoints lack cursor/limit params; standardize `PaginatedResponse<T>`. |
| 17 | **Frontend dev backdoor** | Hardcoded pre-authenticated dev user + mock-login fallback in the client — gate strictly behind `import.meta.env.DEV` and never ship in prod builds. |
| 18 | **Workflow authoring UI** | Workflows are JSON in code; a visual builder (drag steps/deps/approvals) would unlock non-devs. |
| 19 | **Multi-tenant / org model** | Everything is per-user; no team/organization boundary for shared projects. |
| 20 | **Accessibility & i18n** | No a11y audit or localization layer on the SPA. |

---

## 6. Suggested Next Step

The two changes with the best safety-to-effort ratio are **#1 rate limiting** and **#2 locking down
CORS/Socket origins** — both are small, isolated edits to `app.ts`/`socket.ts`. After that, **#3 real
media tools** is the feature that turns the impressive orchestration skeleton into a system that
actually ships content end-to-end.
