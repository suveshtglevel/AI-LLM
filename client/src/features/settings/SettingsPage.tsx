import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { useExecutionModeStore } from '@/store/execution-mode.store'
import { settingsService } from '@/services/settings.service'
import { Sun, Moon, User, Bell, Key, Zap, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const { globalMode, setGlobalMode } = useExecutionModeStore()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the current execution mode on mount
  useEffect(() => {
    settingsService.getExecutionMode()
      .then((res) => {
        if (res.data?.executionMode) {
          setGlobalMode(res.data.executionMode)
        }
      })
      .catch(() => {
        // Backend might not be available, use store default
      })
  }, [])

  const handleModeChange = async (mode: 'AUTO' | 'MANUAL') => {
    setIsUpdating(true)
    setError(null)
    try {
      await settingsService.updateExecutionMode(mode)
      setGlobalMode(mode)
    } catch (err) {
      setError('Failed to update execution mode. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-1">Manage your account and preferences</p>
      </div>

      {/* Execution Mode */}
      <Card className={cn(
        'border overflow-hidden transition-all duration-300',
        globalMode === 'MANUAL' ? 'border-orange-500/20' : 'border-emerald-500/20'
      )}>
        <div className={cn(
          'absolute top-0 left-0 right-0 h-0.5',
          globalMode === 'MANUAL' ? 'bg-orange-500' : 'bg-emerald-500'
        )} />
        <CardHeader>
          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation Mode
            <Badge
              variant={globalMode === 'AUTO' ? 'success' : 'warning'}
              className="ml-2 text-[10px] px-2"
            >
              {globalMode === 'AUTO' ? 'AUTOMATIC' : 'MANUAL'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/40 mb-4">
            {globalMode === 'AUTO'
              ? 'AI Company runs autonomously. Employees execute tasks and continue to the next step without waiting for approval.'
              : 'Each step requires human approval before the next employee can start. Review results before continuing.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleModeChange('AUTO')}
              disabled={isUpdating}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                globalMode === 'AUTO'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10'
              )}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span className="font-semibold">Automatic</span>
            </button>
            <button
              onClick={() => handleModeChange('MANUAL')}
              disabled={isUpdating}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                globalMode === 'MANUAL'
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-400 shadow-lg shadow-orange-500/10'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10'
              )}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="font-semibold">Manual</span>
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 mt-2">{error}</p>
          )}

          <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <p className="text-xs text-white/30">
              <span className="text-white/50 font-medium">Project Override:</span> You can override this per-project
              from the Project Details page. Individual project settings take precedence over the global default.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1">Name</label>
              <p className="text-sm text-white">{user?.name}</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Email</label>
              <p className="text-sm text-white">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Role</label>
              <p className="text-sm text-white capitalize">{user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Theme</p>
              <p className="text-xs text-white/40">Toggle between dark and light mode</p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
            <Key className="w-4 h-4" /> API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/40 mb-4">Manage your API keys for AI providers</p>
          <Button variant="outline" disabled>
            Manage Keys
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-white/70 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/40 mb-4">Configure your notification preferences</p>
          <Button variant="outline" disabled>
            Configure
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
