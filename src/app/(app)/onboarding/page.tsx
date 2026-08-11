"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, Sparkles, MessageCircle, Video, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { useCurrentUser } from "@/hooks/use-user";
import { usePageTitle } from "@/hooks/use-page-title";

const features = [
  { icon: Users, title: "Groups", description: "Create or join communities around your interests" },
  { icon: MessageCircle, title: "Chat", description: "Real-time messaging with group members" },
  { icon: Video, title: "Live Rooms", description: "Start video/audio rooms with reactions" },
  { icon: Zap, title: "Stories", description: "Share ephemeral moments with your groups" },
];

export default function OnboardingPage() {
  usePageTitle("Welcome");
  const router = useRouter();
  const openCreateGroup = useUIStore((s) => s.openCreateGroup);
  const { data: currentUser } = useCurrentUser();
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 via-white to-brand-50/20 dark:from-[#09090b] dark:via-[#0f0f13] dark:to-brand-950/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {step === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
            {/* Welcome */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="h-20 w-20 rounded-3xl bg-brand-500 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/30"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome{currentUser?.name ? `, ${currentUser.name.split(" ")[0]}` : ""}! 🎉
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-base">
                You&apos;re in! Here&apos;s what you can do on HiveMind.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3 text-left">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]"
                >
                  <f.icon className="h-5 w-5 text-brand-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{f.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{f.description}</p>
                </motion.div>
              ))}
            </div>

            <Button className="w-full" onClick={() => setStep(1)}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center space-y-6">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-400 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-brand-500/30">
              <Users className="h-10 w-10 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Everything starts with a group
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Create your own community or explore existing ones.
              </p>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={openCreateGroup}>
                <Users className="h-4 w-4" /> Create your first group
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => router.push("/feed")}>
                Explore first <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
