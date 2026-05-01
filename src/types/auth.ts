// ─── Auth Service DTOs ────────────────────────────────────────────────────────

export interface SendOtpRequest {
  mobileNumber: string; // E.164 format: +1234567890
}

export interface SendOtpResponse {
  message: string;
}

export interface SigninRequest {
  mobileNumber: string;
  otp: string;
}

export interface CreateUserRequest {
  mobileNumber: string;
  name: string;
  email: string;
}

export interface JwtAuthResponse {
  token: string;
  userId: string; // UUID as string
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
}

// Decoded JWT payload shape (for client-side use)
export interface JwtPayload {
  sub: string;       // userId
  userId: string;
  role: string;
  email: string;
  exp: number;
  iat: number;
}

// Auth store shape
export interface AuthState {
  token: string | null;
  userId: string | null;
  role: string | null;
  isAuthenticated: boolean;
}
