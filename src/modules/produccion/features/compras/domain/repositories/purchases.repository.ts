import type {
  CreatePurchaseOrderPayload,
  CreateSupplierPayload,
  ListPurchaseOrdersParams,
  ListSuppliersParams,
  ProduccionPurchaseOrderDetail,
  ProduccionPurchaseOrderListItem,
  ProduccionSupplierDetail,
  ProduccionSupplierListItem,
  ReceivePurchaseOrderPayload,
} from '../purchases.types'
export interface ProduccionPurchasesRepository {
  listSuppliers: (
    params?: ListSuppliersParams,
  ) => Promise<{ data: ProduccionSupplierListItem[]; total: number }>
  getSupplier: (id: string) => Promise<ProduccionSupplierDetail>
  createSupplier: (payload: CreateSupplierPayload) => Promise<ProduccionSupplierDetail>
  updateSupplier: (
    id: string,
    payload: Partial<CreateSupplierPayload>,
  ) => Promise<ProduccionSupplierDetail>
  deleteSupplier: (id: string) => Promise<undefined>
  linkSupplierMaterial: (
    supplierId: string,
    payload: { materialId: string; supplierSku?: string | null; notes?: string | null },
  ) => Promise<ProduccionSupplierDetail>
  unlinkSupplierMaterial: (linkId: string) => Promise<undefined>
  listPurchaseOrders: (
    params?: ListPurchaseOrdersParams,
  ) => Promise<{ data: ProduccionPurchaseOrderListItem[]; total: number }>
  getPurchaseOrder: (id: string) => Promise<ProduccionPurchaseOrderDetail>
  createPurchaseOrder: (
    payload: CreatePurchaseOrderPayload,
  ) => Promise<ProduccionPurchaseOrderDetail>
  updatePurchaseOrder: (
    id: string,
    payload: Partial<CreatePurchaseOrderPayload>,
  ) => Promise<ProduccionPurchaseOrderDetail>
  sendPurchaseOrder: (id: string) => Promise<ProduccionPurchaseOrderDetail>
  receivePurchaseOrder: (
    id: string,
    payload: ReceivePurchaseOrderPayload,
  ) => Promise<ProduccionPurchaseOrderDetail>
  cancelPurchaseOrder: (id: string) => Promise<ProduccionPurchaseOrderDetail>
  deletePurchaseOrder: (id: string) => Promise<undefined>
}
