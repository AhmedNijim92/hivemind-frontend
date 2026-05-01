import { apiClient } from "./api-client";
import type {
  SendOtpRequest,
  SendOtpResponse,
  SigninRequest,
  CreateUserRequest,
  JwtAuthResponse,
} from "@/types";

export const authService = {
  /** Step 1: Request OTP to mobile number */
  sendOtp: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
    const res = await apiClient.post<SendOtpResponse>(
      "/api/v1/auth/sendOtp",
      data
    );
    return res.data;
  },

  /** Step 2: Verify OTP and get JWT */
  signin: async (data: SigninRequest): Promise<JwtAuthResponse> => {
    const res = await apiClient.post<JwtAuthResponse>(
      "/api/v1/auth/signin",
      data
    );
    return res.data;
  },

  /** Register new user (also returns JWT) */
  createUser: async (data: CreateUserRequest): Promise<JwtAuthResponse> => {
    const res = await apiClient.post<JwtAuthResponse>(
      "/api/v1/auth/createUser",
      data
    );
    return res.data;
  },
};
