// ─── Stories (group-based, similar to posts) ──────────────────────────────────

export interface Story {
  id: string;
  groupId: string;
  groupName: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  mediaUrl: string;
  caption: string | null;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string (24h after creation)
  viewedBy: string[]; // userIds who viewed
}

export interface StoryGroup {
  groupId: string;
  groupName: string;
  groupAvatar: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}
