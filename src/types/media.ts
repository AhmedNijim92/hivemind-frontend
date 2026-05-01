// ─── Media Service DTOs ───────────────────────────────────────────────────────

export type MediaReferenceType = "POST" | "GROUP" | "USER_AVATAR";

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
