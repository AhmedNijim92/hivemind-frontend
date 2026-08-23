import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/store/chat-store";

describe("ChatStore", () => {
  beforeEach(() => {
    useChatStore.setState({ conversations: [], messages: {}, reactions: {} });
  });

  describe("DM conversations", () => {
    it("should create a DM conversation", () => {
      const store = useChatStore.getState();
      const conv = store.getOrCreateDm("user1", "user2", "Ahmed", null);

      expect(conv).toBeDefined();
      expect(conv.type).toBe("dm");
      expect(conv.participantIds).toContain("user1");
      expect(conv.participantIds).toContain("user2");
    });

    it("should not duplicate DM conversations", () => {
      const store = useChatStore.getState();
      const conv1 = store.getOrCreateDm("user1", "user2", "Ahmed", null);
      const conv2 = useChatStore.getState().getOrCreateDm("user1", "user2", "Ahmed", null);

      expect(conv1.id).toBe(conv2.id);
      expect(useChatStore.getState().conversations.length).toBe(1);
    });
  });

  describe("Messages", () => {
    it("should send a message", () => {
      const store = useChatStore.getState();
      const conv = store.getOrCreateDm("user1", "user2", "Ahmed", null);
      const msg = useChatStore.getState().sendMessage(conv.id, "user1", "Ahmed", "Hello!");

      expect(msg).toBeDefined();
      expect(msg.content).toBe("Hello!");
      expect(msg.senderId).toBe("user1");
      expect(msg.senderName).toBe("Ahmed");
    });

    it("should store messages in correct conversation", () => {
      const store = useChatStore.getState();
      const conv = store.getOrCreateDm("user1", "user2", "Ahmed", null);
      useChatStore.getState().sendMessage(conv.id, "user1", "Ahmed", "Hi");
      useChatStore.getState().sendMessage(conv.id, "user2", "Omar", "Hey");

      const messages = useChatStore.getState().messages[conv.id];
      expect(messages).toHaveLength(2);
      expect(messages[0].content).toBe("Hi");
      expect(messages[1].content).toBe("Hey");
    });

    it("should delete a message", () => {
      const store = useChatStore.getState();
      const conv = store.getOrCreateDm("user1", "user2", "Ahmed", null);
      const msg = useChatStore.getState().sendMessage(conv.id, "user1", "Ahmed", "Delete me");
      useChatStore.getState().deleteMessage(conv.id, msg.id);

      const messages = useChatStore.getState().messages[conv.id];
      const deleted = messages.find((m) => m.id === msg.id);
      expect(deleted?.deleted).toBe(true);
    });
  });

  describe("Reactions", () => {
    it("should add a reaction to a message", () => {
      const store = useChatStore.getState();
      store.reactToMessage("conv1", "msg1", "❤️", "user1");

      const reactions = useChatStore.getState().reactions["msg1"];
      expect(reactions).toBeDefined();
      expect(reactions["❤️"]).toContain("user1");
    });

    it("should toggle reaction off when same emoji tapped again", () => {
      const store = useChatStore.getState();
      store.reactToMessage("conv1", "msg1", "❤️", "user1");
      useChatStore.getState().reactToMessage("conv1", "msg1", "❤️", "user1");

      const reactions = useChatStore.getState().reactions["msg1"];
      expect(reactions["❤️"]).toBeUndefined();
    });

    it("should only allow one reaction per user per message", () => {
      const store = useChatStore.getState();
      store.reactToMessage("conv1", "msg1", "❤️", "user1");
      useChatStore.getState().reactToMessage("conv1", "msg1", "🔥", "user1");

      const reactions = useChatStore.getState().reactions["msg1"];
      expect(reactions["❤️"]).toBeUndefined();
      expect(reactions["🔥"]).toContain("user1");
    });

    it("should allow multiple users to react to same message", () => {
      const store = useChatStore.getState();
      store.reactToMessage("conv1", "msg1", "❤️", "user1");
      useChatStore.getState().reactToMessage("conv1", "msg1", "❤️", "user2");

      const reactions = useChatStore.getState().reactions["msg1"];
      expect(reactions["❤️"]).toHaveLength(2);
      expect(reactions["❤️"]).toContain("user1");
      expect(reactions["❤️"]).toContain("user2");
    });
  });

  describe("Conversation management", () => {
    it("should pin a conversation", () => {
      const store = useChatStore.getState();
      const conv = store.getOrCreateDm("user1", "user2", "Ahmed", null);
      useChatStore.getState().pinConversation(conv.id);

      const updated = useChatStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.pinned).toBe(true);
    });

    it("should mute a conversation", () => {
      const store = useChatStore.getState();
      const conv = store.getOrCreateDm("user1", "user2", "Ahmed", null);
      useChatStore.getState().muteConversation(conv.id);

      const updated = useChatStore.getState().conversations.find((c) => c.id === conv.id);
      expect(updated?.muted).toBe(true);
    });
  });
});
