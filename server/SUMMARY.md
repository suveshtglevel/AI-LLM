# AI Operating System (AIOS) — Project Summary

> **127 TypeScript files** | **MongoDB** | **Redis + BullMQ** | **Express.js** | **Docker**

---

## 🏗️ Architecture Overview

```
User / API
    │
┌───▼──────────────────────────────────────────────────────┐
│                    EXPRESS API LAYER                       │
│  25+ endpoints · JWT Auth · Zod Validation · Rate Limit   │
└───────────────────────────┬──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│                    ORCHESTRATION LAYER                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                    CEO AGENT                      │   │
│  │  Delegates goals to WorkflowEngine or Manager     │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │                                  │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │           WORKFLOW ENGINE (Configurable)          │   │
│  │  3 workflows: YouTube, Podcast, Blog Post         │   │
│  │  Step deps · Approval gates · Retry policies      │   │
│  └────┬──────────┬──────────┬──────────┬────────────┘   │
│       │          │          │          │                 │
│  ┌────▼──┐  ┌────▼──┐ ┌────▼──┐ ┌────▼──┐              │
│  │Research│  │ Writer│ │ Voice │ │Publisher│  ... 11     │
│  │Dept    │  │Dept   │ │Dept   │ │Dept     │  Employees  │
│  └───┬───┘  └───┬───┘ └───┬───┘ └───┬────┘              │
│      │           │         │          │                   │
│  ┌───▼───────────▼─────────▼──────────▼────┐             │
│  │              EVENT BUS                  │             │
│  │  task:started · task:completed · failed  │             │
│  └───────────────────┬────────────────────┘             │
│                      │                                   │
│  ┌───────────────────▼────────────────────┐             │
│  │           REGISTRY LAYER               │             │
│  │  Employee · Tool · Provider · Queue    │             │
│  │  Workflow · Department (6 registries)  │             │
│  └───────────────────┬────────────────────┘             │
│                      │                                   │
└──────────────────────┼──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   INFRASTRUCTURE                         │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ MongoDB  │  │  Redis   │  │ BullMQ   │               │
│  │ (18 coll)│  │ (cache)  │  │ (11 queues)              │
│  └──────────┘  └──────────┘  └──────────┘               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           MEMORY SYSTEM (7 stores)               │   │
│  │  Short · Long · Learning · Execution · History   │   │
│  │  AgentMemory (legacy) · Knowledge                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            PROVIDER LAYER (6 providers)          │   │
│  │  OpenAI · Gemini · Groq · OpenRouter · Mistral   │   │
│  │  GitHub Models · Auto-fallback · Health checks   │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 📦 What the System Can Do

### 1. 🧠 AI Workforce — 11 Plug-and-Play Employees

| Employee | Department | Skills | Tools |
|----------|-----------|--------|-------|
| **Research** | Research | internet-research, fact-checking, verification, summarization, source-analysis | web-search, content-extractor, summarization, analysis |
| **Planning** | Management | task-decomposition, estimation, dependency-analysis, resource-planning | analysis |
| **Writer** | Content | blog, seo, script, email, copywriting, markdown | summarization |
| **Reviewer** | Content | fact-checking, grammar, seo-audit, quality-scoring, hallucination-detection | analysis |
| **Voice** | Media | tts, narration, audio-timing, voice-selection | tts |
| **Image** | Media | image-generation, prompt-engineering, illustration, thumbnail-design | image |
| **Video** | Media | storyboarding, scene-planning, video-production, timing | video, image |
| **Editor** | Media | video-editing, subtitling, audio-mixing, transitions, color-grading | video |
| **Publisher** | Publishing | multi-platform-publishing, social-media, hashtag-optimization, cross-posting | youtube, instagram, publisher |
| **Analytics** | Analytics | data-analysis, metrics-tracking, performance-optimization, a-b-testing, reporting | analysis |
| **Memory** | Memory | memory-management, knowledge-organization, pattern-recognition, data-consolidation | — |

**Adding new employees:** Create 1 file → Register it. No core code changes.

### 2. 🔧 Tool System — Pluggable Execution

Tools are registered at startup and employees request them by name:
- **web-search** — Internet source discovery
- **content-extractor** — Webpage content extraction
- **summarization** — AI document summarization
- **analysis** — Data analysis and insight extraction

Future tools (browser, scraper, youtube, instagram, tts, image, video, github, news, reddit, weather) are architecturally supported — just create + register.

### 3. 🤖 AI Provider Layer — 6 Providers with Auto-Fallback

| Provider | Status | Env Var |
|----------|--------|---------|
| **OpenAI** | ✅ Default | `OPENAI_API_KEY` |
| **Gemini** | ✅ Available | `GEMINI_API_KEY` |
| **Groq** | ✅ Available | `GROQ_API_KEY` |
| **OpenRouter** | ✅ Available | `OPENROUTER_API_KEY` |
| **Mistral** | ✅ Available | `MISTRAL_API_KEY` |
| **GitHub Models** | ✅ Available | `GITHUB_MODELS_API_KEY` |

Switch with `AI_PROVIDER=groq` env var. Auto-falls back to first configured provider.

### 4. 📋 Configurable Workflows — 3 Built-in

| Workflow | Steps | Approvals | Est. Time |
|----------|-------|-----------|-----------|
| **YouTube Video** | Research → Plan → Write → **Review ✓** → Voice → Image → Video → Edit → **Publish ✓** | 2 (review, publish) | 45 min |
| **Podcast** | Research → Write → **Review ✓** → Voice → **Publish ✓** | 2 (review, publish) | 30 min |
| **Blog Post** | Research → Write → Review → Image → **Publish ✓** | 1 (publish) | 20 min |

Workflows are JSON-configurable. Add new ones without code changes.

### 5. 👤 Human Approval System

Tasks requiring approval pause the workflow and wait:
- `GET /api/approvals/pending` — See waiting approvals
- `POST /api/approvals/:id/decide` — Approve or reject with comment
- `GET /api/approvals/count` — Pending count badge

### 6. 🏢 Department System with Skill Routing

6 departments auto-discovered from employee registrations: Research, Content, Media, Publishing, Analytics, Memory.

Skill-based task matching (opt-in):
1. Try preferred employee type
2. Search department for skill match
3. Search all employees for best match

### 7. 💾 Memory System — 7 Specialized Stores

| Store | Purpose | TTL |
|-------|---------|-----|
| **ShortMemory** | Recent task context, working data | 1 hour (auto-pruned) |
| **LongMemory** | User preferences, verified facts | Permanent |
| **LearningMemory** | Behavioral patterns, improvements | Permanent |
| **ExecutionLog** | Timing, tokens, costs, errors | 90 days |
| **ProjectHistory** | Event timeline, milestones | Permanent |
| AgentMemory (legacy) | Backward compat with old system | 30 days |
| Knowledge | Documented facts and references | Permanent |

`MemoryManager.smartRecall()` searches all stores at once.

### 8. ⏰ Scheduler — Cron-Based Recurring Jobs

Create recurring tasks with cron expressions:
- `0 9 * * *` — Daily at 9am
- `0 9 * * 1` — Weekly on Monday
- `0 9 1 * *` — Monthly on 1st

CRUD endpoints: `GET/POST/PUT/DELETE /api/scheduler`

### 9. 📊 Analytics — Automatic Metrics

Aggregation across all executions:
- **Summary** — Task stats, project stats, error rates
- **Employee performance** — Per-employee metrics: avg duration, success rate, costs
- **Cost trends** — Daily AI cost tracking over 30 days
- **Performance trends** — Execution time and success rate over 7 days

### 10. ⚙️ Execution Mode — Manual / Automatic

A company-wide execution mode system controlling workflow automation:

| Mode | Behavior |
|------|----------|
| **Automatic** (AUTO) | Employees execute tasks and auto-continue to next step. No approval required unless explicitly set in workflow definition. |
| **Manual** (MANUAL) | Every step pauses for human approval before the next employee can start. User can Approve, Reject, Retry, or Skip. |

**Hierarchical resolution**: `Project.executionMode` → `UserSettings.executionMode` → AUTO
- Global setting stored in `user_settings` collection per user
- Per-project override via `PATCH /api/projects/:id/execution-mode`
- `null` on project = inherit global default

**Backend architecture**:
- `WorkflowEngine.resolveExecutionMode()` resolves effective mode from project → user settings → AUTO
- In MANUAL mode: ALL workflow steps create approval records (not just explicitly marked `approvalRequired: true`)
- `Manager.onTaskCompleted()` checks mode before auto-queuing next tasks; creates approvals in MANUAL mode
- Architecture supports future modes (Semi-Automatic, Scheduled, Human-in-the-Loop, etc.) without breaking changes

### 11. 🎯 Goal Delegation (CEO)

```
POST /api/ceo/delegate
{
  "title": "Create AI explainer video",
  "goal": "Make a YouTube video explaining transformer architecture",
  "workflowType": "youtube-video"  // optional — auto-detected
}
```

CEO auto-detects workflow from goal text → creates project with all steps → waits for approvals → reports completion.

---

## 🗺️ API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |

### CEO & Projects
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ceo/delegate` | Delegate goal (with optional workflow) |
| GET | `/api/ceo/status/:projectId` | Get project + task status |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Get project details |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/tasks` | List tasks (filter by project/status) |
| GET | `/api/tasks/:id` | Get task details |

### Research (Legacy)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/research/tasks` | Direct research task |
| GET | `/api/research/tasks` | List research tasks |
| GET | `/api/research/reports/:taskId` | Get research report |

