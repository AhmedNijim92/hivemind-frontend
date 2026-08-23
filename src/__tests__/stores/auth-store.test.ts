import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth-store";

describe("AuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, userId: null, role: null, isAuthenticated: false });
  });

  it("should start with no authentication", () => {
    const { token, userId, role, isAuthenticated } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(userId).toBeNull();
    expect(role).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it("should set auth data on login", () => {
    const store = useAuthStore.getState();
    store.setAuth({ token: "test-token-123", userId: "user-id-456", role: "USER", name: "Ahmed" });

    const state = useAuthStore.getState();
    expect(state.token).toBe("test-token-123");
    expect(state.userId).toBe("user-id-456");
    expect(state.role).toBe("USER");
    expect(state.isAuthenticated).toBe(true);
  });

  it("should clear auth data on logout", () => {
    const store = useAuthStore.getState();
    store.setAuth({ token: "token", userId: "id", role: "USER", name: "Name" });
    useChatStore_reset();
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

function useChatStore_reset() {} // placeholder — logout may clear other stores
