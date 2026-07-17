# AI Operating System — Architecture Analysis & Migration Plan

> **Author:** Architecture Audit  
> **Date:** 2026-07-17  
> **Goal:** Evolve from a hardcoded employee system into a fully modular, plugin-based AIOS

---

## 1. Current Architecture Assessment

### ✅ What Works Well

| Component | Status | Notes |
|-----------|--------|-------|
| **Auth (JWT)** | ✅ Solid | Register, login, refresh, role management |
| **CEO Agent** | ✅ Clean | Delegates goals, creates projects, never works directly |
| **Manager Agent** | ✅ Functional | Orchestrates tasks via BullMQ, handles dependencies |
| **11 Employees** | ✅ Built | Research, Planning, Writer, Reviewer, Voice, Image, Video, Editor, Publisher, Analytics, Memory |
| **BaseEmployee** | ✅ Good pattern | Abstract class with execute/lifecycle/error handling |
| **BullMQ Queues** | ✅ 11 queues | One per employee, + queue.service for creation |
| **BullMQ Workers** | ✅ 11 workers | Automatic startup in server.ts |
| **LLM Providers** | ✅ 6 providers | OpenAI, Gemini, Groq, OpenRouter, Mistral, GitHub Models |
| **AIService** | ✅ Provider-agnostic | Generates, summarizes, analyzes, extracts |
| **MongoDB Models** | ✅ 11 collections | Users, Tasks, Projects, Memory, Knowledge, Sessions, etc. |
| **Validation** | ✅ Zod schemas | On all new routes |
| **Docker** | ✅ Configured | Dockerfile + docker-compose |
| **Error Handling** | ✅ Consistent | try/catch, error handler middleware, logging |

### ❌ What Needs Upgrading

| Issue | Current State | Problem |
|-------|---------------|---------|
| **1. No Registry Pattern** | Employees instantiated manually in each worker | Adding an employee = edit 3+ files |
| **2. Hardcoded QUEUE_MAP** | `QUEUE_MAP` switch in manager.model.ts | New queue = edit Manager code |
| **3. No ToolRegistry** | Tools instantiated ad-hoc, mixed with aiService calls | No pluggability, no discovery |
| **4. No Workflow Engine** | Workflow hardcoded in Planning Employee prompt | Different content types require code changes |
| **5. No Event Bus** | Manager directly calls onTaskCompleted | Tightly coupled, no pub/sub |
| **6. No Department System** | All employees flat in one folder | No organizational hierarchy |
| **7. No Skills System** | Only `role` and `goal` strings | Can't match tasks to skills |
| **8. Memory System is basic** | Single AgentMemory collection | No separation of concerns |
| **9. No Plugin Architecture** | Everything is hardcoded imports | Can't add without modifying core |
| **10. No Scheduler** | No cron support | Can't schedule recurring tasks |
| **11. No Analytics Tracking** | AnalyticsEmployee exists but manual | No automatic metrics collection |
| **12. No Dashboard APIs** | No GET /employees, /tools, /providers, /workflows | Can't discover system state |
| **13. No Human Approval** | No workflow pause/resume | Can't get user input mid-flow |
| **14. Worker duplication** | 11 nearly identical workers | Massive code duplication |

---

## 2. Architecture Upgrade Plan

### Principle: Plugin Architecture with Registries

```
Before (Hardcoded):           After (Plugin-based):

Worker creates employee       EmployeeRegistry.get('writer')
  → new WriterEmployee()        → returns registered plugin

Manager maps by name          QueueRegistry.get('writer')
  → QUEUE_MAP['writer']         → returns queue plugin

Employee uses tool             ToolRegistry.get('web-search')
  → new WebSearchTool()         → returns tool plugin

Planning hardcodes flow        WorkflowEngine.run('youtube-video')
  → LLM prompt → parse           → loads workflow config → steps
```

### 🔄 Registry Pattern

Every component registers itself on import:
```
// writer.employee.ts (at module level)
EmployeeRegistry.register({
  id: 'writer',
  name: 'Writer Employee',
  department: 'content',
  skills: ['blog', 'seo', 'script', 'email', 'copywriting'],
  execute: (task) => { ... }
});
```

### 📦 What Becomes a Plugin

| Component | Plugin | Registration | Discovery |
|-----------|--------|-------------|-----------|
| **Employees** | `module.ts` with auto-register | `EmployeeRegistry.register()` | `GET /employees` |
| **Tools** | `tool.ts` with auto-register | `ToolRegistry.register()` | `GET /tools` |
| **Providers** | `provider.ts` with auto-register | `ProviderRegistry.register()` | `GET /providers` |
| **Workflows** | `workflow.json` or `workflow.ts` | `WorkflowEngine.register()` | `GET /workflows` |

