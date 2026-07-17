import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Brain, Search, Database, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { memoryService } from '@/services/memory.service'
import { cn } from '@/lib/utils'

const storeStyles: Record<string, { icon: React.ElementType; bg: string; iconColor: string }> = {
  'Short Term': { icon: Brain, bg: 'bg-blue-500/10 border-blue-500/20', iconColor: 'text-blue-400' },
  'Long Term': { icon: Database, bg: 'bg-purple-500/10 border-purple-500/20', iconColor: 'text-purple-400' },
  'Learning': { icon: BookOpen, bg: 'bg-green-500/10 border-green-500/20', iconColor: 'text-green-400' },
  'Executions': { icon: Search, bg: 'bg-orange-500/10 border-orange-500/20', iconColor: 'text-orange-400' },
  'History': { icon: Brain, bg: 'bg-pink-500/10 border-pink-500/20', iconColor: 'text-pink-400' },
  'Legacy': { icon: Database, bg: 'bg-cyan-500/10 border-cyan-500/20', iconColor: 'text-cyan-400' },
}

export function MemoryPage() {
  const { data: status, isLoading: loadingStatus } = useQuery({
    queryKey: ['memory-status'],
    queryFn: () => memoryService.getStatus(),
  })

  const { data: longMemories, isLoading: loadingLong } = useQuery({
    queryKey: ['memory-long'],
    queryFn: () => memoryService.getLongMemories(),
  })

  const memStatus = status?.data
  const memories = longMemories?.data || []

  const stores = [
    { label: 'Short Term', value: memStatus?.shortTerm || 0 },
    { label: 'Long Term', value: memStatus?.longTerm || 0 },
    { label: 'Learning', value: memStatus?.learning || 0 },
    { label: 'Executions', value: memStatus?.executions || 0 },
    { label: 'History', value: memStatus?.histories || 0 },
    { label: 'Legacy', value: memStatus?.legacy || 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Memory System</h1>
        <p className="text-sm text-white/50 mt-1">Knowledge base and learning across all AI employees</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {stores.map((store) => {
          const style = storeStyles[store.label] || { icon: Brain, bg: 'bg-white/5 border-white/10', iconColor: 'text-white/50' }
          const Icon = style.icon
          return (
            <Card key={store.label}>
              <CardContent className="p-4 text-center">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 border', style.bg)}>
                  <Icon className={cn('w-5 h-5', style.iconColor)} />
                </div>
                <p className="text-2xl font-bold text-white">
                  {loadingStatus ? '--' : store.value}
                </p>
                <p className="text-xs text-white/40 mt-1">{store.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Long Term Memories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-white/70">
            Long-Term Memories
            {memories.length > 0 && (
              <Badge variant="info" className="ml-2">{memories.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLong ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full bg-white/5" />
              <Skeleton className="h-16 w-full bg-white/5" />
              <Skeleton className="h-16 w-full bg-white/5" />
            </div>
          ) : memories.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-white/30">
              <Brain className="w-8 h-8 mr-2" />
              <p className="text-sm">No memories stored yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.slice(0, 10).map((mem: any) => (
                <div key={mem._id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{mem.key}</span>
                      <Badge variant="default" className="bg-white/5 text-white/40 capitalize">{mem.category}</Badge>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2">{mem.value}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-white/30">
                      {mem.source && <span>Source: {mem.source}</span>}
                      {mem.importance !== undefined && (
                        <span>Importance: {mem.importance}/10</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
