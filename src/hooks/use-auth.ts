import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import type {
  SendOtpRequest,
  SigninRequest,
  CreateUserRequest,
} from "@/types";

export function useSendOtp() {
  return useMutation({
    mutationFn: (data: SendOtpRequest) => authService.sendOtp(data),
    onSuccess: () => toast.success("OTP sent to your mobile number"),
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to send OTP"),
  });
}

export function useSignin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SigninRequest) => authService.signin(data),
    onSuccess: (data) => {
      setAuth(data);
      toast.success("Welcome back!");
      router.push("/feed");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Invalid OTP"),
  });
}

export function useCreateUser() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: CreateUserRequest) => authService.createUser(data),
    onSuccess: (data) => {
      setAuth(data);
      toast.success("Account created! Welcome to HiveMind 🎉");
      router.push("/onboarding");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Registration failed"),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return () => {
    logout();
    router.push("/login");
    toast.success("Logged out");
  };
}
