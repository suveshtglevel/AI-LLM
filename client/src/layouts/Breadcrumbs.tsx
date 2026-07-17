import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  company: 'Company',
  projects: 'Projects',
  tasks: 'Tasks',
  employees: 'Employees',
  departments: 'Departments',
  workflows: 'Workflows',
  analytics: 'Analytics',
  memory: 'Memory',
  scheduler: 'Scheduler',
  approvals: 'Approvals',
  providers: 'Providers',
  tools: 'Tools',
  settings: 'Settings',
  notifications: 'Notifications',
}

export function Breadcrumbs() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)

  if (paths.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-xs text-white/30 mb-4">
      <Link to="/" className="hover:text-white/60 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {paths.map((path, index) => {
        const href = '/' + paths.slice(0, index + 1).join('/')
        const isLast = index === paths.length - 1
        const label = routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1)

        return (
          <div key={path} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3" />
            {isLast ? (
              <span className="text-white/60">{label}</span>
            ) : (
              <Link to={href} className="hover:text-white/60 transition-colors">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
