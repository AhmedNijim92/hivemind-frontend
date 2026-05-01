import { apiClient } from "./api-client";
import type { PostDto, CreatePostRequest, Comment, AddCommentRequest } from "@/types";

export const postService = {
  createPost: async (data: CreatePostRequest): Promise<PostDto> => {
    const res = await apiClient.post<PostDto>("/api/v1/posts", data);
    return res.data;
  },

  getPostsByGroup: async (groupId: string): Promise<PostDto[]> => {
    const res = await apiClient.get<PostDto[]>(
      `/api/v1/posts/group/${groupId}`
    );
    return res.data;
  },

  getPost: async (groupId: string, postId: string): Promise<PostDto> => {
    const res = await apiClient.get<PostDto>(
      `/api/v1/posts/${groupId}/${postId}`
    );
    return res.data;
  },

  likePost: async (groupId: string, postId: string): Promise<void> => {
    await apiClient.post(`/api/v1/posts/${groupId}/${postId}/like`);
  },

  addComment: async (
    groupId: string,
    postId: string,
    data: AddCommentRequest
  ): Promise<Comment> => {
    const res = await apiClient.post<Comment>(
      `/api/v1/posts/${groupId}/${postId}/comments`,
      data
    );
    return res.data;
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(
      `/api/v1/posts/${postId}/comments`
    );
    return res.data;
  },
};
