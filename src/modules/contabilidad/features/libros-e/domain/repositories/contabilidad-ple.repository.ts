import type {
  ContabilidadLibroMayorAccountDTO,
  ContabilidadPleBookDTO,
  ContabilidadPleGenerateResultDTO,
  ContabilidadPleGeneratedFileDTO,
} from '../ple.types'

export interface ContabilidadPleRepository {
  listBooks(): Promise<{ books: ContabilidadPleBookDTO[] }>
  generateBooks(periodId: string, bookCodes: string[]): Promise<ContabilidadPleGenerateResultDTO>
  generateBook(periodId: string, bookCode: string): Promise<ContabilidadPleGeneratedFileDTO>
  getLibroMayor(periodId: string, accountId?: string): Promise<{ accounts: ContabilidadLibroMayorAccountDTO[] }>
}
