const STORAGE_BUCKET = "documents";

function extractStoragePathFromSupabaseUrl(urlValue: string): string | null {
  try {
    const url = new URL(urlValue);
    const pathname = decodeURIComponent(url.pathname);
    const prefixes = [
      `/storage/v1/object/sign/${STORAGE_BUCKET}/`,
      `/storage/v1/object/public/${STORAGE_BUCKET}/`,
      `/storage/v1/object/authenticated/${STORAGE_BUCKET}/`,
    ];

    for (const prefix of prefixes) {
      if (pathname.startsWith(prefix)) {
        return pathname.slice(prefix.length);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function isPreviewableImageUrl(url: string) {
  const cleanUrl = url.split("?")[0].toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].some((ext) =>
    cleanUrl.endsWith(ext),
  );
}

export async function resolveStorageDocumentUrl(
  pathOrUrl: string,
  getSignedViewUrl: (path: string) => Promise<{ signedUrl: string }>,
) {
  if (!pathOrUrl) {
    throw new Error("Missing document path");
  }

  const storagePath = pathOrUrl.startsWith("http")
    ? extractStoragePathFromSupabaseUrl(pathOrUrl)
    : pathOrUrl;

  if (!storagePath) {
    return pathOrUrl;
  }

  const { signedUrl } = await getSignedViewUrl(storagePath);
  if (!signedUrl) {
    throw new Error("Received an empty signed URL");
  }

  return signedUrl;
}
