import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topnav } from './Topnav'
import { Breadcrumbs } from './Breadcrumbs'
import { useAppStore } from '@/store/app.store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export function MainLayout() {
  const { sidebarCollapsed } = useAppStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300',
          isMobile ? 'ml-0' : sidebarCollapsed ? 'ml-[68px]' : 'ml-[260px]'
        )}
      >
        <Topnav />
        <main className="p-4 lg:p-6">
          <Breadcrumbs />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
