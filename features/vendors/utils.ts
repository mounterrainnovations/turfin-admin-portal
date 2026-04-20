import { getUploadUrl } from "./api";

/**
 * Handles the multi-step upload workflow:
 * 1. Get signed URL from backend
 * 2. PUT file binary to S3
 * @returns The storage path of the uploaded file
 */
/**
 * Handles the multi-step upload workflow:
 * 1. Get signed URL from backend
 * 2. PUT file binary to S3
 * @returns The storage path of the uploaded file
 */
export async function uploadToStorage(
  id: string,
  docKey: string,
  file: File,
  entityType: "vendor" | "turf" = "vendor"
): Promise<string> {
  const extension = file.name.split(".").pop();
  // Using kyc/entityType/id/docKey prefix to keep it organized
  const path = `kyc/${entityType}/${id}/${docKey}_${Date.now()}.${extension}`;

  // 1. Get Signed URL
  const { uploadUrl } = await getUploadUrl(path, file.type);

  // 2. Upload to S3
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload ${docKey} to storage`);
  }

  return path;
}

/**
 * Uploads multiple files sequentially and returns a mapped object of S3 paths.
 * Supports both single files and arrays of files (e.g. fieldPhotos).
 */
export async function performSequentialUploads(
  id: string,
  filesMap: Record<string, File | File[] | null | undefined>,
  entityType: "vendor" | "turf" = "vendor"
): Promise<Record<string, string | string[]>> {
  const result: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(filesMap)) {
    if (!value) continue;

    if (Array.isArray(value)) {
      const paths: string[] = [];
      for (let i = 0; i < value.length; i++) {
        const path = await uploadToStorage(
          id,
          `${key}_${i}`,
          value[i],
          entityType
        );
        paths.push(path);
      }
      result[key] = paths;
    } else {
      const path = await uploadToStorage(id, key, value, entityType);
      result[key] = path;
    }
  }

  return result;
}
