import { createServiceKey } from './service-key'
export interface FileAccessOptions {
  expiresIn?: number
  applicationSlug?: string
}
export interface FileAccessPort {
  getDownloadUrl(id: string, options?: FileAccessOptions): Promise<{ url: string }>
  resolveDownloadUrl(objectKey: string, options?: FileAccessOptions): Promise<{ url: string }>
}
export const FILE_ACCESS = createServiceKey<FileAccessPort>('shared.file-access')
