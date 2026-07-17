import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { connectSocket, disconnectSocket } from '@/services/socket.service'

// Lazy-loaded page components
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const EmployeesPage = lazy(() => import('@/features/employees/EmployeesPage').then((m) => ({ default: m.EmployeesPage })))
const EmployeeDetailPage = lazy(() => import('@/features/employees/EmployeeDetailPage').then((m) => ({ default: m.EmployeeDetailPage })))
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectDetailPage = lazy(() => import('@/features/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })))
const TasksPage = lazy(() => import('@/features/tasks/TasksPage').then((m) => ({ default: m.TasksPage })))
const DepartmentsPage = lazy(() => import('@/features/departments/DepartmentsPage').then((m) => ({ default: m.DepartmentsPage })))
const DepartmentDetailPage = lazy(() => import('@/features/departments/DepartmentDetailPage').then((m) => ({ default: m.DepartmentDetailPage })))
const WorkflowsPage = lazy(() => import('@/features/workflows/WorkflowsPage').then((m) => ({ default: m.WorkflowsPage })))
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const MemoryPage = lazy(() => import('@/features/memory/MemoryPage').then((m) => ({ default: m.MemoryPage })))
const SchedulerPage = lazy(() => import('@/features/scheduler/SchedulerPage').then((m) => ({ default: m.SchedulerPage })))
const ApprovalsPage = lazy(() => import('@/features/approvals/ApprovalsPage').then((m) => ({ default: m.ApprovalsPage })))
const ProvidersPage = lazy(() => import('@/features/providers/ProvidersPage').then((m) => ({ default: m.ProvidersPage })))
const ToolsPage = lazy(() => import('@/features/tools/ToolsPage').then((m) => ({ default: m.ToolsPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const QueuesPage = lazy(() => import('@/features/queues/QueuesPage').then((m) => ({ default: m.QueuesPage })))
const CompanyPage = lazy(() => import('@/features/company/CompanyPage').then((m) => ({ default: m.CompanyPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 30000,
      staleTime: 10000,
      retry: 1,
    },
  },
})

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppContent() {
  const { theme, setTheme } = useThemeStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    setTheme(theme)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket()
      return () => {
        disconnectSocket()
      }
    }
  }, [isAuthenticated])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><DashboardPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/company" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><CompanyPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/projects" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><ProjectsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/projects/:id" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><ProjectDetailPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/tasks" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><TasksPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/employees" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><EmployeesPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/employees/:type" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><EmployeeDetailPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/departments" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><DepartmentsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/departments/:id" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><DepartmentDetailPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/workflows" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><WorkflowsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/analytics" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><AnalyticsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/memory" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><MemoryPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/scheduler" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><SchedulerPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/approvals" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><ApprovalsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/providers" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><ProvidersPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/tools" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><ToolsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/settings" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><SettingsPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/queues" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><QueuesPage /></Suspense></ErrorBoundary>
              } />
              <Route path="/notifications" element={
                <ErrorBoundary><Suspense fallback={<LoadingSpinner />}><NotificationsPage /></Suspense></ErrorBoundary>
              } />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
