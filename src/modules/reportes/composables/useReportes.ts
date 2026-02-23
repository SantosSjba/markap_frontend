import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { reportesService } from '../services'

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
  rentalsByMonth: (slug: string, year: number) =>
    [...reportKeys.all, 'rentals-by-month', slug, year] as const,
}

const APPLICATION_SLUG = 'alquileres'

export function useReportsSummary(
  applicationSlug: MaybeRefOrGetter<string> = APPLICATION_SLUG,
  days: MaybeRefOrGetter<number> = 30
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const daysVal = computed(() => toValue(days))
  return useQuery({
    queryKey: computed(() => reportKeys.summary(slugVal.value, daysVal.value)),
    queryFn: () => reportesService.getSummary(slugVal.value, daysVal.value),
  })
}

export function useContractsExpiring(
  applicationSlug: MaybeRefOrGetter<string> = APPLICATION_SLUG,
  days: MaybeRefOrGetter<number> = 30
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const daysVal = computed(() => toValue(days))
  return useQuery({
    queryKey: computed(() => reportKeys.contractsExpiring(slugVal.value, daysVal.value)),
    queryFn: () => reportesService.getContractsExpiring(slugVal.value, daysVal.value),
  })
}

export function usePropertiesWithoutContract(applicationSlug: string = APPLICATION_SLUG) {
  return useQuery({
    queryKey: reportKeys.propertiesWithoutContract(applicationSlug),
    queryFn: () => reportesService.getPropertiesWithoutContract(applicationSlug),
  })
}

export function useActiveClientsReport(applicationSlug: string = APPLICATION_SLUG) {
  return useQuery({
    queryKey: reportKeys.activeClients(applicationSlug),
    queryFn: () => reportesService.getActiveClients(applicationSlug),
  })
}

export function useContractStatusSummary(applicationSlug: string = APPLICATION_SLUG) {
  return useQuery({
    queryKey: reportKeys.contractStatusSummary(applicationSlug),
    queryFn: () => reportesService.getContractStatusSummary(applicationSlug),
  })
}

export function useMonthlyMetrics(applicationSlug: string = APPLICATION_SLUG) {
  return useQuery({
    queryKey: reportKeys.monthlyMetrics(applicationSlug),
    queryFn: () => reportesService.getMonthlyMetrics(applicationSlug),
  })
}

export function useRentalsByMonth(
  applicationSlug: MaybeRefOrGetter<string> = APPLICATION_SLUG,
  year: MaybeRefOrGetter<number> = () => new Date().getFullYear()
) {
  const slugVal = computed(() => toValue(applicationSlug))
  const yearVal = computed(() => toValue(year))
  return useQuery({
    queryKey: computed(() => reportKeys.rentalsByMonth(slugVal.value, yearVal.value)),
    queryFn: () => reportesService.getRentalsByMonth(slugVal.value, yearVal.value),
  })
}
