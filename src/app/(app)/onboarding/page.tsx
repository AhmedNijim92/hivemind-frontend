"use client";

import { useRouter } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";

export default function OnboardingPage() {
  const router = useRouter();
  const openCreateGroup = useUIStore((s) => s.openCreateGroup);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto">
          <span className="text-4xl">🐝</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to HiveMind!
          </h1>
          <p className="text-gray-500 mt-2">
            HiveMind is all about groups. Create or join one to get started.
          </p>
        </div>

        <div className="space-y-3">
          <Button className="w-full" onClick={openCreateGroup}>
            <Users className="h-4 w-4" />
            Create your first group
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => router.push("/feed")}
          >
            Explore the feed
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
