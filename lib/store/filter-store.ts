import { create } from 'zustand'

interface FilterState {
  cameraFilter: string[]
  lensFilter: string[]
  tagsFilter: string[]
  tagsOperator: 'and' | 'or'
  sortByShootTime: 'desc' | 'asc' | undefined

  setCameraFilter: (filters: string[]) => void
  setLensFilter: (filters: string[]) => void
  setTagsFilter: (filters: string[]) => void
  setTagsOperator: (operator: 'and' | 'or') => void
  setSortByShootTime: (sort: 'desc' | 'asc' | undefined) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  cameraFilter: [],
  lensFilter: [],
  tagsFilter: [],
  tagsOperator: 'and',
  sortByShootTime: 'desc',

  setCameraFilter: (filters) => set({ cameraFilter: filters }),
  setLensFilter: (filters) => set({ lensFilter: filters }),
  setTagsFilter: (filters) => set({ tagsFilter: filters }),
  setTagsOperator: (operator) => set({ tagsOperator: operator }),
  setSortByShootTime: (sort) => set({ sortByShootTime: sort }),
  resetFilters: () => set({
    cameraFilter: [],
    lensFilter: [],
    tagsFilter: [],
    tagsOperator: 'and',
    sortByShootTime: 'desc',
  }),
}))
