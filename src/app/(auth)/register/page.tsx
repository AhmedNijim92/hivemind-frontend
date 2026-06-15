import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create Account — HiveMind" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-brand-600 via-purple-700 to-indigo-900 p-12 text-white">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="font-bold text-lg">H</span>
          </div>
          <span className="font-bold text-xl">HiveMind</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Your community<br />awaits
          </h2>
          <p className="text-purple-200 text-lg">
            Create groups, share moments, and meet people who think like you.
            Passwordless. Secure. Simple.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex -space-x-2">
              {["🟣", "🔵", "🟢", "🟡"].map((c, i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-purple-700">
                  <span className="text-sm">{c}</span>
                </div>
              ))}
            </div>
            <span className="text-purple-300 text-sm">Join 1,000+ members</span>
          </div>
        </div>
        <p className="text-purple-300 text-sm">
          © {new Date().getFullYear()} HiveMind. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
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
      </div>
    </main>
  );
}
