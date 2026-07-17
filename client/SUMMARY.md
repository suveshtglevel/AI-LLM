# AIOS Frontend - Summary

## Overview

The AIOS (AI Operating System) frontend is a React 19 + TypeScript SPA built with Vite. It provides a dashboard-driven interface for managing AI agents, projects, tasks, workflows, providers, memory, scheduling, approvals, and system analytics.

---

## Tech Stack

| Category         | Libraries                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| **Framework**    | React 19, TypeScript 7                                                    |
| **Build**        | Vite 8, @vitejs/plugin-react 6                                            |
| **Routing**      | react-router-dom 7                                                        |
| **State**        | Zustand 5 (persist middleware)                                             |
| **Server State** | @tanstack/react-query 5                                                   |
| **Styling**      | Tailwind CSS 4, clsx, tailwind-merge                                      |
| **UI Primitives**| Radix UI (Avatar, Dialog, Dropdown, Popover, Progress, ScrollArea, Select, Separator, Switch, Tabs, Toast, Tooltip, Slot) |
| **Icons**        | lucide-react 1                                                            |
| **Charts**       | recharts 3                                                                |
| **Forms**        | react-hook-form 7, @hookform/resolvers 5, zod 4                           |
| **Animations**   | framer-motion 12                                                          |
| **HTTP**         | axios 1                                                                   |
| **WebSocket**    | socket.io-client 4                                                        |
| **Utilities**    | date-fns 4, class-variance-authority                                      |

---

## Project Structure

