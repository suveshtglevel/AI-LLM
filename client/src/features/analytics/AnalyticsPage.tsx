import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { analyticsService } from '@/services/analytics.service'
import { DashboardAreaChart, DashboardBarChart, DashboardPieChartComponent } from '@/features/dashboard/DashboardCharts'

export function AnalyticsPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsService.getSummary(),
  })

  const { data: employeePerf, isLoading: loadingPerf } = useQuery({
    queryKey: ['analytics-employees'],
    queryFn: () => analyticsService.getEmployeePerformance(),
  })

  const { data: costTrends, isLoading: loadingCosts } = useQuery({
    queryKey: ['analytics-costs-90'],
    queryFn: () => analyticsService.getCostTrends(90),
  })

  const { data: perfTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ['analytics-performance-30'],
    queryFn: () => analyticsService.getPerformanceTrends(30),
  })

  const s = summary?.data
  const employees = employeePerf?.data || []
  const costs = costTrends?.data || []
  const trends = perfTrends?.data || []

  const pieData = employees.map((emp: any) => ({
    name: emp.employeeType,
    value: emp.executionCount || 0,
    color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444'][
      Math.floor(Math.random() * 7)
    ],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/50 mt-1">Detailed performance metrics and insights</p>
      </div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Executions</p>
                {loadingSummary ? (
                  <Skeleton className="h-6 w-16 bg-white/5" />
                ) : (
                  <p className="text-lg font-bold text-white">{s?.totalExecutions || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Success Rate</p>
                {loadingSummary ? (
                  <Skeleton className="h-6 w-16 bg-white/5" />
                ) : (
                  <p className="text-lg font-bold text-green-400">
                    {s ? `${(s.successRate * 100).toFixed(1)}%` : '--'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Total Cost</p>
                {loadingSummary ? (
                  <Skeleton className="h-6 w-16 bg-white/5" />
                ) : (
                  <p className="text-lg font-bold text-white">
                    {s ? `$${s.totalCost.toFixed(2)}` : '--'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-white/50">Total Tokens</p>
                {loadingSummary ? (
                  <Skeleton className="h-6 w-16 bg-white/5" />
                ) : (
                  <p className="text-lg font-bold text-white">
                    {s ? s.totalTokens.toLocaleString() : '--'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Cost Trends (90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCosts ? (
              <Skeleton className="h-[300px] bg-white/5" />
            ) : (
              <DashboardAreaChart
                data={costs}
                xKey="date"
                series={[{ key: 'cost', name: 'Cost ($)', color: '#f59e0b' }]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Employee Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPerf ? (
              <Skeleton className="h-[300px] bg-white/5" />
            ) : (
              <DashboardPieChartComponent data={pieData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPerf ? (
              <Skeleton className="h-[300px] bg-white/5" />
            ) : (
              <DashboardBarChart
                data={employees}
                xKey="employeeType"
                series={[
                  { key: 'executionCount', name: 'Executions', color: '#8b5cf6' },
                  { key: 'averageDuration', name: 'Avg Duration (ms)', color: '#f59e0b' },
                ]}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/70">Performance Trends (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <Skeleton className="h-[300px] bg-white/5" />
            ) : (
              <DashboardAreaChart
                data={trends}
                xKey="date"
                series={[
                  { key: 'successRate', name: 'Success Rate', color: '#22c55e' },
                  { key: 'executionCount', name: 'Executions', color: '#3b82f6' },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
