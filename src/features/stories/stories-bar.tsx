"use client";

import { useState, useRef } from "react";
import { Plus, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useCurrentUser } from "@/hooks/use-user";
import { useStories } from "@/hooks/use-stories";
import { CreateStoryModal } from "./create-story-modal";
import { StoryViewer } from "./story-viewer";
import { cn } from "@/utils/cn";

export function StoriesBar() {
  const userId = useAuthStore((s) => s.userId);
  const { data: currentUser } = useCurrentUser();
  const { groups } = useStories();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openViewer = (index: number) => { setActiveGroupIndex(index); setViewerOpen(true); };
  const currentUserGroup = groups.find((g) => g.userId === userId);
  const hasOwnStory = !!currentUserGroup;

  return (
    <>
      <div className="card p-3">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
          {/* Your Story — card style */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (hasOwnStory) { const idx = groups.findIndex((g) => g.userId === userId); openViewer(idx >= 0 ? idx : 0); }
              else setCreateOpen(true);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCreateOpen(true); } }}
            className="flex flex-col items-center gap-1.5 min-w-[76px] cursor-pointer"
          >
            <div className="relative">
              {hasOwnStory ? (
                <div className="p-[3px] rounded-full bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500">
                  <div className="rounded-full p-[2px] bg-white dark:bg-surface-dark">
                    <Avatar name={currentUser?.name} size="lg" src={currentUser?.profilePictureUrl} />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Avatar name={currentUser?.name} size="lg" src={currentUser?.profilePictureUrl} />
                  <div className="absolute -bottom-0.5 -right-0.5 bg-brand-500 text-white rounded-full p-1 border-2 border-white dark:border-surface-dark shadow-md">
                    <Plus className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-16 text-center font-medium">
              Your story
            </span>
          </motion.div>

          {/* Other users' stories */}
          {groups.filter((g) => g.userId !== userId).map((group) => {
            const globalIndex = groups.findIndex((g) => g.userId === group.userId);
            return (
              <motion.div
                key={group.userId}
                whileTap={{ scale: 0.95 }}
                onClick={() => openViewer(globalIndex)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewer(globalIndex); } }}
                className="flex flex-col items-center gap-1.5 min-w-[76px] cursor-pointer"
              >
                <div className={cn(
                  "p-[3px] rounded-full",
                  group.hasUnviewed
                    ? "bg-gradient-to-tr from-brand-500 via-purple-500 to-pink-500"
                    : "bg-gray-300 dark:bg-gray-600"
                )}>
                  <div className="rounded-full p-[2px] bg-white dark:bg-surface-dark">
                    <Avatar name={group.userName} size="lg" src={group.userAvatar} />
                  </div>
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate w-16 text-center font-medium">
                  {group.userName.split(" ")[0]}
                </span>
              </motion.div>
            );
          })}

          {/* Add story hint if no stories */}
          {groups.length <= 1 && (
            <motion.div
              whileTap={{ scale: 0.95 }}
              onClick={() => setCreateOpen(true)}
              role="button"
              tabIndex={0}
              className="flex flex-col items-center gap-1.5 min-w-[76px] cursor-pointer"
            >
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-brand-400 transition-colors">
                <Camera className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-[11px] text-gray-400 truncate w-16 text-center">Add story</span>
            </motion.div>
          )}
        </div>
      </div>

      <CreateStoryModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {viewerOpen && <StoryViewer groups={groups} initialGroupIndex={activeGroupIndex} onClose={() => setViewerOpen(false)} />}
    </>
  );
}