### Approvals
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/approvals/pending` | List pending approvals |
| GET | `/api/approvals/count` | Get pending count |
| POST | `/api/approvals/:id/decide` | Approve/reject |

### System Discovery
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/employees` | List all employees (filter by department/skill) |
| GET | `/api/employees/:type` | Get employee details |
| GET | `/api/departments` | List all departments |
| GET | `/api/departments/:id` | Get department details |
| GET | `/api/departments/:id/employees` | Get department employees |
| GET | `/api/tools` | List registered tools |
| GET | `/api/providers` | List providers with health checks |
| GET | `/api/workflows` | List workflows with step details |
| GET | `/api/system/status` | Full system health overview |

### Memory
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/memory/status` | Memory store statistics |
| GET | `/api/memory/long` | List long-term memories |
| POST | `/api/memory/long` | Store long-term memory |
| GET | `/api/memory/long/:key` | Recall specific memory |
| GET | `/api/memory/learning` | List learning patterns |
| GET | `/api/memory/executions` | Execution history |
| GET | `/api/memory/history/:projectId` | Project timeline |
| POST | `/api/memory/history/:projectId` | Add timeline event |
| GET | `/api/memory/search` | Smart search all stores |

### Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics` | Available endpoints |
| GET | `/api/analytics/summary` | Full analytics summary |
| GET | `/api/analytics/employees` | Per-employee performance |
| GET | `/api/analytics/costs` | Cost trends (default 30 days) |
| GET | `/api/analytics/performance` | Execution trends (default 7 days) |

