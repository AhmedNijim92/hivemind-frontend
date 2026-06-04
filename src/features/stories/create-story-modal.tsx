"use client";

import { useState, useCallback } from "react";
import { ImagePlus, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/use-user";
import { useCreateStory } from "@/hooks/use-stories";
import { formatFileSize } from "@/utils/format";
import { cn } from "@/utils/cn";

const MAX_CAPTION = 150;

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateStoryModal({ open, onClose }: CreateStoryModalProps) {
  const { data: currentUser } = useCurrentUser();
  const { createStory, isPending } = useCreateStory();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB for stories
  });

  const removeMedia = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleClose = () => {
    removeMedia();
    setCaption("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) return;
    await createStory(file, caption || null);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create story" size="sm">
      <div className="space-y-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar
            name={currentUser?.name}
            size="md"
            src={currentUser?.profilePictureUrl}
          />
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {currentUser?.name ?? "You"}
            </p>
            <p className="text-xs text-gray-400">Visible for 24 hours</p>
          </div>
        </div>

        {/* Image preview or dropzone */}
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative rounded-xl overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Story preview"
                className="w-full max-h-80 object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              {file && (
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                  {formatFileSize(file.size)}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-brand-400"
                )}
              >
                <input {...getInputProps()} aria-label="Upload story image" />
                <ImagePlus className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDragActive
                    ? "Drop your image here"
                    : "Tap or drag an image"}
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  Max 10MB · Images only
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative">
              <input
                type="text"
                value={caption}
                onChange={(e) =>
                  setCaption(e.target.value.slice(0, MAX_CAPTION))
                }
                placeholder="Add a caption…"
                className="input-base w-full text-sm"
                maxLength={MAX_CAPTION}
              />
              <span
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-xs",
                  caption.length > MAX_CAPTION * 0.9
                    ? "text-yellow-500"
                    : "text-gray-400"
                )}
              >
                {caption.length}/{MAX_CAPTION}
              </span>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            loading={isPending}
            disabled={!file}
            onClick={handleSubmit}
          >
            {isPending ? "Uploading…" : "Share story"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
