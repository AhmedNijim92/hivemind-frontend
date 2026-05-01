// ─── User Service DTOs ────────────────────────────────────────────────────────

export interface UserProfileDto {
  userId: string;
  mobileNumber: string;
  name: string;
  email: string;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: string; // LocalDate → ISO string
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  bio?: string;
  profilePictureUrl?: string;
}

export interface FollowResponse {
  message: string;
}