### Scheduler
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/scheduler` | List scheduled jobs |
| POST | `/api/scheduler` | Create scheduled job |
| GET | `/api/scheduler/:id` | Get job details |
| POST | `/api/scheduler/:id/pause` | Pause job |
| POST | `/api/scheduler/:id/resume` | Resume job |
| DELETE | `/api/scheduler/:id` | Delete job |

### Settings
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/settings/execution-mode` | Get global execution mode (AUTO/MANUAL) |
| PATCH | `/api/settings/execution-mode` | Update global execution mode |

### Project Execution Mode
| Method | Route | Description |
|--------|-------|-------------|
| PATCH | `/api/projects/:id/execution-mode` | Override execution mode for a specific project |

### Health
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Server health check |

---

## 📁 Project Structure

```
src/
├── app.ts                          # Express app setup, middleware, routes
├── server.ts                       # Server bootstrap, DB/Redis/Worker startup
├── types/index.ts                  # Shared TypeScript types
├── utils/
│   ├── helpers.ts                  # Utility functions
│   └── jwt.ts                      # JWT token helpers
│
├── config/
│   ├── env.ts                      # Environment variables (Zod validated)
│   ├── database.ts                 # MongoDB connection
│   ├── redis.ts                    # Redis connection
│   └── logger.ts                   # Winston logger
│
├── middleware/
│   ├── auth.middleware.ts          # JWT authentication
│   ├── error-handler.ts            # Global error handler
│   └── validate.ts                 # Zod validation middleware
│
├── features/                       # Feature-based modules ▼
│   ├── approvals/                  # Human approval system
│   │   ├── approval.model.ts       # Approval MongoDB schema
│   │   ├── approval.routes.ts      # GET/POST /api/approvals
│   │   └── approval.validation.ts  # Zod schemas
│   │
│   ├── analytics/
│   │   └── analytics.routes.ts     # GET /api/analytics/*
│   │
│   ├── ceo/
│   │   ├── ceo.model.ts            # CEO agent logic
│   │   ├── ceo.routes.ts           # POST /api/ceo/delegate
│   │   └── ceo.validation.ts       # Zod schemas
│   │
│   ├── departments/
│   │   ├── department.registry.ts  # Auto-discovers departments
│   │   ├── department.routes.ts    # GET /api/departments
│   │   └── employee.routes.ts      # GET /api/employees
│   │
│   ├── employees/                  # 11 AI Employees ▼
│   │   ├── base-employee.model.ts  # Abstract base class
│   │   ├── employee.model.ts       # Session, Profile, Activity models
│   │   ├── index.ts                # Barrel import for registration
│   │   ├── research/               # Research Employee
│   │   ├── planning/               # Planning Employee
│   │   ├── writer/                 # Writer Employee
│   │   ├── reviewer/               # Reviewer Employee
│   │   ├── voice/                  # Voice Employee
│   │   ├── image/                  # Image Employee
│   │   ├── video/                  # Video Employee
│   │   ├── editor/                 # Editor Employee
│   │   ├── publisher/              # Publisher Employee
│   │   ├── analytics/              # Analytics Employee
│   │   └── memory/                 # Memory Employee
│   │
│   ├── manager/
│   │   └── manager.model.ts        # Task orchestration logic
│   │
│   ├── memory/                     # 5 specialized memory stores ▼
│   │   ├── short-memory.model.ts   # Task context, 1h TTL
│   │   ├── long-memory.model.ts    # Persistent preferences/facts
│   │   ├── learning-memory.model.ts# Behavioral patterns
│   │   ├── execution-log.model.ts  # Timing, costs, errors
│   │   ├── project-history.model.ts# Timeline, milestones
│   │   └── memory.routes.ts        # GET /api/memory/*
│   │
│   ├── projects/
│   │   ├── project.model.ts        # Project MongoDB schema
│   │   ├── task.model.ts           # Task MongoDB schema
│   │   ├── knowledge.model.ts      # Knowledge + Document schemas
│   │   ├── project.routes.ts       # Project/Task CRUD
│   │   └── project.validation.ts   # Zod schemas
│   │
│   ├── scheduler/
│   │   ├── scheduler.model.ts      # Scheduled job schema
│   │   ├── scheduler.routes.ts     # GET/POST /api/scheduler
│   │   └── scheduler.validation.ts # Zod schemas
│   │
│   ├── settings/                   # Execution Mode settings
│   │   ├── settings.model.ts       # UserSettings: global executionMode (AUTO/MANUAL)
│   │   ├── settings.routes.ts      # GET/PATCH /api/settings/execution-mode
│   │   └── settings.validation.ts  # Zod schemas
│   │
│   └── system/                     # Dashboard APIs ▼
│       ├── system.routes.ts        # GET /api/system/status
│       ├── tools.routes.ts         # GET /api/tools
│       ├── providers.routes.ts     # GET /api/providers
│       └── workflows.routes.ts     # GET /api/workflows
│
├── modules/                        # Original modules (preserved)
│   ├── agents/
│   │   ├── agent.framework.ts      # Agent framework
│   │   ├── research.agent.ts       # Research agent
│   │   └── tools/                  # 4 tools (web-search, extractor, etc.)
│   ├── auth/                       # Auth module
│   ├── memory/
│   │   └── memory.model.ts         # Legacy AgentMemory
│   ├── reports/                    # Research report module
│   └── research/                   # Research task module
│
├── providers/                      # 6 LLM providers ▼
│   ├── base.provider.ts            # Abstract provider class
│   ├── openai.provider.ts          # OpenAI (auto-registered)
│   ├── gemini.provider.ts          # Gemini (auto-registered)
│   ├── groq.provider.ts            # Groq (auto-registered)
│   ├── openrouter.provider.ts      # OpenRouter (auto-registered)
│   ├── mistral.provider.ts         # Mistral (auto-registered)
│   └── github-models.provider.ts   # GitHub Models (auto-registered)
│
├── queues/                         # BullMQ queues
│   ├── queue.service.ts            # Queue + Worker factory
│   └── *.queue.ts                  # 11 queue definitions
│
├── registries/                     # Plugin registries ▼
│   ├── employee.registry.ts        # Employee plugin system
│   ├── tool.registry.ts            # Tool plugin system
│   ├── provider.registry.ts        # Provider plugin system
│   └── queue.registry.ts           # Queue auto-creation
│
├── services/                       # Business logic services ▼
│   ├── ai/ai.service.ts            # AI Service (provider-agnostic)
│   ├── analytics.service.ts        # Analytics aggregation
│   ├── event-bus.ts                # Task event pub/sub
│   ├── memory-manager.ts           # Memory orchestrator
│   ├── scheduler.service.ts        # Cron job scheduler
│   └── skill-matcher.ts            # Skill-based task routing
│
├── workers/                        # BullMQ workers
│   ├── worker.factory.ts           # Generic worker factory
│   ├── research.worker.ts          # Research (dual-flow, preserved)
│   └── planning.worker.ts          # Planning (special logic)
│
└── workflows/                      # Configurable workflows ▼
    ├── workflow.types.ts           # Workflow interfaces
    ├── workflow.registry.ts        # Workflow registration
    ├── workflow.engine.ts          # Workflow execution engine
    ├── index.ts                    # Barrel import
    └── definitions/                # 3 workflow definitions
        ├── youtube-video.workflow.ts
        ├── podcast.workflow.ts
        └── blog-post.workflow.ts
```

