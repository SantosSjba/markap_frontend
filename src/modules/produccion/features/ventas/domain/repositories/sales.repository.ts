import type {
  CreateDeliveryPayload,
  CreateQuotationPayload,
  ListDeliveriesParams,
  ListOrdersParams,
  ListQuotationsParams,
  ProduccionDeliveryDetail,
  ProduccionDeliveryListItem,
  ProduccionOrderDetail,
  ProduccionOrderListItem,
  ProduccionQuotationDetail,
  ProduccionQuotationListItem,
} from '../sales.types'
export interface ProduccionSalesRepository {
  listQuotations: (
    params?: ListQuotationsParams,
  ) => Promise<{ data: ProduccionQuotationListItem[]; total: number }>
  getQuotation: (id: string) => Promise<ProduccionQuotationDetail>
  createQuotation: (payload: CreateQuotationPayload) => Promise<ProduccionQuotationDetail>
  updateQuotation: (
    id: string,
    payload: Partial<CreateQuotationPayload>,
  ) => Promise<ProduccionQuotationDetail>
  sendQuotation: (id: string) => Promise<ProduccionQuotationDetail>
  acceptQuotation: (id: string) => Promise<ProduccionQuotationDetail>
  rejectQuotation: (id: string) => Promise<ProduccionQuotationDetail>
  convertQuotationToOrder: (id: string) => Promise<ProduccionOrderDetail>
  deleteQuotation: (id: string) => Promise<undefined>
  fetchQuotationPdfHtml: (id: string) => Promise<string>
  listOrders: (
    params?: ListOrdersParams,
  ) => Promise<{ data: ProduccionOrderListItem[]; total: number }>
  getOrder: (id: string) => Promise<ProduccionOrderDetail>
  confirmOrder: (id: string) => Promise<ProduccionOrderDetail>
  createWorkOrderFromOrder: (id: string) => Promise<ProduccionOrderDetail>
  markOrderReady: (id: string) => Promise<ProduccionOrderDetail>
  cancelOrder: (id: string) => Promise<ProduccionOrderDetail>
  deleteOrder: (id: string) => Promise<undefined>
  listDeliveries: (
    params?: ListDeliveriesParams,
  ) => Promise<{ data: ProduccionDeliveryListItem[]; total: number }>
  getDelivery: (id: string) => Promise<ProduccionDeliveryDetail>
  createDelivery: (payload: CreateDeliveryPayload) => Promise<ProduccionDeliveryDetail>
  updateDelivery: (
    id: string,
    payload: Partial<CreateDeliveryPayload>,
  ) => Promise<ProduccionDeliveryDetail>
  completeDelivery: (id: string) => Promise<ProduccionDeliveryDetail>
  cancelDelivery: (id: string) => Promise<ProduccionDeliveryDetail>
  deleteDelivery: (id: string) => Promise<undefined>
}
