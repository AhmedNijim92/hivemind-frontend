import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { postService } from "@/services/post.service";
import type { CreatePostRequest, AddCommentRequest } from "@/types";

export const postKeys = {
  all: ["posts"] as const,
  byGroup: (groupId: string) => [...postKeys.all, "group", groupId] as const,
  detail: (groupId: string, postId: string) =>
    [...postKeys.all, groupId, postId] as const,
  comments: (postId: string) => [...postKeys.all, postId, "comments"] as const,
};

export function useGroupPosts(groupId: string) {
  return useQuery({
    queryKey: postKeys.byGroup(groupId),
    queryFn: () => postService.getPostsByGroup(groupId),
    enabled: !!groupId,
    staleTime: 1000 * 30, // 30s — posts are fresh
  });
}

export function usePost(groupId: string, postId: string) {
  return useQuery({
    queryKey: postKeys.detail(groupId, postId),
    queryFn: () => postService.getPost(groupId, postId),
    enabled: !!groupId && !!postId,
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => postService.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostRequest) => postService.createPost(data),
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: postKeys.byGroup(post.groupId) });
      toast.success("Post published!");
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to create post"),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, postId }: { groupId: string; postId: string }) =>
      postService.likePost(groupId, postId),
    onSuccess: (_, { groupId, postId }) => {
      // Optimistic: invalidate the specific post
      qc.invalidateQueries({ queryKey: postKeys.detail(groupId, postId) });
      qc.invalidateQueries({ queryKey: postKeys.byGroup(groupId) });
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to like post"),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      postId,
      data,
    }: {
      groupId: string;
      postId: string;
      data: AddCommentRequest;
    }) => postService.addComment(groupId, postId, data),
    onSuccess: (comment) => {
      qc.invalidateQueries({ queryKey: postKeys.comments(comment.postId) });
    },
    onError: (err: { message: string }) =>
      toast.error(err.message ?? "Failed to add comment"),
  });
}