---

## 🗄️ Database Collections (MongoDB)

| Collection | Source | Purpose |
|-----------|--------|---------|
| `users` | Auth module | User accounts |
| `agent_memories` | Legacy memory | Conversations, facts, patterns |
| `research_sources` | Research module | Extracted web content |
| `research_reports` | Reports module | Structured research reports |
| `employee_profiles` | Employee system | Employee configs |
| `employee_sessions` | Employee system | Runtime execution sessions |
| `activity_logs` | Employee system | Execution activity records |
| `projects` | Project system | Goal projects |
| `tasks` | Project system | Individual tasks with deps |
| `knowledge` | Knowledge system | Documented facts |
| `documents` | Knowledge system | Generated content docs |
| `approvals` | Approval system | Human approval requests |
| `short_memories` | Memory system | Recent context (TTL auto-pruned) |
| `long_memories` | Memory system | Persistent knowledge |
| `learning_memories` | Memory system | Behavioral patterns |
| `execution_logs` | Memory system | Execution history |
| `project_history` | Memory system | Timeline events |
| `scheduled_jobs` | Scheduler | Recurring job configs |
| `user_settings` | Settings | Global execution mode per user (AUTO/MANUAL) |

---

## 🔧 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Node.js** | Runtime |
| **TypeScript** | Language (strict mode) |
| **Express.js** | Web framework |
| **MongoDB + Mongoose** | Primary database (18 collections) |
| **Redis + ioredis** | Caching, BullMQ backend |
| **BullMQ** | Background job queues (11 queues) |
| **JWT** | Authentication |
| **Zod** | Request validation |
| **Winston** | Logging |
| **Docker** | Containerization |
| **Jest** | Testing |

