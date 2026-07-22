import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create Account — HiveMind" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] xl:w-1/2 bg-[#0f0f13] p-10 xl:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="relative flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-lg text-white">HiveMind</span>
        </div>

        <div className="relative">
          <p className="text-brand-400 text-sm font-medium mb-3 tracking-wide uppercase">Join today</p>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-white mb-4">
            Your community<br />awaits
          </h2>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            Create groups, share moments, and meet people who think like you.
            Passwordless. Secure. Simple.
          </p>
        </div>

        <p className="relative text-gray-600 text-sm">
          © {new Date().getFullYear()} HiveMind
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#09090b]">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 px-6 pt-8 pb-4">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-[15px] text-gray-900 dark:text-white">HiveMind</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <RegisterForm />
          <p className="mt-6 text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-500 font-medium hover:text-brand-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
