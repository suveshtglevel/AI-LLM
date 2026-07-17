import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/theme.store'
import { useAuthStore } from '@/store/auth.store'
import { Sun, Moon, User, Bell, Shield, Key } from 'lucide-react'

export function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/50 mt-1">Manage your account and preferences</p>
      </div>

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