```
client/
├── index.html                     # Entry HTML
├── vite.config.ts                 # Vite configuration (port 5173, proxy /api -> localhost:3000)
├── tsconfig.json                  # TypeScript config (ES2022, strict, @/* path alias)
├── package.json                   # Dependencies & scripts
├── SUMMARY.md                     # This file
└── src/
    ├── main.tsx                   # React entry point
    ├── index.css                  # Global styles (Tailwind + custom theme vars)
    ├── app/
    │   └── App.tsx                # Root component: routing, auth guards, QueryClient, socket lifecycle
    ├── layouts/
    │   ├── AuthLayout.tsx         # Centered auth form layout with background effects
    │   ├── MainLayout.tsx         # App shell (Sidebar + Topnav + Breadcrumbs + <Outlet />)
    │   ├── Sidebar.tsx            # Collapsible sidebar navigation (desktop + mobile)
    │   ├── Topnav.tsx             # Top bar: search, theme toggle, notifications, user menu
    │   └── Breadcrumbs.tsx        # Dynamic breadcrumb trail
    ├── features/                  # Route-level page components
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   └── RegisterPage.tsx
    │   ├── company/
    │   │   └── CompanyPage.tsx     # Org chart: CEO, Managers, Departments, Employees
    │   ├── dashboard/
    │   │   ├── DashboardPage.tsx
    │   │   └── DashboardCharts.tsx
    │   ├── projects/
    │   │   ├── ProjectsPage.tsx
    │   │   └── ProjectDetailPage.tsx
    │   ├── tasks/
    │   │   └── TasksPage.tsx
    │   ├── employees/
    │   │   ├── EmployeesPage.tsx
    │   │   └── EmployeeDetailPage.tsx
    │   ├── departments/
    │   │   ├── DepartmentsPage.tsx
    │   │   └── DepartmentDetailPage.tsx
    │   ├── workflows/
    │   │   └── WorkflowsPage.tsx
    │   ├── analytics/
    │   │   └── AnalyticsPage.tsx
    │   ├── memory/
    │   │   └── MemoryPage.tsx
    │   ├── scheduler/
    │   │   └── SchedulerPage.tsx
    │   ├── approvals/
    │   │   └── ApprovalsPage.tsx
    │   ├── providers/
    │   │   └── ProvidersPage.tsx
    │   ├── tools/
    │   │   └── ToolsPage.tsx
    │   ├── queues/
    │   │   └── QueuesPage.tsx
    │   ├── notifications/
    │   │   └── NotificationsPage.tsx
    │   └── settings/
    │       └── SettingsPage.tsx
    ├── components/
    │   └── ui/                    # Reusable UI primitives
    │       ├── badge.tsx          # Status/variant badges
    │       ├── button.tsx         # Multi-variant button with loading state
    │       ├── card.tsx           # Glassmorphism card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
    │       ├── error-boundary.tsx # Class-based error boundary with retry UI
    │       ├── progress.tsx       # Progress bar (default/success/warning/danger)
    │       └── skeleton.tsx       # Loading skeleton placeholder
    ├── services/                  # API service layer
    │   ├── api.ts                 # Axios instance with interceptors (auth token, token refresh)
    │   ├── auth.service.ts        # login, register, refreshToken, getProfile
    │   ├── analytics.service.ts   # summary, employeePerformance, costTrends, performanceTrends
    │   ├── approvals.service.ts   # listPending, decide, getCount
    │   ├── employees.service.ts   # list, getByType
    │   ├── memory.service.ts      # getStatus, longMemories, learningMemories, executionLogs, projectHistory, search
    │   ├── projects.service.ts    # list, getById, delete, delegate, getStatus, updateExecutionMode
    │   ├── providers.service.ts   # CRUD for provider configs + API keys + testConnection
    │   ├── scheduler.service.ts   # CRUD + pause/resume for scheduled jobs
    │   ├── settings.service.ts    # getExecutionMode, updateExecutionMode
    │   ├── socket.service.ts      # Socket.io client management
    │   ├── system.service.ts      # getStatus, getProviders, getTools, getWorkflows
    │   └── tasks.service.ts       # list, getById
    ├── store/                     # Zustand state stores
    │   ├── app.store.ts           # Sidebar state, notifications, unread count
    │   ├── auth.store.ts          # User, authentication state (persisted)
    │   ├── theme.store.ts         # Dark/light theme toggle (persisted)
    │   └── execution-mode.store.ts # Global AUTO/MANUAL execution mode state (persisted)
    ├── hooks/
    │   ├── use-auth.ts            # useLogin, useRegister, useLogout mutations
    │   └── use-media-query.ts     # Responsive media query hook
    ├── types/
    │   └── index.ts               # All TypeScript interfaces & types
    ├── utils/
    │   ├── cn.ts                  # Tailwind class merge utility (clsx + twMerge)
    │   └── constants.ts           # API_BASE_URL, ROUTES, status enums, sidebar items, departments
    └── lib/
        └── utils.ts               # Re-exports cn utility
```

---

## Routing

All routes are defined in `src/app/App.tsx` with lazy-loaded components and error boundaries.

| Route                  | Page Component       | Auth Required |
| ---------------------- | -------------------- | ------------- |
| `/login`               | LoginPage            | ❌            |
| `/register`            | RegisterPage         | ❌            |
| `/`                    | DashboardPage        | ✅            |
| `/company`             | CompanyPage          | ✅            |
| `/projects`            | ProjectsPage         | ✅            |
| `/projects/:id`        | ProjectDetailPage    | ✅            |
| `/tasks`               | TasksPage            | ✅            |
| `/employees`           | EmployeesPage        | ✅            |
| `/employees/:type`     | EmployeeDetailPage   | ✅            |
| `/departments`         | DepartmentsPage      | ✅            |
| `/departments/:id`     | DepartmentDetailPage | ✅            |
| `/workflows`           | WorkflowsPage        | ✅            |
| `/analytics`           | AnalyticsPage        | ✅            |
| `/memory`              | MemoryPage           | ✅            |
| `/scheduler`           | SchedulerPage        | ✅            |
| `/approvals`           | ApprovalsPage        | ✅            |
| `/providers`           | ProvidersPage        | ✅            |
| `/tools`               | ToolsPage            | ✅            |
| `/queues`              | QueuesPage           | ✅            |
| `/notifications`       | NotificationsPage    | ✅            |
| `/settings`            | SettingsPage         | ✅            |

