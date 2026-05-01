import { apiClient } from "./api-client";
import type { MediaFileDto, MediaReferenceType } from "@/types";

export const mediaService = {
  upload: async (
    file: File,
    referenceId?: string,
    referenceType: MediaReferenceType = "POST"
  ): Promise<MediaFileDto> => {
    const formData = new FormData();
    formData.append("file", file);
    if (referenceId) formData.append("referenceId", referenceId);
    formData.append("referenceType", referenceType);

    const res = await apiClient.post<MediaFileDto>(
      "/api/v1/media/upload",
      formData
    );
    return res.data;
  },

  getMedia: async (mediaId: string): Promise<MediaFileDto> => {
    const res = await apiClient.get<MediaFileDto>(`/api/v1/media/${mediaId}`);
    return res.data;
  },

  getPresignedUrl: async (mediaId: string): Promise<string> => {
    const res = await apiClient.get<string>(
      `/api/v1/media/${mediaId}/presigned-url`
    );
    return res.data;
  },

  getMyMedia: async (): Promise<MediaFileDto[]> => {
    const res = await apiClient.get<MediaFileDto[]>("/api/v1/media/my");
    return res.data;
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/media/${mediaId}`);
  },
};
