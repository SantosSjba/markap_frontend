import type { ContabilidadPleGeneratedFileDTO } from '../../domain/ple.types'
import { downloadTextFile } from '@shared/infrastructure/browser/download-file'
export function downloadAllPleFiles(files: ContabilidadPleGeneratedFileDTO[]) {
  for (const file of files) {
    downloadTextFile(file.fileName, file.content)
  }
}
