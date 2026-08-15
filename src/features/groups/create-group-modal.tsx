"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/use-haptic";
import { useCreateGroup } from "@/hooks/use-groups";
import { useUIStore } from "@/store/ui-store";
import { useGroupContextStore } from "@/store/group-context-store";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().max(300).optional(),
  privacy: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormData = z.infer<typeof schema>;

export function CreateGroupModal() {
  const router = useRouter();
  const haptic = useHaptic();
  const { isCreateGroupOpen, closeCreateGroup } = useUIStore();
  const setActiveGroup = useGroupContextStore((s) => s.setActiveGroup);
  const createGroup = useCreateGroup();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { privacy: "PUBLIC" },
  });

  const privacy = watch("privacy");

  const onSubmit = async (data: FormData) => {
    haptic.success();
    const newGroup = await createGroup.mutateAsync(data);
    setActiveGroup(newGroup);
    reset();
    closeCreateGroup();
    setTimeout(() => router.replace("/feed"), 100);
  };

  return (
    <Modal open={isCreateGroupOpen} onClose={closeCreateGroup} title="Create a group">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Input
            label="Group name"
            placeholder="e.g. Design Enthusiasts"
            error={errors.name?.message}
            {...register("name")}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Textarea
            label="Description (optional)"
            placeholder="What is this group about?"
            error={errors.description?.message}
            {...register("description")}
          />
        </motion.div>

        {/* Privacy toggle — animated selection */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Privacy
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["PUBLIC", "PRIVATE"] as const).map((p) => {
              const isSelected = privacy === p;
              const Icon = p === "PUBLIC" ? Globe : Lock;
              return (
                <motion.label
                  key={p}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { haptic.selection(); setValue("privacy", p); }}
                  className={`relative flex items-center gap-2.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20 shadow-sm shadow-brand-500/10"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    value={p}
                    className="sr-only"
                    {...register("privacy")}
                  />
                  <Icon className={`h-4 w-4 ${isSelected ? "text-brand-500" : "text-gray-400"}`} />
                  <div>
                    <span className={`text-sm font-medium capitalize ${isSelected ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                      {p.toLowerCase()}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {p === "PUBLIC" ? "Anyone can join" : "Invite only"}
                    </p>
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="privacy-check"
                      className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-500 flex items-center justify-center"
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.label>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3 pt-2"
        >
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => { reset(); closeCreateGroup(); }}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={createGroup.isPending}>
            Create group
          </Button>
        </motion.div>
      </form>
    </Modal>
  );
}
