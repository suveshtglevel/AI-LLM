import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderKanban, CheckSquare, Bot, Building2,
  GitBranch,  BarChart3, Cpu, Wrench, Brain, Calendar,
  CheckCircle, Bell, Settings, ChevronLeft, ChevronRight,
  PanelRightClose, Layers, Network,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/app.store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { SIDEBAR_ITEMS } from '@/utils/constants'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FolderKanban, CheckSquare, Bot, Building2,
  GitBranch, BarChart3, Cpu, Wrench, Brain, Calendar,
  CheckCircle, Bell, Settings, Layers, Network,
}

export function Sidebar() {
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 68 },
  }

  return (
    <AnimatePresence>
      {isMobile ? (
        <MobileSidebar location={location} isActive={isActive} />
      ) : (
        <motion.aside
          initial={false}
          animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
          variants={sidebarVariants}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed left-0 top-0 h-screen z-30 bg-black/40 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col"
        >
          {/* Logo */}
          <div className={cn(
            'flex items-center h-16 px-4 border-b border-white/[0.06]',
            sidebarCollapsed ? 'justify-center' : 'gap-3'
          )}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white font-semibold text-sm"
              >
                AIOS
              </motion.span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = iconMap[item.icon]
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
                    active
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  )}
                >
                  {Icon && (
                    <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-blue-400')} />
                  )}
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {active && !sidebarCollapsed && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-full"
                    />
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="border-t border-white/[0.06] p-3">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function MobileSidebar({ location, isActive }: { location: ReturnType<typeof useLocation>; isActive: (path: string) => boolean }) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <>
      {sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={toggleSidebar} />
      )}
      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: sidebarCollapsed ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen w-72 z-50 bg-black/90 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <span className="text-white font-semibold">AIOS</span>
          </div>
          <button onClick={toggleSidebar} className="text-white/40 hover:text-white/70">
            <PanelRightClose className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = iconMap[item.icon]
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={toggleSidebar}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all',
                  active ? 'bg-blue-500/15 text-blue-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                )}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </motion.aside>
    </>
  )
}
