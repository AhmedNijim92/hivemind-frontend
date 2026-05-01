"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateMeeting } from "@/hooks/use-meetings";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(2, "Title is required").max(100),
  description: z.string().max(300).optional(),
  privacy: z.enum(["PUBLIC", "PRIVATE"]),
  scheduledAt: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface CreateMeetingModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

export function CreateMeetingModal({ open, onClose, groupId }: CreateMeetingModalProps) {
  const createMeeting = useCreateMeeting();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { privacy: "PUBLIC" },
  });

  const onSubmit = async (data: FormData) => {
    await createMeeting.mutateAsync({
      groupId,
      title: data.title,
      description: data.description,
      privacy: data.privacy,
      scheduledAt: data.scheduledAt || undefined,
    });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule a meeting">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Meeting title"
          placeholder="e.g. Weekly standup"
          error={errors.title?.message}
          {...register("title")}
        />
        <Textarea
          label="Description (optional)"
          placeholder="What's this meeting about?"
          error={errors.description?.message}
          {...register("description")}
        />
        <Input
          label="Schedule for (optional)"
          type="datetime-local"
          {...register("scheduledAt")}
        />
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Privacy
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["PUBLIC", "PRIVATE"] as const).map((p) => (
              <label
                key={p}
                className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-brand-400 transition-colors"
              >
                <input type="radio" value={p} className="accent-brand-500" {...register("privacy")} />
                <span className="text-sm font-medium capitalize">{p.toLowerCase()}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={createMeeting.isPending}>
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
