"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCreateGroup } from "@/hooks/use-groups";
import { useUIStore } from "@/store/ui-store";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().max(300).optional(),
  privacy: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormData = z.infer<typeof schema>;

export function CreateGroupModal() {
  const { isCreateGroupOpen, closeCreateGroup } = useUIStore();
  const createGroup = useCreateGroup();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { privacy: "PUBLIC" },
  });

  const onSubmit = async (data: FormData) => {
    await createGroup.mutateAsync(data);
    reset();
    closeCreateGroup();
  };

  return (
    <Modal open={isCreateGroupOpen} onClose={closeCreateGroup} title="Create a group">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Group name"
          placeholder="e.g. Design Enthusiasts"
          error={errors.name?.message}
          {...register("name")}
        />
        <Textarea
          label="Description (optional)"
          placeholder="What is this group about?"
          error={errors.description?.message}
          {...register("description")}
        />

        {/* Privacy toggle */}
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
                <input
                  type="radio"
                  value={p}
                  className="accent-brand-500"
                  {...register("privacy")}
                />
                <span className="text-sm font-medium capitalize">
                  {p.toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
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
        </div>
      </form>
    </Modal>
  );
}
