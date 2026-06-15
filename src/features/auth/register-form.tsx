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

// ─── Schemas ─────────────────────────────────────────────────────────────────

const infoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  mobileNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Enter a valid phone number (e.g. +1234567890)"),
});

type InfoForm = z.infer<typeof infoSchema>;
type Step = "info" | "verify";

// ─── Component ───────────────────────────────────────────────────────────────

export function RegisterForm() {
  const [step, setStep] = useState<Step>("info");
  const [formData, setFormData] = useState<InfoForm | null>(null);

  const sendOtp = useSendOtp();
  const createUser = useCreateUser();

  const infoForm = useForm<InfoForm>({
    resolver: zodResolver(infoSchema),
    defaultValues: { name: "", email: "", mobileNumber: "" },
  });

  const onSubmitInfo = async (data: InfoForm) => {
    // Send OTP to verify phone number before creating account
    await sendOtp.mutateAsync({ mobileNumber: data.mobileNumber });
    setFormData(data);
    setStep("verify");
  };

  const onCreateAccount = () => {
    if (!formData) return;
    createUser.mutate(formData);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`h-1 flex-1 rounded-full transition-colors ${step === "info" ? "bg-brand-500" : "bg-brand-500"}`} />
        <div className={`h-1 flex-1 rounded-full transition-colors ${step === "verify" ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
      </div>

      <AnimatePresence mode="wait">
        {step === "info" ? (
          <motion.div
            key="info"
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
                <UserPlus className="h-7 w-7 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-display">
                Join HiveMind
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                Create your account to connect through groups. No passwords — we&apos;ll verify your phone.
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
                placeholder="+1 234 567 8900"
                autoComplete="tel"
                icon={<Phone className="h-4 w-4" />}
                hint="We'll send a verification code to this number"
                error={infoForm.formState.errors.mobileNumber?.message}
                {...infoForm.register("mobileNumber")}
              />
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                loading={sendOtp.isPending}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <p className="mt-6 text-[11px] text-gray-400 text-center leading-relaxed">
              By creating an account, you agree to HiveMind&apos;s Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
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
                Verify your phone
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {formData?.mobileNumber}
                </span>
              </p>
            </div>

            {/* Account preview card */}
            <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{formData?.name?.[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formData?.name}</p>
                  <p className="text-xs text-gray-400">{formData?.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-center text-sm text-gray-500">
                Tap below to verify and create your account
              </p>
              <Button
                variant="gradient"
                className="w-full"
                onClick={onCreateAccount}
                loading={createUser.isPending}
              >
                <Sparkles className="h-4 w-4" />
                Create my account
              </Button>
              <motion.button
                whileHover={{ x: -4 }}
                type="button"
                onClick={() => setStep("info")}
                className="w-full text-sm text-gray-500 hover:text-brand-500 transition-colors py-2"
              >
                ← Back to edit details
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
