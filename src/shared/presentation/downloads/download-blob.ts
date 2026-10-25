import { downloadBlobFile } from '../../infrastructure/browser/download-file'
export function triggerBlobDownload(blob: Blob, fileName: string): void {
  downloadBlobFile(fileName, blob)
}
