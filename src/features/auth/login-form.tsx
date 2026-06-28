"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, KeyRound, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendOtp, useSignin } from "@/hooks/use-auth";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  mobileNumber: z
    .string()
    .transform((val) => val.replace(/[\s\-\(\)]/g, "")) // Strip spaces, dashes, parens
    .pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Enter your number with country code (e.g. +46707518829)")),
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
            initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -30, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-lg shadow-brand-500/25"
              >
                <Phone className="h-7 w-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-display">
                Welcome back
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                Enter your mobile number to receive a one-time code
              </p>
            </div>

            <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-5">
              <Input
                label="Mobile number"
                placeholder="+46707518829"
                type="tel"
                autoComplete="tel"
                icon={<Phone className="h-4 w-4" />}
                error={phoneForm.formState.errors.mobileNumber?.message}
                {...phoneForm.register("mobileNumber")}
              />
              <Button
                type="submit"
                variant="gradient"
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
            initial={{ opacity: 0, x: 30, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 30, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
                className="h-14 w-14 rounded-2xl bg-gradient-brand flex items-center justify-center mb-5 shadow-lg shadow-brand-500/25"
              >
                <KeyRound className="h-7 w-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-display">
                Enter your code
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {mobileNumber}
                </span>
              </p>
            </div>

            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-5">
              <Input
                label="One-time password"
                placeholder="000000"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                icon={<Sparkles className="h-4 w-4" />}
                error={otpForm.formState.errors.otp?.message}
                {...otpForm.register("otp")}
                className="text-center text-2xl tracking-[0.5em] font-mono"
              />
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                loading={signin.isPending}
              >
                Verify & Sign in
              </Button>
              <motion.button
                whileHover={{ x: -4 }}
                type="button"
                onClick={() => setStep("phone")}
                className="w-full text-sm text-gray-500 hover:text-brand-500 transition-colors py-2"
              >
                ← Use a different number
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
