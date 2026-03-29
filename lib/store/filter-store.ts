import { create } from 'zustand'

interface FilterState {
  // 筛选状态
  cameraFilter: string[]
  lensFilter: string[]
  tagsFilter: string[]
  tagsOperator: 'and' | 'or'
  sortByShootTime: 'desc' | 'asc' | undefined
  dateRange: { start: string; end: string }
  imageTypeFilter: string[]
  
  // 操作方法
  setCameraFilter: (filters: string[]) => void
  setLensFilter: (filters: string[]) => void
  setTagsFilter: (filters: string[]) => void
  setTagsOperator: (operator: 'and' | 'or') => void
  setSortByShootTime: (sort: 'desc' | 'asc' | undefined) => void
  setDateRange: (range: { start: string; end: string }) => void
  setImageTypeFilter: (filters: string[]) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  // 初始状态
  cameraFilter: [],
  lensFilter: [],
  tagsFilter: [],
  tagsOperator: 'and',
  sortByShootTime: 'desc',
  dateRange: { start: '', end: '' },
  imageTypeFilter: [],
  
  // 操作方法
  setCameraFilter: (filters) => set({ cameraFilter: filters }),
  setLensFilter: (filters) => set({ lensFilter: filters }),
  setTagsFilter: (filters) => set({ tagsFilter: filters }),
  setTagsOperator: (operator) => set({ tagsOperator: operator }),
  setSortByShootTime: (sort) => set({ sortByShootTime: sort }),
  setDateRange: (range) => set({ dateRange: range }),
  setImageTypeFilter: (filters) => set({ imageTypeFilter: filters }),
  resetFilters: () => set({
    cameraFilter: [],
    lensFilter: [],
    tagsFilter: [],
    tagsOperator: 'and',
    sortByShootTime: 'desc',
    dateRange: { start: '', end: '' },
    imageTypeFilter: [],
  }),
}))