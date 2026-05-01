// ─── Post Service DTOs ────────────────────────────────────────────────────────

export interface PostDto {
  postId: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  mediaUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string; // LocalDateTime → ISO string
}

export interface CreatePostRequest {
  groupId: string;
  content: string;
  mediaUrl?: string;
}

export interface Comment {
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AddCommentRequest {
  content: string;
}
