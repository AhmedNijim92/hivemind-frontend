import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-600 to-brand-900 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="font-bold text-lg">H</span>
          </div>
          <span className="font-bold text-xl">HiveMind</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Connect through<br />communities
          </h2>
          <p className="text-brand-200 text-lg">
            Join groups, share ideas, and meet people who share your interests.
            No passwords — just your phone.
          </p>
        </div>
        <p className="text-brand-300 text-sm">
          © {new Date().getFullYear()} HiveMind. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <LoginForm />
        <p className="mt-6 text-sm text-gray-500">
          New to HiveMind?{" "}
          <Link
            href="/register"
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
