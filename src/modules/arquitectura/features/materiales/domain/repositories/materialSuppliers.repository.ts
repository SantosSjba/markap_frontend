import type {
  CreateArquitecturaMaterialSupplierPayload,
  ArquitecturaSupplierDetail,
  LinkSupplierCatalogPayload,
  ListArquitecturaMaterialSuppliersParams,
  ListArquitecturaMaterialSuppliersResponse,
  RecordArquitecturaMaterialPurchasePayload,
  UpdateArquitecturaMaterialSupplierPayload,
} from '../suppliers.types'

export interface ArquitecturaMaterialSuppliersRepository {
  getList(params: ListArquitecturaMaterialSuppliersParams): Promise<ListArquitecturaMaterialSuppliersResponse>
  getById(id: string): Promise<ArquitecturaSupplierDetail>
  create(payload: CreateArquitecturaMaterialSupplierPayload): Promise<ArquitecturaSupplierDetail>
  update(id: string, payload: UpdateArquitecturaMaterialSupplierPayload): Promise<ArquitecturaSupplierDetail>
  delete(id: string): Promise<void>
  unlinkCatalogLink(linkId: string): Promise<void>
  linkCatalogMaterial(supplierId: string, payload: LinkSupplierCatalogPayload): Promise<ArquitecturaSupplierDetail>
  recordPurchase(
    supplierId: string,
    payload: RecordArquitecturaMaterialPurchasePayload,
  ): Promise<ArquitecturaSupplierDetail>
}
