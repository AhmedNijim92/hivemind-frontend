// ─── User Service DTOs ────────────────────────────────────────────────────────

export interface UserProfileDto {
  userId: string;
  mobileNumber: string;
  name: string;
  email: string;
  bio: string | null;
  profilePictureUrl: string | null;
  coverPictureUrl: string | null;
  showContactInfo: boolean;
  createdAt: string; // LocalDate → ISO string
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
  coverPictureUrl?: string;
  showContactInfo?: boolean;
}

export interface FollowResponse {
  message: string;
}
