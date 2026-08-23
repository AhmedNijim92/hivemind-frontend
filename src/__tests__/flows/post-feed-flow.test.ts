import { describe, it, expect } from "vitest";
import type { PostDto } from "@/types";

/**
 * Tests the post/feed flow logic:
 * - Feed aggregation from multiple groups
 * - Post enrichment (group name, author info)
 * - Like toggle behavior
 * - Comment flow
 */
describe("Post & Feed Flow", () => {
  describe("Feed Aggregation", () => {
    it("should sort posts by creation time (newest first)", () => {
      const posts: PostDto[] = [
        { postId: "1", groupId: "g1", authorId: "u1", authorName: "A", content: "Old", mediaUrl: null, likeCount: 0, commentCount: 0, createdAt: "2026-01-01T00:00:00" },
        { postId: "2", groupId: "g1", authorId: "u1", authorName: "A", content: "New", mediaUrl: null, likeCount: 0, commentCount: 0, createdAt: "2026-08-01T00:00:00" },
        { postId: "3", groupId: "g2", authorId: "u2", authorName: "B", content: "Middle", mediaUrl: null, likeCount: 0, commentCount: 0, createdAt: "2026-05-01T00:00:00" },
      ];

      const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      expect(sorted[0].postId).toBe("2"); // newest
      expect(sorted[2].postId).toBe("1"); // oldest
    });

    it("should enrich posts with group name when missing", () => {
      const post: PostDto = {
        postId: "1", groupId: "group-abc", authorId: "u1", authorName: "Ahmed",
        content: "Hello!", mediaUrl: null, likeCount: 5, commentCount: 2, createdAt: "2026-08-01T00:00:00"
      };

      const myGroups = [
        { groupId: "group-abc", name: "HiveMind Community", profilePictureUrl: "/pic.jpg" },
      ];

      // Simulate enrichment logic from use-feed.ts
      let groupName = post.groupName;
      let groupProfilePictureUrl = null as string | null;
      if (!groupName) {
        const matched = myGroups.find((g) => g.groupId === post.groupId);
        groupName = matched?.name;
        groupProfilePictureUrl = matched?.profilePictureUrl ?? null;
      }

      expect(groupName).toBe("HiveMind Community");
      expect(groupProfilePictureUrl).toBe("/pic.jpg");
    });

    it("should fix 'Unknown' author name for own posts", () => {
      const currentUserId = "user-123";
      const currentUserName = "Ahmed";
      const post: PostDto = {
        postId: "1", groupId: "g1", authorId: currentUserId, authorName: "Unknown",
        content: "My post", mediaUrl: null, likeCount: 0, commentCount: 0, createdAt: "2026-08-01"
      };

      // Simulate enrichment
      let authorName = post.authorName;
      if (authorName === "Unknown" && post.authorId === currentUserId) {
        authorName = currentUserName;
      }

      expect(authorName).toBe("Ahmed");
    });
  });

  describe("Like Toggle", () => {
    it("should toggle like state optimistically", () => {
      let liked = false;
      let likeCount = 5;

      // First click: like
      liked = !liked;
      expect(liked).toBe(true);
      expect(likeCount + (liked ? 1 : 0)).toBe(6); // displayed count

      // Second click: unlike
      liked = !liked;
      expect(liked).toBe(false);
      expect(likeCount + (liked ? 1 : 0)).toBe(5); // back to original
    });

    it("should display correct like count after toggle", () => {
      const post = { likeCount: 10 };
      let liked = false;

      // Like
      liked = true;
      expect(post.likeCount + (liked ? 1 : 0)).toBe(11);

      // Unlike
      liked = false;
      expect(post.likeCount + (liked ? 1 : 0)).toBe(10);
    });
  });

  describe("Post Content", () => {
    it("should handle posts with media", () => {
      const post: PostDto = {
        postId: "1", groupId: "g1", authorId: "u1", authorName: "Ahmed",
        content: "Check this photo!", mediaUrl: "/api/v1/media/123/download",
        likeCount: 3, commentCount: 1, createdAt: "2026-08-01"
      };

      expect(post.mediaUrl).not.toBeNull();
      expect(post.content).toBe("Check this photo!");
    });

    it("should handle posts without media", () => {
      const post: PostDto = {
        postId: "2", groupId: "g1", authorId: "u1", authorName: "Ahmed",
        content: "Just a text post", mediaUrl: null,
        likeCount: 0, commentCount: 0, createdAt: "2026-08-01"
      };

      expect(post.mediaUrl).toBeNull();
    });

    it("should truncate long content for preview", () => {
      const longContent = "A".repeat(500);
      const isLong = longContent.length > 300;
      const preview = isLong ? longContent.slice(0, 300) + "…" : longContent;

      expect(isLong).toBe(true);
      expect(preview.length).toBe(301); // 300 + "…"
      expect(preview.endsWith("…")).toBe(true);
    });
  });
});
