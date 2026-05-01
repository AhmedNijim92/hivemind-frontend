/**
 * UI store — ephemeral state for modals, sidebars, active group context.
 */
import { create } from "zustand";

interface UIStore {
  // Active group context (used across feed/posts/meetings)
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;

  // Create post modal
  isCreatePostOpen: boolean;
  openCreatePost: () => void;
  closeCreatePost: () => void;

  // Create group modal
  isCreateGroupOpen: boolean;
  openCreateGroup: () => void;
  closeCreateGroup: () => void;

  // Mobile sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;

  // Search dialog
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeGroupId: null,
  setActiveGroupId: (id) => set({ activeGroupId: id }),

  isCreatePostOpen: false,
  openCreatePost: () => set({ isCreatePostOpen: true }),
  closeCreatePost: () => set({ isCreatePostOpen: false }),

  isCreateGroupOpen: false,
  openCreateGroup: () => set({ isCreateGroupOpen: true }),
  closeCreateGroup: () => set({ isCreateGroupOpen: false }),

  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  isSearchOpen: false,
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
}));
