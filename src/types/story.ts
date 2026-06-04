// ─── Stories (client-side only) ───────────────────────────────────────────────

export interface Story {
  id: string;
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
  userId: string;
  userName: string;
  userAvatar: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}
