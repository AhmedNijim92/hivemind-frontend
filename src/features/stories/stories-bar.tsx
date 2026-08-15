"use client";

import { useState, useRef } from "react";
import { Plus, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { useGroupContextStore } from "@/store/group-context-store";
import { useStories } from "@/hooks/use-stories";
import { CreateStoryModal } from "./create-story-modal";
import { StoryViewer } from "./story-viewer";
import { cn } from "@/utils/cn";

export function StoriesBar() {
  const activeGroup = useGroupContextStore((s) => s.activeGroup);
  const { groups } = useStories();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openViewer = (index: number) => { setActiveGroupIndex(index); setViewerOpen(true); };

  // Check if current active group already has a story
  const activeGroupStory = activeGroup ? groups.find((g) => g.groupId === activeGroup.groupId) : null;
  const hasStoryForGroup = !!activeGroupStory;

  return (
    <>
      <div className="card p-3">
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-0.5">
          {/* Add Story — always visible */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (activeGroup && hasStoryForGroup) {
                const idx = groups.findIndex((g) => g.groupId === activeGroup.groupId);
                openViewer(idx >= 0 ? idx : 0);
              } else {
                setCreateOpen(true);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCreateOpen(true); } }}
            className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer"
          >
            <div className="relative">
              {activeGroup && hasStoryForGroup ? (
                <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-brand-500 to-pink-500">
                  <div className="rounded-full p-[2px] bg-white dark:bg-surface-dark">
                    <Avatar name={activeGroup.name} size="lg" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-white/[0.04] border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-brand-500" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 bg-brand-500 text-white rounded-full p-[3px] border-2 border-white dark:border-surface-dark shadow-md">
                    <Plus className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-[68px] text-center font-medium leading-tight">
              {activeGroup && hasStoryForGroup ? activeGroup.name : "Add story"}
            </span>
          </motion.div>

          {/* Other groups' stories */}
          {groups
            .filter((g) => !activeGroup || g.groupId !== activeGroup.groupId)
            .map((group) => {
              const globalIndex = groups.findIndex((g) => g.groupId === group.groupId);
              return (
                <motion.div
                  key={group.groupId}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openViewer(globalIndex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewer(globalIndex); } }}
                  className="flex flex-col items-center gap-1.5 min-w-[68px] cursor-pointer"
                >
                  <div className={cn(
                    "p-[2.5px] rounded-full",
                    group.hasUnviewed
                      ? "bg-gradient-to-tr from-brand-500 to-pink-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}>
                    <div className="rounded-full p-[2px] bg-white dark:bg-surface-dark">
                      <Avatar name={group.groupName} size="lg" />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-[68px] text-center font-medium leading-tight">
                    {group.groupName}
                  </span>
                </motion.div>
              );
            })}
        </div>
      </div>

      <CreateStoryModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {viewerOpen && groups.length > 0 && (
        <StoryViewer groups={groups} initialGroupIndex={activeGroupIndex} onClose={() => setViewerOpen(false)} />
      )}
    </>
  );
}
