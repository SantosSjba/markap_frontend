import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import {
  ALQUILERES_REPORTS_SLUG,
  type FinancialDistributionParams,
  type RentalsByMonthParams,
} from '../domain/reportes.types'
import { reportesService } from '../infrastructure/reportes.service'

export const reportKeys = {
  all: ['reports'] as const,
  summary: (slug: string, days: number) => [...reportKeys.all, 'summary', slug, days] as const,
  contractsExpiring: (slug: string, days: number) =>
    [...reportKeys.all, 'contracts-expiring', slug, days] as const,
  propertiesWithoutContract: (slug: string) =>
    [...reportKeys.all, 'properties-without-contract', slug] as const,
  activeClients: (slug: string) => [...reportKeys.all, 'active-clients', slug] as const,
  contractStatusSummary: (slug: string) =>
    [...reportKeys.all, 'contract-status-summary', slug] as const,
  monthlyMetrics: (slug: string) => [...reportKeys.all, 'monthly-metrics', slug] as const,
  rentalsByMonth: (slug: string, year: number, month?: number, startDate?: string, endDate?: string) =>
    [...reportKeys.all, 'rentals-by-month', slug, year, month ?? '', startDate ?? '', endDate ?? ''] as const,
  financialDistribution: (slug: string, status?: string) =>
    [...reportKeys.all, 'financial-distribution', slug, status ?? ''] as const,
}

export function useReportsSummary(
  applicationSlug: MaybeRefOrGetter<string> = ALQUILERES_REPORTS_SLUG,
  days: MaybeRefOrGetter<number> = 30,
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const daysVal = computed(() => toValue(days))
  return useQuery({
    queryKey: computed(() => reportKeys.summary(slugVal.value, daysVal.value)),
    queryFn: () => reportesService.getSummary(slugVal.value, daysVal.value),
  })
}

export function useContractsExpiring(
  applicationSlug: MaybeRefOrGetter<string> = ALQUILERES_REPORTS_SLUG,
  days: MaybeRefOrGetter<number> = 30,
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const daysVal = computed(() => toValue(days))
  return useQuery({
    queryKey: computed(() => reportKeys.contractsExpiring(slugVal.value, daysVal.value)),
    queryFn: () => reportesService.getContractsExpiring(slugVal.value, daysVal.value),
  })
}

export function usePropertiesWithoutContract(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.propertiesWithoutContract(applicationSlug),
    queryFn: () => reportesService.getPropertiesWithoutContract(applicationSlug),
  })
}

export function useActiveClientsReport(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.activeClients(applicationSlug),
    queryFn: () => reportesService.getActiveClients(applicationSlug),
  })
}

export function useContractStatusSummary(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.contractStatusSummary(applicationSlug),
    queryFn: () => reportesService.getContractStatusSummary(applicationSlug),
  })
}

export function useMonthlyMetrics(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.monthlyMetrics(applicationSlug),
    queryFn: () => reportesService.getMonthlyMetrics(applicationSlug),
  })
}

export function useRentalsByMonth(
  applicationSlug: MaybeRefOrGetter<string> = ALQUILERES_REPORTS_SLUG,
  params: MaybeRefOrGetter<RentalsByMonthParams> = {},
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const paramsVal = computed(() => toValue(params))
  return useQuery({
    queryKey: computed(() =>
      reportKeys.rentalsByMonth(
        slugVal.value,
        paramsVal.value.year ?? new Date().getFullYear(),
        paramsVal.value.month,
        paramsVal.value.startDate,
        paramsVal.value.endDate,
      ),
    ),
    queryFn: () =>
      reportesService.getRentalsByMonth(
        slugVal.value,
        paramsVal.value.year ?? new Date().getFullYear(),
        paramsVal.value.month,
        paramsVal.value.startDate,
        paramsVal.value.endDate,
      ),
  })
}

export function useFinancialDistributionReport(
  applicationSlug: MaybeRefOrGetter<string> = ALQUILERES_REPORTS_SLUG,
  params: MaybeRefOrGetter<FinancialDistributionParams> = {},
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const paramsVal = computed(() => toValue(params))
  return useQuery({
    queryKey: computed(() =>
      reportKeys.financialDistribution(
        slugVal.value,
        [paramsVal.value.status ?? '', paramsVal.value.startDate ?? '', paramsVal.value.endDate ?? ''].join('|'),
      ),
    ),
    queryFn: () =>
      reportesService.getFinancialDistribution(
        slugVal.value,
        paramsVal.value.status,
        paramsVal.value.startDate,
        paramsVal.value.endDate,
      ),
  })
}
