"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Phone, ArrowRight, User, Mail } from "lucide-react";
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

export function RegisterForm() {
  const [step, setStep] = useState<"info" | "otp">("info");
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
    } catch {}
    setFormData({ ...data, mobileNumber: cleanNumber });
    setStep("otp");
  };

  const onCreateAccount = () => {
    if (!formData) return;
    createUser.mutate(formData);
  };

  if (step === "otp") {
    return (
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-8">
          <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verify your number
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-gray-700 dark:text-gray-200">{formData?.mobileNumber}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Verification code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full text-center text-2xl tracking-[0.4em] font-mono px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
          </div>

          <Button
            className="w-full"
            onClick={onCreateAccount}
            loading={createUser.isPending}
            disabled={otpCode.length !== 6}
          >
            Create Account
          </Button>

          <button
            type="button"
            onClick={() => { setStep("info"); setOtpCode(""); }}
            className="w-full text-sm text-gray-400 hover:text-brand-500 transition-colors py-2"
          >
            ← Use a different number
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <div className="h-12 w-12 rounded-2xl bg-brand-500 flex items-center justify-center mb-4">
          <UserPlus className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create your account
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Join HiveMind. No passwords — just your phone.
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
          error={infoForm.formState.errors.mobileNumber?.message}
          {...infoForm.register("mobileNumber")}
        />
        <Button type="submit" className="w-full" loading={sendOtp.isPending}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
