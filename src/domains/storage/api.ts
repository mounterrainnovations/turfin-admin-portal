import { api } from "@/lib/api-client";

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  path: string;
}

export const storageApi = {
  /**
   * Gets a pre-signed URL for uploading a file.
   * Path should follow: {module}/{moduleId}/{fieldKey}_{timestamp}
   */
  getUploadUrl: async (
    path: string,
    fileType: string,
  ): Promise<UploadUrlResponse> => {
    return api.get<UploadUrlResponse>(
      `/storage/upload-url?path=${encodeURIComponent(path)}&fileType=${encodeURIComponent(fileType)}`,
    );
  },

  /**
   * Performs the actual upload to the pre-signed URL.
   */
  uploadFile: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to storage");
    }
  },
};
