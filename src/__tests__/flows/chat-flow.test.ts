import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "@/store/chat-store";

/**
 * Tests the full chat flow as a user would experience it:
 * - Start a DM → send messages → react → delete → manage conversation
 * - Group chat creation and messaging
 */
describe("Chat Flow", () => {
  beforeEach(() => {
    useChatStore.setState({ conversations: [], messages: {}, reactions: {} });
  });

  describe("DM Conversation Flow", () => {
    it("should simulate a complete DM conversation between two users", () => {
      const store = useChatStore.getState;

      // User A starts a DM with User B
      const conv = store().getOrCreateDm("alice", "bob", "Bob", "/avatar/bob.jpg");
      expect(conv.type).toBe("dm");
      expect(conv.participantNames["bob"]).toBe("Bob");
      expect(conv.participantAvatars["bob"]).toBe("/avatar/bob.jpg");

      // Alice sends first message
      const msg1 = store().sendMessage(conv.id, "alice", "Alice", "Hey Bob!");
      expect(msg1.content).toBe("Hey Bob!");
      expect(msg1.read).toBe(false);

      // Bob replies
      const msg2 = store().sendMessage(conv.id, "bob", "Bob", "Hi Alice! How are you?");
      expect(store().messages[conv.id]).toHaveLength(2);

      // Conversation should have updated lastMessage
      const updated = store().conversations.find((c) => c.id === conv.id);
      expect(updated?.lastMessage?.content).toBe("Hi Alice! How are you?");

      // Alice reacts to Bob's message
      store().reactToMessage(conv.id, msg2.id, "❤️", "alice");
      expect(store().reactions[msg2.id]["❤️"]).toContain("alice");

      // Alice deletes her own message
      store().deleteMessage(conv.id, msg1.id);
      const deleted = store().messages[conv.id].find((m) => m.id === msg1.id);
      expect(deleted?.deleted).toBe(true);

      // Bob's message should still exist
      const bobMsg = store().messages[conv.id].find((m) => m.id === msg2.id);
      expect(bobMsg?.deleted).toBe(false);
    });

    it("should maintain conversation order by last message time", () => {
      const store = useChatStore.getState;

      // Create two conversations
      const conv1 = store().getOrCreateDm("user", "alice", "Alice", null);
      const conv2 = store().getOrCreateDm("user", "bob", "Bob", null);

      // Send in conv1 first
      store().sendMessage(conv1.id, "user", "User", "Hi Alice");

      // Then send in conv2
      store().sendMessage(conv2.id, "user", "User", "Hi Bob");

      // conv2 should be first (most recent activity)
      const convs = store().getConversations("user");
      expect(convs[0].id).toBe(conv2.id);
    });
  });

  describe("Group Chat Flow", () => {
    it("should create a group chat and support multiple participants", () => {
      const store = useChatStore.getState;

      const members = ["alice", "bob", "charlie"];
      const names: Record<string, string> = { alice: "Alice", bob: "Bob", charlie: "Charlie" };
      const avatars: Record<string, string | null> = { alice: null, bob: null, charlie: null };

      const conv = store().getOrCreateGroupChat("group-123", "Study Group", members, names, avatars);
      expect(conv.type).toBe("group");
      expect(conv.groupName).toBe("Study Group");
      expect(conv.participantIds).toHaveLength(3);

      // Multiple people can send messages
      store().sendMessage(conv.id, "alice", "Alice", "Hey everyone!");
      store().sendMessage(conv.id, "bob", "Bob", "What's up?");
      store().sendMessage(conv.id, "charlie", "Charlie", "Ready to study?");

      expect(store().messages[conv.id]).toHaveLength(3);
    });
  });

  describe("Unread Count Flow", () => {
    it("should track unread messages correctly", () => {
      const store = useChatStore.getState;

      const conv = store().getOrCreateDm("alice", "bob", "Bob", null);
      store().sendMessage(conv.id, "bob", "Bob", "Msg 1");
      store().sendMessage(conv.id, "bob", "Bob", "Msg 2");

      // Mark as read
      store().markConversationRead(conv.id, "alice");
      const msgs = store().messages[conv.id];
      expect(msgs.every((m) => m.read)).toBe(true);
    });
  });

  describe("Image Messages", () => {
    it("should send a message with an image URL", () => {
      const store = useChatStore.getState;
      const conv = store().getOrCreateDm("alice", "bob", "Bob", null);

      const msg = store().sendMessage(conv.id, "alice", "Alice", "Check this out!", "/api/v1/media/123/download");
      expect(msg.imageUrl).toBe("/api/v1/media/123/download");
      expect(msg.content).toBe("Check this out!");
    });
  });
});
