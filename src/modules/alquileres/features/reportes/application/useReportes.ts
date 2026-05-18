import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { alquileresQueryKeys } from '@modules/alquileres/application/alquileresQueryKeys'
import {
  ALQUILERES_REPORTS_SLUG,
  type FinancialDistributionParams,
  type RentalsByMonthParams,
} from '../domain/reportes.types'
import { reportesApiRepository as reportesRepository } from '../infrastructure/repositories/reportes.api.repository'

export const reportKeys = {
  all: alquileresQueryKeys.reports,
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
  financialDistribution: (slug: string, filterKey: string) =>
    [...reportKeys.all, 'financial-distribution', slug, filterKey] as const,
}

export function useReportsSummary(
  applicationSlug: MaybeRefOrGetter<string> = ALQUILERES_REPORTS_SLUG,
  days: MaybeRefOrGetter<number> = 30,
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const daysVal = computed(() => toValue(days))
  return useQuery({
    queryKey: computed(() => reportKeys.summary(slugVal.value, daysVal.value)),
    queryFn: () => reportesRepository.getSummary(slugVal.value, daysVal.value),
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
    queryFn: () => reportesRepository.getContractsExpiring(slugVal.value, daysVal.value),
  })
}

export function usePropertiesWithoutContract(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.propertiesWithoutContract(applicationSlug),
    queryFn: () => reportesRepository.getPropertiesWithoutContract(applicationSlug),
  })
}

export function useActiveClientsReport(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.activeClients(applicationSlug),
    queryFn: () => reportesRepository.getActiveClients(applicationSlug),
  })
}

export function useContractStatusSummary(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.contractStatusSummary(applicationSlug),
    queryFn: () => reportesRepository.getContractStatusSummary(applicationSlug),
  })
}

export function useMonthlyMetrics(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
  return useQuery({
    queryKey: reportKeys.monthlyMetrics(applicationSlug),
    queryFn: () => reportesRepository.getMonthlyMetrics(applicationSlug),
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
      reportesRepository.getRentalsByMonth(
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
      reportesRepository.getFinancialDistribution(
        slugVal.value,
        paramsVal.value.status,
        paramsVal.value.startDate,
        paramsVal.value.endDate,
      ),
  })
}
