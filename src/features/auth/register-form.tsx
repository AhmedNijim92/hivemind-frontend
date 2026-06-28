"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Phone, KeyRound, ArrowRight, User, Mail, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSendOtp, useCreateUser } from "@/hooks/use-auth";

const infoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  mobileNumber: z
    .string()
    .min(8, "Enter your number with country code (e.g. +46707518829)")
    .refine((val) => /^\+[1-9]\d{7,14}$/.test(val.replace(/[\s\-\(\)]/g, "")), {
      message: "Enter a valid phone number (e.g. +46707518829)",
    }),
});

type InfoForm = z.infer<typeof infoSchema>;
type Step = "info" | "otp";

export function RegisterForm() {
  const [step, setStep] = useState<Step>("info");
  const [formData, setFormData] = useState<InfoForm | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const sendOtp = useSendOtp();
  const createUser = useCreateUser();

  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    defaultValues: { name: "", email: "", mobileNumber: "" },
  });

  const onSubmitInfo = async (data: InfoForm) => {
    const cleanNumber = data.mobileNumber.replace(/[\s\-\(\)]/g, "");
    try {
      await sendOtp.mutateAsync({ mobileNumber: cleanNumber });
    } catch {
      // Error shown via toast
    }
    setFormData({ ...data, mobileNumber: cleanNumber });
    setStep("otp");
  };

  const onCreateAccount = () => {
    if (!formData) return;
    createUser.mutate(formData);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-1 flex-1 rounded-full bg-brand-500" />
        <div className={`h-1 flex-1 rounded-full transition-colors ${step === "otp" ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
      </div>

      <AnimatePresence mode="wait">
        {step === "info" ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/25">
                <UserPlus className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Join HiveMind
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Create your account. No passwords — just your phone.
              </p>
            </div>

            <form onSubmit={infoForm.handleSubmit(onSubmitInfo)} className="space-y-4">
              <Input
                label="Full name"
                placeholder="Your display name"
                autoComplete="name"
                icon={<User className="h-4 w-4" />}
                error={infoForm.formState.errors.name?.message}
                {...infoForm.register("name")}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                icon={<Mail className="h-4 w-4" />}
                error={infoForm.formState.errors.email?.message}
                {...infoForm.register("email")}
              />
              <Input
                label="Mobile number"
                type="tel"
                placeholder="+46707518829"
                autoComplete="tel"
                icon={<Phone className="h-4 w-4" />}
                hint="We'll send a verification code"
                error={infoForm.formState.errors.mobileNumber?.message}
                {...infoForm.register("mobileNumber")}
              />
              <Button type="submit" className="w-full" loading={sendOtp.isPending}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/25">
                <KeyRound className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Verify your number
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{formData?.mobileNumber}</span>
              </p>
            </div>

            {/* Preview card */}
            <div className="mb-5 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{formData?.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formData?.name}</p>
                <p className="text-[11px] text-gray-400">{formData?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Verification code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full text-center text-2xl tracking-[0.4em] font-mono px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
              </div>
              <Button
                className="w-full"
                onClick={onCreateAccount}
                loading={createUser.isPending}
                disabled={otpCode.length !== 6}
              >
                <Sparkles className="h-4 w-4" /> Create Account
              </Button>
              <button
                type="button"
                onClick={() => setStep("info")}
                className="w-full text-sm text-gray-400 hover:text-brand-500 transition-colors py-2"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
