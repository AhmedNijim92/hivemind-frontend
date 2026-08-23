import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/store/ui-store";

describe("UIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      activeGroupId: null,
      isCreatePostOpen: false,
      isCreateGroupOpen: false,
      isSidebarOpen: false,
      isSearchOpen: false,
    });
  });

  describe("Create Post Modal", () => {
    it("should open and close post modal", () => {
      useUIStore.getState().openCreatePost();
      expect(useUIStore.getState().isCreatePostOpen).toBe(true);

      useUIStore.getState().closeCreatePost();
      expect(useUIStore.getState().isCreatePostOpen).toBe(false);
    });
  });

  describe("Create Group Modal", () => {
    it("should open and close group modal", () => {
      useUIStore.getState().openCreateGroup();
      expect(useUIStore.getState().isCreateGroupOpen).toBe(true);

      useUIStore.getState().closeCreateGroup();
      expect(useUIStore.getState().isCreateGroupOpen).toBe(false);
    });
  });

  describe("Sidebar", () => {
    it("should toggle sidebar", () => {
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(true);
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });

    it("should close sidebar", () => {
      useUIStore.getState().toggleSidebar(); // open
      useUIStore.getState().closeSidebar();
      expect(useUIStore.getState().isSidebarOpen).toBe(false);
    });
  });

  describe("Search", () => {
    it("should open and close search", () => {
      useUIStore.getState().openSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(true);

      useUIStore.getState().closeSearch();
      expect(useUIStore.getState().isSearchOpen).toBe(false);
    });
  });
});
