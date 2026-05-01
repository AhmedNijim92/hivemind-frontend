"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendOtp, useSignin } from "@/hooks/use-auth";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  mobileNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Enter a valid phone number (e.g. +1234567890)"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "Digits only"),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

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
    await sendOtp.mutateAsync({ mobileNumber: data.mobileNumber });
    setMobileNumber(data.mobileNumber);
    setStep("otp");
  };

  const onVerifyOtp = async (data: OtpForm) => {
    await signin.mutateAsync({ mobileNumber, otp: data.otp });
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {step === "phone" ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-6">
              <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign in to HiveMind
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                Enter your mobile number to receive a one-time code
              </p>
            </div>

            <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
              <Input
                label="Mobile number"
                placeholder="+1 234 567 8900"
                type="tel"
                autoComplete="tel"
                error={phoneForm.formState.errors.mobileNumber?.message}
                {...phoneForm.register("mobileNumber")}
              />
              <Button
                type="submit"
                className="w-full"
                loading={sendOtp.isPending}
              >
                Send OTP
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="mb-6">
              <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Enter your code
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {mobileNumber}
                </span>
              </p>
            </div>

            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
              <Input
                label="One-time password"
                placeholder="123456"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                error={otpForm.formState.errors.otp?.message}
                {...otpForm.register("otp")}
              />
              <Button
                type="submit"
                className="w-full"
                loading={signin.isPending}
              >
                Verify & Sign in
              </Button>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm text-gray-500 hover:text-brand-500 transition-colors"
              >
                ← Use a different number
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
