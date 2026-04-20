/** URL pública de un adjunto a partir de su filePath relativo. */
export function getAttachmentUrl(filePath: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const serverRoot = apiBase.replace(/\/api$/, '')
  return `${serverRoot}/uploads/${filePath}`
}
