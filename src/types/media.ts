// ─── Media Service DTOs ───────────────────────────────────────────────────────

export type MediaReferenceType = "POST" | "GROUP" | "USER_AVATAR" | "COVER_PHOTO";

export interface MediaFileDto {
  mediaId: string;
  uploaderId: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  referenceId: string | null;
  referenceType: MediaReferenceType;
  createdAt: string;
}