---

## 3. Detailed Migration Plan

### Phase 1 — Registry Infrastructure (no breaking changes)

**Goal:** Make employees, tools, and providers discoverable via registries.  
**Files to create:** `src/registries/` with employee, tool, provider registries.  
**Files to modify:** Each employee file adds 1 line of auto-registration.  
**Backward compatibility:** All existing code still works. Workers can still do `new WriterEmployee()`.

### Phase 2 — Workflow Engine + Event Bus

**Goal:** Configurable workflows instead of hardcoded LLM prompts.  
**Key addition:** Workflow schema (JSON), WorkflowEngine class.  
**Key addition:** EventBus using BullMQ events + Job events.  
**Backward compatible:** Planning Employee updated to load workflow OR fall back to LLM.

### Phase 3 — Department System + Skills System

**Goal:** Organizational hierarchy (CEO → Managers → Departments → Employees).  
**Key addition:** Department model, DepartmentManager, skill matching.  
**Backward compatible:** Existing employees get assigned to departments automatically.

### Phase 4 — Memory System Upgrade

**Goal:** Split monolithic AgentMemory into specialized stores.  
**Key addition:** ShortMemory, LongMemory, KnowledgeBase, ExecutionLog models.  
**Backward compatible:** Old AgentMemory collection still readable.

### Phase 5 — Scheduler + Analytics

**Goal:** Cron jobs for recurring tasks + automatic metrics collection.  
**Key addition:** SchedulerService, AnalyticsService with automatic tracking.  
**Backward compatible:** Everything still works as before.

### Phase 6 — Dashboard APIs

**Goal:** Full system observability.  
**Key addition:** Routes for employees, tools, providers, workflows, departments, analytics, scheduler.  
**Backward compatible:** Pure addition of new routes.

---

## 4. Specific Code Issues to Fix

### Issue 1: 11 Nearly Identical Workers

```typescript
// Current pattern (repeated 11 times):
const employee = new XxxEmployee();
export function startXxxWorker(): void {
  createWorker('xxx-task-queue', async (job) => {
    const result = await employee.execute(job.data);
    if (result.success) {
      await Manager.onTaskCompleted(taskId, projectId);
    } else {
      await Manager.onTaskFailed(taskId, projectId, result.error);
    }
  }, 3);
  logger.info('XxxWorker started');
}
```

**Fix:** Single generic worker factory that reads from EmployeeRegistry.

### Issue 2: Hardcoded QUEUE_MAP

```typescript
const QUEUE_MAP = {
  planning: planningQueue,   // Hardcoded import + entry
  writer: writerQueue,
  // Add new employee → Edit this file
};
```

**Fix:** QueueRegistry auto-discovered from employee registration.

### Issue 3: No Human Approval Hooks

The workflow has no pause mechanism. The Planner creates subtasks and they all queue immediately. No way to say "wait for user approval before starting Reviewer."

### Issue 4: MemoryEmployee Uses AgentMemory + Knowledge

Two collections but both are "catch-all" stores. No distinction between short-term context and long-term learning.

---

## 5. Future-Proofing

With this architecture, adding a new employee requires ONLY:

1. Create `src/features/employees/seo/seo.employee.ts`
2. Implement the `Employee` interface (or extend `BaseEmployee`)
3. Add auto-registration line

That's it. No edits to Manager, no edits to server.ts, no edits to QUEUE_MAP, no edits to workers.

Adding a new tool:

1. Create `src/tools/seo-analyzer.tool.ts`
2. Implement the `Tool` interface
3. Add auto-registration line

Adding a new workflow:

1. Create `src/workflows/podcast.workflow.ts` (or JSON config)
2. Define steps, dependencies, and employee assignments

---

## 6. Implementation Order

| Phase | What | Est. Files Changed | Breaking? |
|-------|------|-------------------|-----------|
| **1** | EmployeeRegistry + ToolRegistry + ProviderRegistry | ~15 new, ~13 modified | ❌ No |
| **2** | Workflow Engine + Event Bus + Human Approval | ~10 new, ~5 modified | ❌ No |
| **3** | Department System + Skills System | ~5 new, ~3 modified | ❌ No |
| **4** | Memory System Upgrade | ~4 new, ~2 modified | ❌ No |
| **5** | Scheduler + Analytics Tracking | ~6 new, ~2 modified | ❌ No |
| **6** | Dashboard APIs | ~8 new, ~1 modified | ❌ No |

**Total:** ~48 new files, ~26 modified files — zero breaking changes to existing APIs.

**Next → Phase 1: Registeries**
