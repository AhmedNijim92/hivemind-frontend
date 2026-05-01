// ─── Group Service DTOs ───────────────────────────────────────────────────────

export type GroupPrivacy = "PUBLIC" | "PRIVATE";
export type MemberRole = "ADMIN" | "MODERATOR" | "MEMBER";

export interface GroupDto {
  groupId: string;
  creatorId: string;
  name: string;
  description: string | null;
  privacy: GroupPrivacy;
  memberCount: number;
  createdAt: string; // LocalDateTime → ISO string
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  privacy?: GroupPrivacy;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface ApiResponse {
  message: string;
}
