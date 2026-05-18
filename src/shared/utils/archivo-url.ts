/** Resuelve URL de descarga: MinIO (presigned) o legacy /uploads. */
export function resolveFileDownloadUrl(
  attachment: {
    downloadUrl?: string | null
    archivoId?: string | null
    filePath?: string
  },
): string {
  if (attachment.downloadUrl) {
    return attachment.downloadUrl
  }
  if (attachment.filePath) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001/api'
    const serverRoot = apiBase.replace(/\/api$/, '')
    const path = attachment.filePath.replace(/^uploads\//, '')
    return `${serverRoot}/uploads/${path}`
  }
  return '#'
}
