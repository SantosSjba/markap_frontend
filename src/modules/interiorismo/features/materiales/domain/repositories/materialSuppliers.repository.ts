import type {
  CreateInteriorMaterialSupplierPayload,
  InteriorSupplierDetail,
  LinkSupplierCatalogPayload,
  ListInteriorMaterialSuppliersParams,
  ListInteriorMaterialSuppliersResponse,
  RecordInteriorMaterialPurchasePayload,
  UpdateInteriorMaterialSupplierPayload,
} from '../suppliers.types'

export interface InteriorMaterialSuppliersRepository {
  getList(params: ListInteriorMaterialSuppliersParams): Promise<ListInteriorMaterialSuppliersResponse>
  getById(id: string): Promise<InteriorSupplierDetail>
  create(payload: CreateInteriorMaterialSupplierPayload): Promise<InteriorSupplierDetail>
  update(id: string, payload: UpdateInteriorMaterialSupplierPayload): Promise<InteriorSupplierDetail>
  delete(id: string): Promise<void>
  unlinkCatalogLink(linkId: string): Promise<void>
  linkCatalogMaterial(supplierId: string, payload: LinkSupplierCatalogPayload): Promise<InteriorSupplierDetail>
  recordPurchase(
    supplierId: string,
    payload: RecordInteriorMaterialPurchasePayload,
  ): Promise<InteriorSupplierDetail>
}
