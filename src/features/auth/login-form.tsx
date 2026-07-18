"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, KeyRound, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendOtp, useSignin } from "@/hooks/use-auth";

const phoneSchema = z.object({
  mobileNumber: z
    .string()
    .min(8, "Enter your number with country code (e.g. +46707518829)")
    .refine((val) => /^\+[1-9]\d{7,14}$/.test(val.replace(/[\s\-\(\)]/g, "")), {
      message: "Enter a valid phone number (e.g. +46707518829)",
    }),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "Digits only"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export function LoginForm() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobileNumber, setMobileNumber] = useState("");

  const sendOtp = useSendOtp();
  const signin = useSignin();

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { mobileNumber: "" },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onSendOtp = async (data: PhoneForm) => {
    const cleanNumber = data.mobileNumber.replace(/[\s\-\(\)]/g, "");
    try {
      await sendOtp.mutateAsync({ mobileNumber: cleanNumber });
    } catch {}
    setMobileNumber(cleanNumber);
    setStep("otp");
  };

  const onVerifyOtp = async (data: OtpForm) => {
    await signin.mutateAsync({ mobileNumber, otp: data.otp });
  };

  if (step === "otp") {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-8">
          <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Enter your code
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{mobileNumber}</span>
          </p>
        </div>

        <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              One-time password
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              {...otpForm.register("otp")}
              className="w-full text-center text-2xl tracking-[0.4em] font-mono px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
            {otpForm.formState.errors.otp?.message && (
              <p className="text-red-500 text-xs mt-1.5">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" loading={signin.isPending}>
            Verify & Sign in
          </Button>

          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full text-sm text-gray-400 hover:text-brand-500 transition-colors py-2"
          >
            ← Use a different number
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
          <Phone className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Enter your mobile number to receive a one-time code
        </p>
      </div>

      <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
        <Input
          label="Mobile number"
          placeholder="+46707518829"
          type="tel"
          autoComplete="tel"
          icon={<Phone className="h-4 w-4" />}
          error={phoneForm.formState.errors.mobileNumber?.message}
          {...phoneForm.register("mobileNumber")}
        />
        <Button type="submit" className="w-full" loading={sendOtp.isPending}>
          Send OTP <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
