import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'

/** URL de descarga de adjunto de alquiler (MinIO o legacy). */
export function getAttachmentUrl(
  filePathOrAttachment: string | {
    filePath: string
    downloadUrl?: string | null
    archivoId?: string | null
  },
): string {
  if (typeof filePathOrAttachment === 'string') {
    return resolveFileDownloadUrl({ filePath: filePathOrAttachment })
  }
  return resolveFileDownloadUrl(filePathOrAttachment)
}
