import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Wrench, Search, Globe, Image, Video, Mic, Code2, Activity, Clock, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, statusToVariant } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { systemService } from '@/services/system.service'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ElementType> = {
  search: Search,
  browser: Globe,
  image: Image,
  video: Video,
  voice: Mic,
  news: Search,
  github: Code2,
  default: Wrench,
}

export function ToolsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => systemService.getTools(),
  })

  const tools = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Tools</h1>
        <p className="text-sm text-white/50 mt-1">{tools.length} registered tools</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 bg-white/5" />
          ))
        ) : tools.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-white/30">
            <Wrench className="w-12 h-12 mb-3" />
            <p className="text-sm">No tools registered</p>
          </div>
        ) : (
          tools.map((tool: any) => {
            const Icon = iconMap[tool.name?.toLowerCase()] || iconMap[tool.category?.toLowerCase()] || iconMap.default
            return (
              <Card key={tool.name}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white/50" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
                        <p className="text-xs text-white/40 capitalize">{tool.category}</p>
                      </div>
                    </div>
                    <Badge variant={statusToVariant(tool.status)}>{tool.status}</Badge>
                  </div>

                  {tool.description && (
                    <p className="text-xs text-white/40 line-clamp-2">{tool.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06]">
                    <div className="text-center">
                      <p className="text-xs text-white/40">Requests</p>
                      <p className="text-sm font-semibold text-white">{tool.requests || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/40">Avg Time</p>
                      <p className="text-sm font-semibold text-white">
                        {tool.averageTime ? `${tool.averageTime}ms` : '--'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-white/40">Errors</p>
                      <p className="text-sm font-semibold text-red-400">{tool.errors || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
