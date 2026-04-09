import { useState } from "react";
import { storageApi } from "@/domains/storage/api";
import { toast } from "react-hot-toast";

interface UseSecureUploadOptions {
  module: "kyc" | "turf";
  moduleId: string;
}

export function useSecureUpload({ module, moduleId }: UseSecureUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File, fieldKey: string): Promise<string | null> => {
    setIsUploading(true);
    try {
      // 1. Generate path: {module}/{moduleId}/{fieldKey}_{timestamp}
      const timestamp = Date.now();
      const extension = file.name.split(".").pop();
      const path = `${module}/${moduleId}/${fieldKey}_${timestamp}${extension ? `.${extension}` : ""}`;

      // 2. Get signed URL
      const { uploadUrl, path: storagePath } = await storageApi.getUploadUrl(
        path,
        file.type,
      );

      // 3. Upload file
      await storageApi.uploadFile(uploadUrl, file);

      return storagePath;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
  };
}