- **ProtectedRoute** - redirects to `/login` if unauthenticated
- **PublicRoute** - redirects to `/` if already authenticated

---

## Store (State Management)

All stores are managed with **Zustand 5**.

### `useAppStore`
- `sidebarCollapsed` / `toggleSidebar` / `setSidebarCollapsed`
- `notifications` / `unreadCount` / `setNotifications` / `addNotification` / `markAsRead`

### `useAuthStore` (persisted to `auth-storage` in localStorage)
- `user` / `isAuthenticated` / `isLoading`
- `setUser` / `setLoading` / `logout`

### `useThemeStore` (persisted to `theme-storage` in localStorage)
- `theme` ('dark' | 'light')
- `setTheme` / `toggleTheme` (updates `<html>` classes)

### `useExecutionModeStore` (persisted to `execution-mode-storage` in localStorage)
- `globalMode` ('AUTO' | 'MANUAL')
- `setGlobalMode` (updates global execution mode)
- `isLoading` / `setLoading`

---

## Services & API Layer

- **`api.ts`** - Axios instance configured with:
  - Base URL from `VITE_API_URL` or `/api`
  - 30s timeout
  - Request interceptor: attaches `Authorization: Bearer <token>`
  - Response interceptor: handles 401 errors with automatic token refresh and request queuing

- **WebSocket (`socket.service.ts`)**:
  - Socket.io client connecting to the server
  - Connected/disconnected based on auth state in `App.tsx`
  - Transports: websocket, polling

---

## Theme & Styling

- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- Dark-first design with CSS custom properties for light mode overrides
- Custom theme variables defined in `index.css`:
  - Surfaces, borders, text muted colors, accent colors
  - Scrollbar, selection, shimmer animation, focus ring
  - Glassmorphism utility (`.glass-surface`)
- `cn()` utility (`clsx` + `tailwind-merge`) for conflict-safe class composition

---

## UI Components

All UI components are in `src/components/ui/`:

| Component         | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| **Button**        | Variants: default, primary, secondary, ghost, danger, outline. Sizes: sm, default, lg, icon. Supports isLoading. |
| **Card**          | Glassmorphism card with Header, Title, Description, Content, Footer sub-components. |
| **Badge**         | Variants: idle, busy, error, offline, success, warning, info, pending, completed, failed, queued, in_progress. Includes `statusToVariant()` helper. |
| **Progress**      | Animated progress bar with variant colors (default/success/warning/danger). |
| **Skeleton**      | Pulsing placeholder for loading states.                      |
| **ErrorBoundary** | Class component that catches errors and shows a styled fallback with retry button. |

---

## Key Types (`src/types/index.ts`)

- **Auth**: `User`, `AuthResponse`, `LoginInput`, `RegisterInput`
- **Projects**: `Project`, `ProjectDetail`, `CreateProjectInput`, `ProjectStatus`
- **Tasks**: `Task`, `TaskStatus`
- **Employees**: `Employee`, `EmployeeDetail`, `EmployeeSession`, `ActivityLog`, `EmployeeStatus`
- **Departments**: `Department`, `DepartmentDetail`
- **Workflows**: `Workflow`, `WorkflowStep`
- **Approvals**: `Approval`, `ApprovalDecision`
- **Memory**: `MemoryStatus`, `LongMemory`, `LearningMemory`, `ExecutionLog`, `ProjectHistory`
- **Scheduler**: `ScheduledJob`, `CreateSchedulerInput`
- **Analytics**: `AnalyticsSummary`, `EmployeePerformance`, `CostTrend`, `PerformanceTrend`
- **System**: `SystemStatus`, `Provider`, `Tool`
- **Provider Config**: `ProviderConfig`, `ApiKeyEntry`, `CreateProviderInput`, `UpdateProviderInput`
- **Queues**: `QueueStatus`
- **Notifications**: `Notification`
- **API**: `ApiResponse<T>`, `PaginatedResponse<T>`
- **Execution Mode**: `ExecutionMode` ('AUTO' | 'MANUAL'), `ExecutionModeSettings`

