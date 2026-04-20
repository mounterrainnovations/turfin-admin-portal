import { getUploadUrl } from "./api";

/**
 * Handles the multi-step upload workflow:
 * 1. Get signed URL from backend
 * 2. PUT file binary to S3
 * @returns The storage path of the uploaded file
 */
export async function uploadToStorage(
  vendorId: string,
  docKey: string,
  file: File
): Promise<string> {
  const extension = file.name.split(".").pop();
  const path = `kyc/${vendorId}/${docKey}_${Date.now()}.${extension}`;

  // 1. Get Signed URL
  const { uploadUrl } = await getUploadUrl(path, file.type);

  // 2. Upload to S3
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload file to storage");
  }

  return path;
}
