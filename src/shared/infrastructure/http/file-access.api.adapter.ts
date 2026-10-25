import type { FileAccessPort } from '../../application/ports/file-access.port'
import { apiClient } from './api-client'
export const fileAccessApiAdapter: FileAccessPort = {
  getDownloadUrl: (id, options) =>
    apiClient
      .get<{ url: string }>(`/gen-archivos/${id}/url`, { params: options })
      .then((response) => response.data),
  resolveDownloadUrl: (objectKey, options) =>
    apiClient
      .get<{ url: string }>('/gen-archivos/resolve-url', { params: { objectKey, ...options } })
      .then((response) => response.data),
}
