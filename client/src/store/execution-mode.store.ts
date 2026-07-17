import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExecutionMode } from '@/types'

interface ExecutionModeState {
  globalMode: ExecutionMode
  isLoading: boolean
  setGlobalMode: (mode: ExecutionMode) => void
  setLoading: (loading: boolean) => void
}

export const useExecutionModeStore = create<ExecutionModeState>()(
  persist(
    (set) => ({
      globalMode: 'AUTO',
      isLoading: false,
      setGlobalMode: (mode) => set({ globalMode: mode }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'execution-mode-storage',
      partialize: (state) => ({
        globalMode: state.globalMode,
      }),
    }
  )
)
