import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GitBranch, Bot, CheckCircle, Clock, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { systemService } from '@/services/system.service'
import { cn } from '@/lib/utils'

export function WorkflowsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => systemService.getWorkflows(),
  })

  const workflows = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Workflows</h1>
        <p className="text-sm text-white/50 mt-1">{workflows.length} registered workflows</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-white/5" />
          ))
        ) : (
          workflows.map((workflow: any) => (
            <Card key={workflow.id || workflow.type} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white capitalize">
                      {(workflow.name || workflow.type || '').replace(/-/g, ' ')}
                    </CardTitle>
                    {workflow.description && (
                      <p className="text-xs text-white/40 mt-0.5">{workflow.description}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-white/50 mb-3">
                    {workflow.steps?.length || 0} steps
                  </p>
                  {workflow.steps?.map((step: any, index: number) => (
                    <div key={step.id || index}>
                      <div className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border',
                        step.requiresApproval
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-white/[0.02] border-white/[0.06]'
                      )}>
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                          step.requiresApproval ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                        )}>
                          {step.requiresApproval ? (
                            <CheckCircle className="w-3.5 h-3.5 text-yellow-400" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white capitalize">{step.name || step.employeeType}</p>
                          <p className="text-xs text-white/30">Step {step.order + 1}</p>
                        </div>
                        {step.requiresApproval && (
                          <Badge variant="warning">Approval Required</Badge>
                        )}
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <div className="flex justify-center py-1">
                          <ArrowDown className="w-3.5 h-3.5 text-white/20" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>
    </div>
  )
}
