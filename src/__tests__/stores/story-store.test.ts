import { describe, it, expect, beforeEach } from "vitest";
import { useStoryStore } from "@/store/story-store";
import type { Story } from "@/types/story";

function createStory(overrides: Partial<Story> = {}): Story {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    groupId: "group-1",
    groupName: "Test Group",
    userId: "user-1",
    userName: "Ahmed",
    userAvatar: null,
    mediaUrl: "/media/test.jpg",
    caption: "Test story",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    viewedBy: ["user-1"],
    ...overrides,
  };
}

describe("StoryStore", () => {
  beforeEach(() => {
    useStoryStore.setState({ stories: [] });
  });

  it("should add a story", () => {
    const story = createStory();
    useStoryStore.getState().addStory(story);

    expect(useStoryStore.getState().stories).toHaveLength(1);
    expect(useStoryStore.getState().stories[0].id).toBe(story.id);
  });

  it("should mark a story as viewed", () => {
    const story = createStory({ viewedBy: ["user-1"] });
    useStoryStore.getState().addStory(story);
    useStoryStore.getState().viewStory(story.id, "user-2");

    const updated = useStoryStore.getState().stories[0];
    expect(updated.viewedBy).toContain("user-2");
  });

  it("should not duplicate viewer", () => {
    const story = createStory({ viewedBy: ["user-1"] });
    useStoryStore.getState().addStory(story);
    useStoryStore.getState().viewStory(story.id, "user-1");

    const updated = useStoryStore.getState().stories[0];
    expect(updated.viewedBy.filter((v) => v === "user-1")).toHaveLength(1);
  });

  it("should remove expired stories", () => {
    const expired = createStory({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const active = createStory({
      id: "active-story",
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    useStoryStore.setState({ stories: [expired, active] });
    useStoryStore.getState().removeExpired();

    expect(useStoryStore.getState().stories).toHaveLength(1);
    expect(useStoryStore.getState().stories[0].id).toBe("active-story");
  });

  it("should group stories by groupId", () => {
    const story1 = createStory({ groupId: "g1", groupName: "Group A" });
    const story2 = createStory({ groupId: "g1", groupName: "Group A", id: "s2" });
    const story3 = createStory({ groupId: "g2", groupName: "Group B", id: "s3" });

    useStoryStore.setState({ stories: [story1, story2, story3] });
    const groups = useStoryStore.getState().getGroupedStories("user-1");

    expect(groups).toHaveLength(2);
    const groupA = groups.find((g) => g.groupId === "g1");
    expect(groupA?.stories).toHaveLength(2);
  });

  it("should mark groups with unviewed stories", () => {
    const story = createStory({ viewedBy: [] }); // not viewed by anyone
    useStoryStore.setState({ stories: [story] });

    const groups = useStoryStore.getState().getGroupedStories("user-2");
    expect(groups[0].hasUnviewed).toBe(true);
  });
});