---

## 🔐 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/aios

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Provider
AI_PROVIDER=openai          # openai | gemini | groq | openrouter | mistral | github
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
MISTRAL_API_KEY=
GITHUB_MODELS_API_KEY=
```

---

## ✅ What Makes This Different from a Chatbot

| Capability | Chatbot | AIOS |
|-----------|---------|------|
| Task decomposition | ❌ | ✅ Workflow Engine |
| Multi-agent collaboration | ❌ | ✅ 11 employees via EventBus |
| Plugin architecture | ❌ | ✅ 6 registries |
| Human approvals | ❌ | ✅ Workflow gate system |
| Execution modes | ❌ | ✅ Manual/Automatic with per-project override |
| Recurring tasks | ❌ | ✅ Cron scheduler |
| Cost tracking | ❌ | ✅ Analytics service |
| Skill-based routing | ❌ | ✅ SkillMatcher |
| Memory hierarchy | ❌ | ✅ 7 specialized stores |
| Provider fallback | ❌ | ✅ Auto-fallback chain |
| Organizational structure | ❌ | ✅ CEO → Departments → Employees |
| Configurable workflows | ❌ | ✅ JSON definitions |

---

## 🚀 Getting Started

```bash
# Install
npm install

# Set up environment
cp .env.example .env
# Edit .env with your MongoDB URI and API keys

# Run
npm run dev

# Build for production
npm run build

# Run with Docker
docker-compose up
```

**Status:** TypeScript ✅ | Tests 23/23 ✅ | Zero breaking changes ✅
