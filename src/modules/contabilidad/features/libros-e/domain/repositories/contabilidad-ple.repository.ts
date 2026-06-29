import type {
  ContabilidadLibroMayorAccountDTO,
  ContabilidadPleBookDTO,
  ContabilidadPleExportLogDTO,
  ContabilidadPleGenerateResultDTO,
  ContabilidadPleGeneratedFileDTO,
  ContabilidadPleMandatoryProfileDTO,
} from '../ple.types'

export interface ContabilidadPleRepository {
  listBooks(): Promise<{ books: ContabilidadPleBookDTO[] }>
  getMandatoryProfile(): Promise<ContabilidadPleMandatoryProfileDTO>
  listExportLogs(periodId?: string, limit?: number): Promise<ContabilidadPleExportLogDTO[]>
  generateBooks(periodId: string, bookCodes: string[]): Promise<ContabilidadPleGenerateResultDTO>
  downloadZip(periodId: string, bookCodes: string[]): Promise<{ blob: Blob; fileName: string }>
  generateBook(periodId: string, bookCode: string): Promise<ContabilidadPleGeneratedFileDTO>
  getLibroMayor(periodId: string, accountId?: string): Promise<{ accounts: ContabilidadLibroMayorAccountDTO[] }>
}
