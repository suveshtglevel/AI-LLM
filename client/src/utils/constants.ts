export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  TASKS: '/tasks',
  EMPLOYEES: '/employees',
  EMPLOYEE_DETAIL: '/employees/:type',
  DEPARTMENTS: '/departments',
  DEPARTMENT_DETAIL: '/departments/:id',
  WORKFLOWS: '/workflows',
  ANALYTICS: '/analytics',
  MEMORY: '/memory',
  SCHEDULER: '/scheduler',
  APPROVALS: '/approvals',
  PROVIDERS: '/providers',
  TOOLS: '/tools',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
} as const

export const EMPLOYEE_STATUS = {
  IDLE: 'IDLE',
  BUSY: 'BUSY',
  ERROR: 'ERROR',
  OFFLINE: 'OFFLINE',
} as const

export const TASK_STATUS = {
  PENDING: 'PENDING',
  QUEUED: 'QUEUED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const

export const PROJECT_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

export const DEPARTMENTS = [
  { id: 'research', label: 'Research', icon: 'Search' },
  { id: 'content', label: 'Content', icon: 'FileText' },
  { id: 'media', label: 'Media', icon: 'Image' },
  { id: 'publishing', label: 'Publishing', icon: 'Send' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'memory', label: 'Memory', icon: 'Brain' },
  { id: 'management', label: 'Management', icon: 'Users' },
] as const

export const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.DASHBOARD },
  { label: 'Projects', icon: 'FolderKanban', path: ROUTES.PROJECTS },
  { label: 'Tasks', icon: 'CheckSquare', path: ROUTES.TASKS },
  { label: 'Employees', icon: 'Bot', path: ROUTES.EMPLOYEES },
  { label: 'Departments', icon: 'Building2', path: ROUTES.DEPARTMENTS },
  { label: 'Workflows', icon: 'GitBranch', path: ROUTES.WORKFLOWS },
  { label: 'Queues', icon: 'Layers', path: '/queues' },
  { label: 'Analytics', icon: 'BarChart3', path: ROUTES.ANALYTICS },
  { label: 'Providers', icon: 'Cpu', path: ROUTES.PROVIDERS },
  { label: 'Tools', icon: 'Wrench', path: ROUTES.TOOLS },
  { label: 'Memory', icon: 'Brain', path: ROUTES.MEMORY },
  { label: 'Scheduler', icon: 'Calendar', path: ROUTES.SCHEDULER },
  { label: 'Approvals', icon: 'CheckCircle', path: ROUTES.APPROVALS },
  { label: 'Notifications', icon: 'Bell', path: ROUTES.NOTIFICATIONS },
  { label: 'Settings', icon: 'Settings', path: ROUTES.SETTINGS },
] as const
