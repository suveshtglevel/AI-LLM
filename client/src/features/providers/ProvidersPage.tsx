import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Plus, Trash2, Power, PowerOff, TestTube,
  Key, CheckCircle, XCircle,
  AlertCircle, ChevronDown, ChevronUp,
  Eye, EyeOff, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { systemService } from '@/services/system.service'
import { providerConfigService } from '@/services/providers.service'
import { cn } from '@/lib/utils'
import type { ProviderConfig, CreateProviderInput } from '@/types'

const PROVIDER_TYPES = [
  { type: 'openai', displayName: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'], defaultModel: 'gpt-4o-mini' },
  { type: 'gemini', displayName: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'], defaultModel: 'gemini-pro' },
  { type: 'groq', displayName: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: ['mixtral-8x7b-32768', 'llama2-70b-4096', 'gemma2-9b-it'], defaultModel: 'mixtral-8x7b-32768' },
  { type: 'openrouter', displayName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', models: ['openai/gpt-4o-mini', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro'], defaultModel: 'openai/gpt-4o-mini' },
  { type: 'mistral', displayName: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', models: ['mistral-small-latest', 'mistral-medium-latest', 'mistral-large-latest'], defaultModel: 'mistral-small-latest' },
  { type: 'github', displayName: 'GitHub Models', baseUrl: 'https://models.inference.ai.azure.com', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'], defaultModel: 'gpt-4o-mini' },
  { type: 'deepseek', displayName: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-coder'], defaultModel: 'deepseek-chat' },
  { type: 'huggingface', displayName: 'Hugging Face', baseUrl: 'https://api-inference.huggingface.co/v1', models: ['mistralai/Mistral-7B-Instruct-v0.3', 'meta-llama/Llama-2-70b-chat-hf'], defaultModel: 'mistralai/Mistral-7B-Instruct-v0.3' },
  { type: 'googlecloud', displayName: 'Google Cloud AI', baseUrl: 'https://us-central1-aiplatform.googleapis.com/v1', models: ['gemini-1.5-pro', 'gemini-1.5-flash'], defaultModel: 'gemini-1.5-pro' },
  { type: 'azure', displayName: 'Azure OpenAI', baseUrl: 'https://models.inference.ai.azure.com', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'], defaultModel: 'gpt-4o-mini' },
  { type: 'anthropic', displayName: 'Anthropic Claude', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'], defaultModel: 'claude-3-haiku-20240307' },
  { type: 'langchain', displayName: 'LangChain', baseUrl: 'https://api.langchain.com/v1', models: ['llama-2-70b-chat', 'llama-2-13b-chat'], defaultModel: 'llama-2-70b-chat' },
  { type: 'ai21', displayName: 'AI21 Labs', baseUrl: 'https://api.ai21.com/v1', models: ['j2-mid', 'j2-ultra'], defaultModel: 'j2-mid' },
  { type: 'perplexity', displayName: 'Perplexity AI', baseUrl: 'https://api.perplexity.ai', models: ['sonar-pro', 'sonar-small-chat'], defaultModel: 'sonar-pro' },
  { type: 'custom', displayName: 'Custom (OpenAI-compatible)', baseUrl: '', models: [], defaultModel: '' },
]

function getProviderLogo(name: string) {
  const colors: Record<string, string> = {
    openai: 'from-green-500/20 to-emerald-600/10 text-green-400 border-green-500/20',
    gemini: 'from-blue-500/20 to-cyan-600/10 text-blue-400 border-blue-500/20',
    groq: 'from-orange-500/20 to-red-600/10 text-orange-400 border-orange-500/20',
    openrouter: 'from-purple-500/20 to-violet-600/10 text-purple-400 border-purple-500/20',
    mistral: 'from-cyan-500/20 to-teal-600/10 text-cyan-400 border-cyan-500/20',
    github: 'from-gray-500/20 to-slate-600/10 text-gray-400 border-gray-500/20',
    deepseek: 'from-yellow-500/20 to-amber-600/10 text-yellow-400 border-yellow-500/20',
    huggingface: 'from-pink-500/20 to-rose-600/10 text-pink-400 border-pink-500/20',
    googlecloud: 'from-indigo-500/20 to-sky-600/10 text-indigo-400 border-indigo-500/20',
    azure: 'from-blue-600/20 to-indigo-700/10 text-blue-500 border-blue-600/20',
    anthropic: 'from-orange-600/20 to-amber-700/10 text-orange-500 border-orange-600/20',
    langchain: 'from-lime-500/20 to-green-600/10 text-lime-400 border-lime-500/20',
    ai21: 'from-fuchsia-500/20 to-pink-600/10 text-fuchsia-400 border-fuchsia-500/20',
    perplexity: 'from-emerald-500/20 to-green-600/10 text-emerald-400 border-emerald-500/20',
  }
  return colors[name] || 'from-white/10 to-white/5 text-white/40 border-white/10'
}

export function ProvidersPage() {
  const queryClient = useQueryClient()
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [selectedProviderType, setSelectedProviderType] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDisplayName, setCustomDisplayName] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [customDefaultModel, setCustomDefaultModel] = useState('')
  const [customModels, setCustomModels] = useState('')
  const [singleKey, setSingleKey] = useState('')
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set())
  const [newKeyInputs, setNewKeyInputs] = useState<Record<string, string>>({})
  const [testingNames, setTestingNames] = useState<Set<string>>(new Set())

  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['providers'],
    queryFn: () => systemService.getProviders(),
    retry: false,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  })

  const { data: configsData, isLoading: loadingConfigs } = useQuery({
    queryKey: ['provider-configs'],
    queryFn: () => providerConfigService.listConfigs(),
    retry: false,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  })

  const providerStatuses = statusData?.data?.providers || []
  const providerConfigs = configsData?.data || []

  const createMutation = useMutation({
    mutationFn: providerConfigService.createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-configs'] })
      resetForm()
    },
  })

  const addKeyMutation = useMutation({
    mutationFn: ({ name, key }: { name: string; key: string }) =>
      providerConfigService.addApiKey(name, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-configs'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: providerConfigService.deleteConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-configs'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ name, isEnabled }: { name: string; isEnabled: boolean }) =>
      providerConfigService.updateConfig(name, { isEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-configs'] }),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: ({ name, keyId }: { name: string; keyId: string }) =>
      providerConfigService.deleteApiKey(name, keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provider-configs'] }),
  })

  const testMutation = useMutation({
    mutationFn: (name: string) => providerConfigService.testConnection(name),
  })

  function resetForm() {
    setSelectedProviderType('')
    setIsCustom(false)
    setCustomName('')
    setCustomDisplayName('')
    setCustomBaseUrl('')
    setCustomDefaultModel('')
    setCustomModels('')
    setSingleKey('')
    setShowAddPanel(false)
  }

  function handleAddKey() {
    const key = singleKey.trim()
    if (!key || !selectedProviderType) return

    const providerType = PROVIDER_TYPES.find(t => t.type === selectedProviderType)
    if (!providerType) return

    const name = selectedProviderType === 'custom' ? customName.trim().toLowerCase().replace(/\s/g, '-') : selectedProviderType
    if (!name) return

    // Check if provider config already exists
    const existingConfig = providerConfigs.find(c => c.name === name)

    if (existingConfig) {
      // Add key to existing provider
      addKeyMutation.mutate({ name, key })
    } else {
      // Create provider first, then add key
      const payload: any = {
        name,
        displayName: selectedProviderType === 'custom' ? customDisplayName.trim() || name : providerType.displayName,
        providerType: selectedProviderType === 'custom' ? 'custom' : selectedProviderType,
        apiKeys: [{ key }],
        baseUrl: selectedProviderType === 'custom' ? customBaseUrl.trim() : providerType.baseUrl,
        models: selectedProviderType === 'custom' ? customModels.split(',').map(m => m.trim()).filter(Boolean) : providerType.models,
        defaultModel: selectedProviderType === 'custom' ? customDefaultModel.trim() || '' : providerType.defaultModel,
        isEnabled: true,
      }

      if (!payload.displayName || !payload.baseUrl) return
      createMutation.mutate(payload)
    }

    setSingleKey('')
  }

  function handleTestConnection(name: string) {
    setTestingNames((prev) => new Set(prev).add(name))
    testMutation.mutate(name, {
      onSettled: () => {
        setTestingNames((prev) => {
          const next = new Set(prev)
          next.delete(name)
          return next
        })
      },
    })
  }

  function toggleExpanded(name: string) {
    setExpandedConfigs((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function toggleShowKey(keyId: string) {
    setShowKeys((prev) => {
      const next = new Set(prev)
      if (next.has(keyId)) next.delete(keyId)
      else next.add(keyId)
      return next
    })
  }

  function maskKey(key: string) {
    if (key.length <= 8) return '****'
    return `${key.slice(0, 4)}...${key.slice(-4)}`
  }

  const allProviderNames = [
    ...new Set([...providerStatuses.map((p: any) => p.name), ...providerConfigs.map((c) => c.name)]),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">AI Providers</h1>
          <p className="text-sm text-white/50 mt-1">
            {providerStatuses.length} registered · {providerConfigs.reduce((s, c) => s + c.apiKeys.length, 0)} total keys
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddPanel(!showAddPanel)}>
          <Plus className="w-4 h-4" />
          Add API Key
        </Button>
      </div>

      {/* Add Key Panel — single input, auto-segregates */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Add API Key</h3>
                <p className="text-xs text-white/40">Select a provider type, paste your key, and click add. Each paste goes to the same provider config for rotation.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Provider Type */}
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Provider Type *</label>
                    <select
                      value={selectedProviderType}
                      onChange={(e) => {
                        setSelectedProviderType(e.target.value)
                        setIsCustom(e.target.value === 'custom')
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        backgroundSize: '14px',
                      }}
                    >
                      <option value="" disabled className="bg-gray-900 text-white/50">Select a provider...</option>
                      {PROVIDER_TYPES.map((pt) => (
                        <option key={pt.type} value={pt.type} className="bg-gray-900 text-white">{pt.displayName}</option>
                      ))}
                    </select>
                  </div>

                  {/* API Key Input */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-white/50 mb-2">API Key *</label>
                    <input
                      type="text"
                      value={singleKey}
                      onChange={(e) => setSingleKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddKey() }}
                      placeholder="sk-... (paste one key at a time)"
                      className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Add Button */}
                  <div className="flex items-end">
                    <Button
                      variant="primary"
                      onClick={handleAddKey}
                      className="w-full"
                      isLoading={createMutation.isPending || addKeyMutation.isPending}
                      disabled={!selectedProviderType || !singleKey.trim()}
                    >
                      <Plus className="w-4 h-4" />
                      Add Key
                    </Button>
                  </div>
                </div>

                {/* Custom provider fields */}
                {isCustom && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/[0.06]">
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Name *</label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                        placeholder="my-custom-ai"
                        className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Display Name *</label>
                      <input
                        type="text"
                        value={customDisplayName}
                        onChange={(e) => setCustomDisplayName(e.target.value)}
                        placeholder="My Custom AI"
                        className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1">Base URL *</label>
                      <input
                        type="url"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                        placeholder="https://api.example.com/v1"
                        className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-white/50 mb-1">Model</label>
                        <input
                          type="text"
                          value={customDefaultModel}
                          onChange={(e) => setCustomDefaultModel(e.target.value)}
                          placeholder="model-name"
                          className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-white/50 mb-1">Models (csv)</label>
                        <input
                          type="text"
                          value={customModels}
                          onChange={(e) => setCustomModels(e.target.value)}
                          placeholder="model1, model2"
                          className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!isCustom && selectedProviderType && (
                  <div className="flex items-center gap-4 pt-2 border-t border-white/[0.06] text-xs text-white/40">
                    {(() => {
                      const pt = PROVIDER_TYPES.find(t => t.type === selectedProviderType)
                      if (!pt) return null
                      return (
                        <>
                          <span>{pt.baseUrl}</span>
                          <span>·</span>
                          <span>Models: {pt.models.join(', ')}</span>
                          <span>·</span>
                          <span>Default: {pt.defaultModel}</span>
                        </>
                      )
                    })()}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <Button variant="secondary" onClick={() => setShowAddPanel(false)}>
                    Done
                  </Button>
                  <span className="text-[11px] text-white/30">
                    Keys are automatically added to the same provider for rotation
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {loadingStatus || loadingConfigs ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-white/5" />
          ))
        ) : allProviderNames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Cpu className="w-12 h-12 mb-3" />
            <p className="text-sm">No providers configured</p>
            <p className="text-xs mt-1">Click "Add API Key" and select a provider type</p>
          </div>
        ) : (
          allProviderNames.map((name) => {
            const status = providerStatuses.find((p: any) => p.name === name)
            const config = providerConfigs.find((c) => c.name === name)
            const isExpanded = expandedConfigs.has(name)
            const keysCount = config?.apiKeys.length || 0

            return (
              <Card key={name} className="group hover:border-white/[0.12] transition-all duration-300">
                <CardContent className="p-5">
                  {/* Summary Row */}
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleExpanded(name)}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-br',
                        getProviderLogo(name)
                      )}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{config?.displayName || name}</h3>
                          {status && (
                            <Badge variant={
                              status.healthy === true ? 'success' :
                              status.isConfigured ? 'warning' : 'error'
                            }>
                              {status.healthy === true ? 'Healthy' :
                               status.isConfigured ? 'Not Tested' : 'Not Configured'}
                            </Badge>
                          )}
                          {config && (
                            <Badge variant={config.isEnabled ? 'success' : 'default'}>
                              {config.isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          )}
                          <Badge variant="info">{keysCount} key(s)</Badge>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          {config?.baseUrl || 'Not configured'}
                          {status && status.latencyMs > 0 && ` · ${status.latencyMs}ms`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTestConnection(name) }}
                            className="p-2 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                            title="Test connection"
                          >
                            {testingNames.has(name) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMutation.mutate({ name, isEnabled: !config.isEnabled })
                            }}
                            className={cn(
                              'p-2 rounded-lg transition-all',
                              config.isEnabled
                                ? 'text-green-400/50 hover:text-green-400 hover:bg-green-500/10'
                                : 'text-red-400/50 hover:text-red-400 hover:bg-red-500/10'
                            )}
                            title={config.isEnabled ? 'Disable' : 'Enable'}
                          >
                            {config.isEnabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(name) }}
                            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpanded(name) }}
                        className="p-2 rounded-lg text-white/30 hover:text-white/70 transition-all"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && config && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4">
                          {/* API Keys */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                API Keys (Rotation) — {keysCount} keys
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {config.apiKeys.map((entry) => (
                                <div
                                  key={entry._id || entry.key}
                                  className={cn(
                                    'flex items-center justify-between p-2 rounded-lg border',
                                    entry.isActive
                                      ? 'bg-white/[0.03] border-white/[0.06]'
                                      : 'bg-red-500/5 border-red-500/20'
                                  )}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Key className="w-3 h-3 text-white/30 shrink-0" />
                                    <code className="text-xs text-white/60 font-mono truncate">
                                      {showKeys.has(entry._id || entry.key)
                                        ? entry.key
                                        : maskKey(entry.key)}
                                    </code>
                                    <button
                                      onClick={() => toggleShowKey(entry._id || entry.key)}
                                      className="text-white/20 hover:text-white/50 shrink-0"
                                    >
                                      {showKeys.has(entry._id || entry.key)
                                        ? <EyeOff className="w-3 h-3" />
                                        : <Eye className="w-3 h-3" />}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-white/30">
                                      {entry.failureCount > 0 && `${entry.failureCount} failure(s)`}
                                      {entry.lastUsed ? ` · last used ${new Date(entry.lastUsed).toLocaleDateString()}` : ''}
                                    </span>
                                    {!entry.isActive && (
                                      <Badge variant="error" className="text-[10px]">Inactive</Badge>
                                    )}
                                    {entry._id && (
                                      <button
                                        onClick={() => deleteKeyMutation.mutate({ name, keyId: entry._id! })}
                                        className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10"
                                      >
                                        <XCircle className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Add Key inline */}
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                value={newKeyInputs[name] || ''}
                                onChange={(e) => setNewKeyInputs({ ...newKeyInputs, [name]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newKeyInputs[name]?.trim()) {
                                    addKeyMutation.mutate({ name, key: newKeyInputs[name].trim() })
                                    setNewKeyInputs({ ...newKeyInputs, [name]: '' })
                                  }
                                }}
                                placeholder="Paste another key for rotation..."
                                className="flex-1 h-8 px-3 rounded-lg bg-white/5 border border-white/[0.08] text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                              />
                              <button
                                onClick={() => {
                                  if (newKeyInputs[name]?.trim()) {
                                    addKeyMutation.mutate({ name, key: newKeyInputs[name].trim() })
                                    setNewKeyInputs({ ...newKeyInputs, [name]: '' })
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all"
                              >
                                Add Key
                              </button>
                            </div>
                          </div>

                          {/* Models */}
                          {config.models && config.models.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2">Models</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {config.models.map((model) => (
                                  <span
                                    key={model}
                                    className={cn(
                                      'px-2 py-0.5 rounded-md text-[11px] border',
                                      model === config.defaultModel
                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        : 'bg-white/5 text-white/50 border-white/[0.06]'
                                    )}
                                  >
                                    {model}
                                    {model === config.defaultModel && ' (default)'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Test Result */}
                          {testMutation.data && testMutation.variables === name && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-green-400">
                                Connection successful! Latency: {testMutation.data.data.latency}ms
                              </span>
                            </div>
                          )}
                          {testMutation.isError && testMutation.variables === name && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-xs text-red-400">
                                {(testMutation.error as any)?.response?.data?.error?.message || 'Connection failed'}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
