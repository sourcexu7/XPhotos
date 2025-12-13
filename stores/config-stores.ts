import { createStore } from 'zustand/vanilla'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ConfigState = {
  customIndexDownloadEnable: boolean
}

export type ConfigActions = {
  setCustomIndexDownloadEnable: (albumAdd: boolean) => void
}

export type ConfigStore = ConfigState & ConfigActions

export const initConfigStore = (): ConfigState => {
  return {
    customIndexDownloadEnable: false,
  }
}

export const defaultInitState: ConfigState = {
  customIndexDownloadEnable: false,
}

export const createConfigStore = (initState: ConfigState = defaultInitState) => {
  return createStore<ConfigStore>()(
    persist(
      (set) => ({
        ...initState,
        setCustomIndexDownloadEnable: (customIndexDownloadEnable) =>
          set({ customIndexDownloadEnable }),
      }),
      {
        name: 'pic-impact-config-storage',
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
      }
    )
  )
}