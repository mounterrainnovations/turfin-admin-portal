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

export async function openStorageDocument(
  pathOrUrl: string,
  getSignedViewUrl: (path: string) => Promise<{ signedUrl: string }>,
) {
  if (!pathOrUrl) {
    throw new Error("Missing document path");
  }

  const openedWindow = window.open("about:blank", "_blank");
  if (!openedWindow) {
    throw new Error("Browser blocked the document tab from opening");
  }
  openedWindow.opener = null;

  const storagePath = pathOrUrl.startsWith("http")
    ? extractStoragePathFromSupabaseUrl(pathOrUrl)
    : pathOrUrl;

  try {
    if (storagePath) {
      const { signedUrl } = await getSignedViewUrl(storagePath);
      if (!signedUrl) {
        throw new Error("Received an empty signed URL");
      }
      openedWindow.location.href = signedUrl;
      return;
    }

    openedWindow.location.href = pathOrUrl;
  } catch (error) {
    openedWindow.close();
    throw error;
  }
}
