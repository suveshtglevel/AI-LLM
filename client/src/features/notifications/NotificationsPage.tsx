import { useAppStore } from '@/store/app.store'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, AlertCircle, CheckCircle, XCircle, Bot, FolderKanban } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  workflow_completed: CheckCircle,
  employee_failed: XCircle,
  queue_failed: AlertCircle,
  project_created: FolderKanban,
  provider_offline: XCircle,
  approval_needed: Bot,
  default: Bell,
}

const colorMap: Record<string, string> = {
  workflow_completed: 'text-green-400 bg-green-500/10 border-green-500/20',
  employee_failed: 'text-red-400 bg-red-500/10 border-red-500/20',
  queue_failed: 'text-red-400 bg-red-500/10 border-red-500/20',
  project_created: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  provider_offline: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  approval_needed: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function NotificationsPage() {
  const { notifications, unreadCount, markAsRead } = useAppStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-white/50 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" className="text-xs">
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-white/30">
              <Bell className="w-12 h-12 mb-3" />
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs text-white/20 mt-1">
                Notifications will appear here in real-time
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = iconMap[notification.type] || iconMap.default
            const colors = colorMap[notification.type] || 'text-white/50 bg-white/5 border-white/10'
            return (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                  notification.read
                    ? 'bg-white/[0.01] border-white/[0.04]'
                    : 'bg-white/[0.03] border-blue-500/20'
                )}
              >
                <div className={cn('p-2.5 rounded-lg border', colors)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{notification.title}</p>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">{notification.message}</p>
                  <p className="text-[11px] text-white/30 mt-1">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
