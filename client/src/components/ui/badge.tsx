import { type HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-white/10 text-white/70',
  idle: 'bg-green-500/15 text-green-400 border border-green-500/20',
  busy: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  error: 'bg-red-500/15 text-red-400 border border-red-500/20',
  offline: 'bg-white/5 text-white/40 border border-white/10',
  success: 'bg-green-500/15 text-green-400 border border-green-500/20',
  warning: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  info: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  completed: 'bg-green-500/15 text-green-400 border border-green-500/20',
  failed: 'bg-red-500/15 text-red-400 border border-red-500/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  queued: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
} as const

type Variant = keyof typeof variants

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'

export { Badge, type Variant as BadgeVariant }

export function statusToVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    IDLE: 'idle',
    BUSY: 'busy',
    ERROR: 'error',
    OFFLINE: 'offline',
    PENDING: 'pending',
    QUEUED: 'queued',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'error',
    APPROVED: 'success',
    REJECTED: 'error',
    healthy: 'success',
    degraded: 'warning',
    down: 'error',
    active: 'success',
    inactive: 'offline',
  }
  return map[status] || 'default'
}
