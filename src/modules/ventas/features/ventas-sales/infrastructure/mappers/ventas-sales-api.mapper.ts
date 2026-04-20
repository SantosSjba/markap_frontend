import type {
  SaleClosingRow,
  SaleProcessDetail,
  SaleProcessListRow,
  SaleSeparationRow,
} from '../../domain/sales.types'

export function mapSaleProcessesListPayload(raw: { data: SaleProcessListRow[]; total: number }) {
  return raw
}

export function mapSaleProcessDetail(raw: SaleProcessDetail): SaleProcessDetail {
  return raw
}

export function mapSaleSeparationsListPayload(raw: { data: SaleSeparationRow[]; total: number }) {
  return raw
}

export function mapSaleClosingsListPayload(raw: { data: SaleClosingRow[]; total: number }) {
  return raw
}
