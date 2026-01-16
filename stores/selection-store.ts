import { create } from 'zustand'

interface SelectionState {
  selectedIds: Set<string>;
  isSelectionMode: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  setSelectionMode: (isActive: boolean) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: new Set(),
  isSelectionMode: false,

  add: (id) => {
    set((state) => ({ selectedIds: new Set(state.selectedIds).add(id) }));
  },

  remove: (id) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(id);
      return { selectedIds: newSelectedIds };
    });
  },

  toggle: (id) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      // 如果取消选择后没有任何选中的图片，则退出选择模式
      const isSelectionMode = newSelectedIds.size > 0;
      return { selectedIds: newSelectedIds, isSelectionMode };
    });
  },

  clear: () => {
    set({ selectedIds: new Set(), isSelectionMode: false });
  },

  setSelectionMode: (isActive) => {
    // 进入选择模式时不清空，退出时清空
    if (!isActive) {
      set({ isSelectionMode: isActive, selectedIds: new Set() });
    } else {
      set({ isSelectionMode: isActive });
    }
  },
}));

