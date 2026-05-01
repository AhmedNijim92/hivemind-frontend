"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateUser } from "@/hooks/use-auth";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  mobileNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Enter a valid phone number (e.g. +1234567890)"),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => createUser.mutate(data);

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
          Join HiveMind and connect through groups
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Alex Johnson"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          placeholder="alex@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Mobile number"
          type="tel"
          placeholder="+1 234 567 8900"
          autoComplete="tel"
          hint="Used for OTP login — no password needed"
          error={errors.mobileNumber?.message}
          {...register("mobileNumber")}
        />
        <Button
          type="submit"
          className="w-full"
          loading={createUser.isPending}
        >
          Create account
        </Button>
      </form>
    </div>
  );
}