---

## Features

### 1. AI Company Page (`/company`)

An interactive organization chart page visualizing the AI company hierarchy:

| Section | Description |
|---------|-------------|
| **Metrics Strip** | 6 live cards: Total Employees, Online, Active Projects, Tasks Running, Success Rate, Errors |
| **CEO Frame** | Executive Board card with system health (Database/Redis/Workers status), KPIs, pulse animation |
| **Managers Layer** | Visual "Management Team" section showing department managers with direct report counts |
| **Departments** | Expandable nodes showing per-department employees with live status, pulse indicators |
| **Employee Cards** | Name, type, live status, current thoughts (italic quotes), progress bars for memory |
| **Sidebar Insights** | System Health, Queue Status, Employee Distribution (with progress bars), Department Skills |

- **Real-time**: Socket.IO subscription for employee status updates (`employee:status` event)
- **Demo mode**: Simulated employee thoughts when no real socket data arrives (auto-disables on real data)
- **Auto-refresh**: Queries refresh every 10-30 seconds
- **Animations**: Framer-motion stagger/spring animations, expandable departments, hover effects

### 2. Execution Mode (Manual / Automatic)

A company-wide execution mode system controlling workflow automation:

| Mode | Indicator | Behavior |
|------|-----------|----------|
| **Automatic** | 🟢 Green (emerald badge) | Employees execute tasks and auto-continue to the next step. No approval required unless explicitly set in workflow. |
| **Manual** | 🟠 Orange (warning badge) | Every step pauses for human approval. User can Approve, Reject, Retry, Skip before next employee starts. |

**Global Toggle** (`/settings`):
- Two-button toggle: Automatic / Manual
- Persisted to localStorage + synced with backend via `GET/PATCH /api/settings/execution-mode`
- Orange accent when Manual, green when Automatic
- Explanatory text describing each mode's behavior

**Per-Project Override** (`/projects/:id`):
- Each project can override the global default with its own `executionMode`
- Visual mode badge on project header
- "Reset to global" option to inherit global setting
- Manual mode shows pending approval cards inline with Approve ✓, Reject ✗, Retry ↻, Skip ⏭ actions

**Mission Control Dashboard** (Dashboard page):
- Dedicated Mission Control section showing:
  - Mode (Automatic/Manual with colored indicator)
  - Total AI Employees
  - Running Now count
  - Completed Tasks
  - Failed Tasks
  - Waiting Approvals (with link to Approvals page)

**Backend Architecture**:
- `UserSettings` model stores global `executionMode` per user
- `Project.executionMode` field (null = inherit global)
- `WorkflowEngine.resolveExecutionMode()` resolves effective mode hierarchically
- In MANUAL mode: ALL workflow steps get approval records created (not just explicitly marked ones)
- `Manager.onTaskCompleted()` checks mode before auto-queuing next tasks; creates approvals in MANUAL mode
- Architecture supports future modes (Semi-Automatic, Scheduled, etc.)

---

## Dev & Build Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start Vite dev server (port 5173) |
| `npm run build`   | Production build               |
| `npm run preview` | Preview production build       |
| `npm run lint`    | Run ESLint                     |

---

## Vite Configuration (`vite.config.ts`)

- **Plugins**: `@vitejs/plugin-react`, `@tailwindcss/vite`
- **Path alias**: `@` → `./src`
- **Dev server**: port 5173
- **Proxy**: `/api` → `http://localhost:3000` (changeOrigin: true)

---

## Dev Mode Details

- Auth store includes a hardcoded dev user (email: `suveshpagam07@gmail.com`) that is pre-authenticated
- `useLogin` hook has a fallback: if the backend is offline and dev credentials match, it returns a mock auth response
- Dev user name: "Dev User", role: "admin"
