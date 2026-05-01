import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <RegisterForm />
      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
