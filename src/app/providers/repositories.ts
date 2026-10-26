import { incomeTaxRepositoryKey } from '@modules/contabilidad/features/tributos/application/ports/income-tax.port'
import { incomeTaxApiRepository } from '@modules/contabilidad/features/tributos/infrastructure/contabilidad-income-tax.api.repository'
import type { App } from 'vue'
import { provideService } from '@shared/presentation/di/services'
import { agentsRepositoryKey as alquileresAgentesKey } from '@modules/alquileres/features/agentes/application/ports/agents.port'
import { agentsApiRepository as alquileresAgentesAdapter } from '@modules/alquileres/features/agentes/infrastructure/repositories/agents.api.repository'
import { rentalsRepositoryKey as alquileresAlquileresKey } from '@modules/alquileres/features/alquileres/application/ports/rentals.port'
import { rentalsApiRepository as alquileresAlquileresAdapter } from '@modules/alquileres/features/alquileres/infrastructure/repositories/rentals.api.repository'
import { clientsRepositoryKey as alquileresClientesKey } from '@modules/alquileres/features/clientes/application/ports/clients.port'
import { clientsApiRepository as alquileresClientesAdapter } from '@modules/alquileres/features/clientes/infrastructure/repositories/clients.api.repository'
import { paymentsRepositoryKey as alquileresCobranzasKey } from '@modules/alquileres/features/cobranzas/application/ports/payments.port'
import { paymentsApiRepository as alquileresCobranzasAdapter } from '@modules/alquileres/features/cobranzas/infrastructure/repositories/payments.api.repository'
import { alertConfigRepositoryKey as alquileresConfiguracionKey } from '@modules/alquileres/features/configuracion/application/ports/alert-config.port'
import { alertConfigApiRepository as alquileresConfiguracionAdapter } from '@modules/alquileres/features/configuracion/infrastructure/repositories/alert-config.api.repository'
import { propertiesRepositoryKey as alquileresPropiedadesKey } from '@modules/alquileres/features/propiedades/application/ports/properties.port'
import { propertiesApiRepository as alquileresPropiedadesAdapter } from '@modules/alquileres/features/propiedades/infrastructure/repositories/properties.api.repository'
import { reportesRepositoryKey as alquileresReportesKey } from '@modules/alquileres/features/reportes/application/ports/reportes.port'
import { reportesApiRepository as alquileresReportesAdapter } from '@modules/alquileres/features/reportes/infrastructure/repositories/reportes.api.repository'
import { applicationsRepositoryKey as applicationsKey } from '@modules/applications/application/ports/applications.port'
import { applicationsApiRepository as applicationsAdapter } from '@modules/applications/infrastructure/repositories/applications.api.repository'
import { arquitecturaClientsRepositoryKey as arquitecturaClientesKey } from '@modules/arquitectura/features/clientes/application/ports/clients.port'
import { arquitecturaClientsApiRepository as arquitecturaClientesAdapter } from '@modules/arquitectura/features/clientes/infrastructure/repositories/clients.api.repository'
import { arquitecturaConfigRepositoryKey as arquitecturaConfiguracionKey } from '@modules/arquitectura/features/configuracion/application/ports/arquitectura-config.port'
import { arquitecturaConfigApiRepository as arquitecturaConfiguracionAdapter } from '@modules/arquitectura/features/configuracion/infrastructure/repositories/arquitectura-config.api.repository'
import { arquitecturaCalendarRepositoryKey as arquitecturaCronogramaKey } from '@modules/arquitectura/features/cronograma/application/ports/calendar.port'
import { arquitecturaCalendarApiRepository as arquitecturaCronogramaAdapter } from '@modules/arquitectura/features/cronograma/infrastructure/calendar.api.repository'
import { arquitecturaDocumentsRepositoryKey as arquitecturaDocumentosKey } from '@modules/arquitectura/features/documentos/application/ports/documents.port'
import { arquitecturaDocumentsApiRepository as arquitecturaDocumentosAdapter } from '@modules/arquitectura/features/documentos/infrastructure/documents.api.repository'
import { arquitecturaExecutionRepositoryKey as arquitecturaEjecucionKey } from '@modules/arquitectura/features/ejecucion/application/ports/execution.port'
import { arquitecturaExecutionApiRepository as arquitecturaEjecucionAdapter } from '@modules/arquitectura/features/ejecucion/infrastructure/execution.api.repository'
import { arquitecturaFinanceRepositoryKey as arquitecturaFinanzasKey } from '@modules/arquitectura/features/finanzas/application/ports/finance.port'
import { arquitecturaFinanceApiRepository as arquitecturaFinanzasAdapter } from '@modules/arquitectura/features/finanzas/infrastructure/finance.api.repository'
import { arquitecturaCatalogMaterialsRepositoryKey as arquitecturaMaterialesKey } from '@modules/arquitectura/features/materiales/application/ports/catalog-materials.port'
import { arquitecturaCatalogMaterialsApiRepository as arquitecturaMaterialesAdapter } from '@modules/arquitectura/features/materiales/infrastructure/catalog-materials.api.repository'
import { arquitecturaMaterialSuppliersRepositoryKey as arquitecturaMaterialesmaterialSuppliersKey } from '@modules/arquitectura/features/materiales/application/ports/material-suppliers.port'
import { arquitecturaMaterialSuppliersApiRepository as arquitecturaMaterialesmaterialSuppliersAdapter } from '@modules/arquitectura/features/materiales/infrastructure/material-suppliers.api.repository'
import { arquitecturaBudgetsRepositoryKey as arquitecturaPresupuestosKey } from '@modules/arquitectura/features/presupuestos/application/ports/budgets.port'
import { arquitecturaBudgetsApiRepository as arquitecturaPresupuestosAdapter } from '@modules/arquitectura/features/presupuestos/infrastructure/budgets.api.repository'
import { projectBudgetRepositoryKey as arquitecturaProyectoPresupuestoKey } from '@modules/arquitectura/features/proyecto-presupuesto/application/ports/project-budget.port'
import { projectBudgetApiRepository as arquitecturaProyectoPresupuestoAdapter } from '@modules/arquitectura/features/proyecto-presupuesto/infrastructure/project-budget.api.repository'
import { arquitecturaProjectsRepositoryKey as arquitecturaProyectosKey } from '@modules/arquitectura/features/proyectos/application/ports/projects.port'
import { arquitecturaProjectsApiRepository as arquitecturaProyectosAdapter } from '@modules/arquitectura/features/proyectos/infrastructure/projects.api.repository'
import { arquitecturaReportesRepositoryKey as arquitecturaReportesKey } from '@modules/arquitectura/features/reportes/application/ports/reportes.port'
import { arquitecturaReportesApiRepository as arquitecturaReportesAdapter } from '@modules/arquitectura/features/reportes/infrastructure/repositories/reportes.api.repository'
import { contabilidadJournalRepositoryKey as contabilidadAsientosKey } from '@modules/contabilidad/features/asientos/application/ports/contabilidad-journal.port'
import { contabilidadJournalApiRepository as contabilidadAsientosAdapter } from '@modules/contabilidad/features/asientos/infrastructure/repositories/contabilidad-journal.api.repository'
import { auditRepositoryKey as contabilidadAuditoriaKey } from '@modules/contabilidad/features/auditoria/application/ports/audit.port'
import { auditApiRepository as contabilidadAuditoriaAdapter } from '@modules/contabilidad/features/auditoria/infrastructure/repositories/audit.api.repository'
import { contabilidadCostCentersRepositoryKey as contabilidadCentrosCostoKey } from '@modules/contabilidad/features/centros-costo/application/ports/contabilidad-cost-centers.port'
import { contabilidadCostCentersApiRepository as contabilidadCentrosCostoAdapter } from '@modules/contabilidad/features/centros-costo/infrastructure/repositories/contabilidad-cost-centers.api.repository'
import { contabilidadClosingRepositoryKey as contabilidadCierreKey } from '@modules/contabilidad/features/cierre/application/ports/contabilidad-closing.port'
import { contabilidadClosingApiRepository as contabilidadCierreAdapter } from '@modules/contabilidad/features/cierre/infrastructure/repositories/contabilidad-closing.api.repository'
import { contabilidadPurchasesRepositoryKey as contabilidadComprasKey } from '@modules/contabilidad/features/compras/application/ports/contabilidad-purchases.port'
import { contabilidadPurchasesApiRepository as contabilidadComprasAdapter } from '@modules/contabilidad/features/compras/infrastructure/repositories/contabilidad-purchases.api.repository'
import { contabilidadConfigRepositoryKey as contabilidadConfiguracionKey } from '@modules/contabilidad/features/configuracion/application/ports/contabilidad-config.port'
import { contabilidadConfigApiRepository as contabilidadConfiguracionAdapter } from '@modules/contabilidad/features/configuracion/infrastructure/repositories/contabilidad-config.api.repository'
import { contabilidadCpeLogRepositoryKey as contabilidadCpeLogKey } from '@modules/contabilidad/features/cpe-log/application/ports/contabilidad-cpe-log.port'
import { contabilidadCpeLogApiRepository as contabilidadCpeLogAdapter } from '@modules/contabilidad/features/cpe-log/infrastructure/repositories/contabilidad-cpe-log.api.repository'
import { contabilidadSolRepositoryKey as contabilidadDeclaracionesSolKey } from '@modules/contabilidad/features/declaraciones-sol/application/ports/contabilidad-sol.port'
import { contabilidadSolApiRepository as contabilidadDeclaracionesSolAdapter } from '@modules/contabilidad/features/declaraciones-sol/infrastructure/repositories/contabilidad-sol.api.repository'
import { contabilidadCpeRepositoryKey as contabilidadFacturacionElectronicaKey } from '@modules/contabilidad/features/facturacion-electronica/application/ports/contabilidad-cpe.port'
import { contabilidadCpeApiRepository as contabilidadFacturacionElectronicaAdapter } from '@modules/contabilidad/features/facturacion-electronica/infrastructure/repositories/contabilidad-cpe.api.repository'
import { contabilidadInventoryRepositoryKey as contabilidadInventarioContableKey } from '@modules/contabilidad/features/inventario-contable/application/ports/contabilidad-inventory.port'
import { contabilidadInventoryApiRepository as contabilidadInventarioContableAdapter } from '@modules/contabilidad/features/inventario-contable/infrastructure/repositories/contabilidad-inventory.api.repository'
import { contabilidadPleRepositoryKey as contabilidadLibrosEKey } from '@modules/contabilidad/features/libros-e/application/ports/contabilidad-ple.port'
import { contabilidadPleApiRepository as contabilidadLibrosEAdapter } from '@modules/contabilidad/features/libros-e/infrastructure/repositories/contabilidad-ple.api.repository'
import { contabilidadPeriodsRepositoryKey as contabilidadPeriodosKey } from '@modules/contabilidad/features/periodos/application/ports/contabilidad-periods.port'
import { contabilidadPeriodsApiRepository as contabilidadPeriodosAdapter } from '@modules/contabilidad/features/periodos/infrastructure/repositories/contabilidad-periods.api.repository'
import { contabilidadAccountsRepositoryKey as contabilidadPlanCuentasKey } from '@modules/contabilidad/features/plan-cuentas/application/ports/contabilidad-accounts.port'
import { contabilidadAccountsApiRepository as contabilidadPlanCuentasAdapter } from '@modules/contabilidad/features/plan-cuentas/infrastructure/repositories/contabilidad-accounts.api.repository'
import { contabilidadJournalTemplatesRepositoryKey as contabilidadPlantillasAsientoKey } from '@modules/contabilidad/features/plantillas-asiento/application/ports/contabilidad-journal-templates.port'
import { contabilidadJournalTemplatesApiRepository as contabilidadPlantillasAsientoAdapter } from '@modules/contabilidad/features/plantillas-asiento/infrastructure/repositories/contabilidad-journal-templates.api.repository'
import { contabilidadFinancialRepositoryKey as contabilidadReportesFinancierosKey } from '@modules/contabilidad/features/reportes-financieros/application/ports/contabilidad-financial.port'
import { contabilidadFinancialApiRepository as contabilidadReportesFinancierosAdapter } from '@modules/contabilidad/features/reportes-financieros/infrastructure/repositories/contabilidad-financial.api.repository'
import { contabilidadReportsRepositoryKey as contabilidadReportesFinancieroscontabilidadReportsKey } from '@modules/contabilidad/features/reportes-financieros/application/ports/contabilidad-reports.port'
import { contabilidadReportsApiRepository as contabilidadReportesFinancieroscontabilidadReportsAdapter } from '@modules/contabilidad/features/reportes-financieros/infrastructure/repositories/contabilidad-reports.api.repository'
import { contabilidadTreasuryRepositoryKey as contabilidadTesoreriaKey } from '@modules/contabilidad/features/tesoreria/application/ports/contabilidad-treasury.port'
import { contabilidadTreasuryApiRepository as contabilidadTesoreriaAdapter } from '@modules/contabilidad/features/tesoreria/infrastructure/repositories/contabilidad-treasury.api.repository'
import { contabilidadExchangeRatesRepositoryKey as contabilidadTiposCambioKey } from '@modules/contabilidad/features/tipos-cambio/application/ports/contabilidad-exchange-rates.port'
import { contabilidadExchangeRatesApiRepository as contabilidadTiposCambioAdapter } from '@modules/contabilidad/features/tipos-cambio/infrastructure/repositories/contabilidad-exchange-rates.api.repository'
import { contabilidadTaxesRepositoryKey as contabilidadTributosKey } from '@modules/contabilidad/features/tributos/application/ports/contabilidad-taxes.port'
import { contabilidadTaxesApiRepository as contabilidadTributosAdapter } from '@modules/contabilidad/features/tributos/infrastructure/repositories/contabilidad-taxes.api.repository'
import { contabilidadSalesRepositoryKey as contabilidadVentasContablesKey } from '@modules/contabilidad/features/ventas-contables/application/ports/contabilidad-sales.port'
import { contabilidadSalesApiRepository as contabilidadVentasContablesAdapter } from '@modules/contabilidad/features/ventas-contables/infrastructure/repositories/contabilidad-sales.api.repository'
import { interiorCalendarRepositoryKey as interiorismoCalendarioKey } from '@modules/interiorismo/features/calendario/application/ports/calendar.port'
import { interiorCalendarApiRepository as interiorismoCalendarioAdapter } from '@modules/interiorismo/features/calendario/infrastructure/calendar.api.repository'
import { interiorClientsRepositoryKey as interiorismoClientesKey } from '@modules/interiorismo/features/clientes/application/ports/clients.port'
import { interiorClientsApiRepository as interiorismoClientesAdapter } from '@modules/interiorismo/features/clientes/infrastructure/repositories/clients.api.repository'
import { interiorismoConfigRepositoryKey as interiorismoConfiguracionKey } from '@modules/interiorismo/features/configuracion/application/ports/interiorismo-config.port'
import { interiorismoConfigApiRepository as interiorismoConfiguracionAdapter } from '@modules/interiorismo/features/configuracion/infrastructure/repositories/interiorismo-config.api.repository'
import { interiorDocumentsRepositoryKey as interiorismoDocumentosKey } from '@modules/interiorismo/features/documentos/application/ports/documents.port'
import { interiorDocumentsApiRepository as interiorismoDocumentosAdapter } from '@modules/interiorismo/features/documentos/infrastructure/documents.api.repository'
import { interiorExecutionRepositoryKey as interiorismoEjecucionKey } from '@modules/interiorismo/features/ejecucion/application/ports/execution.port'
import { interiorExecutionApiRepository as interiorismoEjecucionAdapter } from '@modules/interiorismo/features/ejecucion/infrastructure/execution.api.repository'
import { interiorFinanceRepositoryKey as interiorismoFinanzasKey } from '@modules/interiorismo/features/finanzas/application/ports/finance.port'
import { interiorFinanceApiRepository as interiorismoFinanzasAdapter } from '@modules/interiorismo/features/finanzas/infrastructure/finance.api.repository'
import { interiorCatalogMaterialsRepositoryKey as interiorismoMaterialesKey } from '@modules/interiorismo/features/materiales/application/ports/catalog-materials.port'
import { interiorCatalogMaterialsApiRepository as interiorismoMaterialesAdapter } from '@modules/interiorismo/features/materiales/infrastructure/catalog-materials.api.repository'
import { interiorMaterialSuppliersRepositoryKey as interiorismoMaterialesmaterialSuppliersKey } from '@modules/interiorismo/features/materiales/application/ports/material-suppliers.port'
import { interiorMaterialSuppliersApiRepository as interiorismoMaterialesmaterialSuppliersAdapter } from '@modules/interiorismo/features/materiales/infrastructure/material-suppliers.api.repository'
import { projectBudgetRepositoryKey as interiorismoProyectoPresupuestoKey } from '@modules/interiorismo/features/proyecto-presupuesto/application/ports/project-budget.port'
import { projectBudgetApiRepository as interiorismoProyectoPresupuestoAdapter } from '@modules/interiorismo/features/proyecto-presupuesto/infrastructure/project-budget.api.repository'
import { interiorProjectsRepositoryKey as interiorismoProyectosKey } from '@modules/interiorismo/features/proyectos/application/ports/projects.port'
import { interiorProjectsApiRepository as interiorismoProyectosAdapter } from '@modules/interiorismo/features/proyectos/infrastructure/projects.api.repository'
import { interiorReportesRepositoryKey as interiorismoReportesKey } from '@modules/interiorismo/features/reportes/application/ports/reportes.port'
import { interiorReportesApiRepository as interiorismoReportesAdapter } from '@modules/interiorismo/features/reportes/infrastructure/repositories/reportes.api.repository'
import { produccionCatalogRepositoryKey as produccionCatalogoKey } from '@modules/produccion/features/catalogo/application/ports/catalog.port'
import { produccionCatalogApiRepository as produccionCatalogoAdapter } from '@modules/produccion/features/catalogo/infrastructure/catalog.api.repository'
import { produccionClientsRepositoryKey as produccionClientesKey } from '@modules/produccion/features/clientes/application/ports/clients.port'
import { produccionClientsApiRepository as produccionClientesAdapter } from '@modules/produccion/features/clientes/infrastructure/repositories/clients.api.repository'
import { produccionPurchasesRepositoryKey as produccionComprasKey } from '@modules/produccion/features/compras/application/ports/purchases.port'
import { produccionPurchasesApi as produccionComprasAdapter } from '@modules/produccion/features/compras/infrastructure/purchases.api.repository'
import { produccionConfigRepositoryKey as produccionConfiguracionKey } from '@modules/produccion/features/configuracion/application/ports/produccion-config.port'
import { produccionConfigApiRepository as produccionConfiguracionAdapter } from '@modules/produccion/features/configuracion/infrastructure/repositories/produccion-config.api.repository'
import { produccionCostsRepositoryKey as produccionCostosKey } from '@modules/produccion/features/costos/application/ports/costs.port'
import { produccionCostsApi as produccionCostosAdapter } from '@modules/produccion/features/costos/infrastructure/costs.api.repository'
import { produccionInventoryRepositoryKey as produccionInventarioKey } from '@modules/produccion/features/inventario/application/ports/inventory.port'
import { produccionInventoryApi as produccionInventarioAdapter } from '@modules/produccion/features/inventario/infrastructure/inventory.api.repository'
import { produccionReportesRepositoryKey as produccionReportesKey } from '@modules/produccion/features/reportes/application/ports/reportes.port'
import { produccionReportesApi as produccionReportesAdapter } from '@modules/produccion/features/reportes/infrastructure/reportes.api.repository'
import { produccionWorkOrdersRepositoryKey as produccionTallerKey } from '@modules/produccion/features/taller/application/ports/work-orders.port'
import { produccionWorkOrdersApi as produccionTallerAdapter } from '@modules/produccion/features/taller/infrastructure/work-orders.api.repository'
import { produccionSalesRepositoryKey as produccionVentasKey } from '@modules/produccion/features/ventas/application/ports/sales.port'
import { produccionSalesApi as produccionVentasAdapter } from '@modules/produccion/features/ventas/infrastructure/sales.api.repository'
import { roleApplicationsRepositoryKey as settingsKey } from '@modules/settings/application/ports/role-applications.port'
import { roleApplicationsApiRepository as settingsAdapter } from '@modules/settings/infrastructure/repositories/role-applications.api.repository'
import { usersRepositoryKey as settingsusersKey } from '@modules/settings/application/ports/users.port'
import { usersApiRepository as settingsusersAdapter } from '@modules/settings/infrastructure/repositories/users.api.repository'
import { ventasAgentsRepositoryKey as ventasAgentesKey } from '@modules/ventas/features/agentes/application/ports/ventas-agents.port'
import { ventasAgentsApiRepository as ventasAgentesAdapter } from '@modules/ventas/features/agentes/infrastructure/repositories/ventas-agents.api.repository'
import { ventasClientsRepositoryKey as ventasClientesKey } from '@modules/ventas/features/clientes/application/ports/ventas-clients.port'
import { ventasClientsApiRepository as ventasClientesAdapter } from '@modules/ventas/features/clientes/infrastructure/repositories/ventas-clients.api.repository'
import { ventasPropertiesRepositoryKey as ventasPropiedadesKey } from '@modules/ventas/features/propiedades/application/ports/ventas-properties.port'
import { ventasPropertiesApiRepository as ventasPropiedadesAdapter } from '@modules/ventas/features/propiedades/infrastructure/repositories/ventas-properties.api.repository'
import { ventasConfigRepositoryKey as ventasVentasConfiguracionKey } from '@modules/ventas/features/ventas-configuracion/application/ports/ventas-config.port'
import { ventasConfigApiRepository as ventasVentasConfiguracionAdapter } from '@modules/ventas/features/ventas-configuracion/infrastructure/repositories/ventas-config.api.repository'
import { ventasFinanzasRepositoryKey as ventasVentasFinanzasKey } from '@modules/ventas/features/ventas-finanzas/application/ports/ventas-finanzas.port'
import { ventasFinanzasApiRepository as ventasVentasFinanzasAdapter } from '@modules/ventas/features/ventas-finanzas/infrastructure/repositories/ventas-finanzas.api.repository'
import { ventasReportesRepositoryKey as ventasVentasReportesKey } from '@modules/ventas/features/ventas-reportes/application/ports/ventas-reportes.port'
import { ventasReportesApiRepository as ventasVentasReportesAdapter } from '@modules/ventas/features/ventas-reportes/infrastructure/repositories/ventas-reportes.api.repository'
import { ventasSalesRepositoryKey as ventasVentasSalesKey } from '@modules/ventas/features/ventas-sales/application/ports/ventas-sales.port'
import { ventasSalesApiRepository as ventasVentasSalesAdapter } from '@modules/ventas/features/ventas-sales/infrastructure/repositories/ventas-sales.api.repository'
/** Concrete adapters are assembled here; consumers depend on feature ports. */
import {auditLogsRepositoryKey} from '@modules/settings/application/ports/audit-logs.port'
import {auditLogsApiRepository} from '@modules/settings/infrastructure/repositories/audit-logs.api.repository'
export function installRepositories(app: App): void {
  provideService(app, incomeTaxRepositoryKey, incomeTaxApiRepository)
  provideService(app, alquileresAgentesKey, alquileresAgentesAdapter)
  provideService(app, alquileresAlquileresKey, alquileresAlquileresAdapter)
  provideService(app, alquileresClientesKey, alquileresClientesAdapter)
  provideService(app, alquileresCobranzasKey, alquileresCobranzasAdapter)
  provideService(app, alquileresConfiguracionKey, alquileresConfiguracionAdapter)
  provideService(app, alquileresPropiedadesKey, alquileresPropiedadesAdapter)
  provideService(app, alquileresReportesKey, alquileresReportesAdapter)
  provideService(app, applicationsKey, applicationsAdapter)
  provideService(app, arquitecturaClientesKey, arquitecturaClientesAdapter)
  provideService(app, arquitecturaConfiguracionKey, arquitecturaConfiguracionAdapter)
  provideService(app, arquitecturaCronogramaKey, arquitecturaCronogramaAdapter)
  provideService(app, arquitecturaDocumentosKey, arquitecturaDocumentosAdapter)
  provideService(app, arquitecturaEjecucionKey, arquitecturaEjecucionAdapter)
  provideService(app, arquitecturaFinanzasKey, arquitecturaFinanzasAdapter)
  provideService(app, arquitecturaMaterialesKey, arquitecturaMaterialesAdapter)
  provideService(
    app,
    arquitecturaMaterialesmaterialSuppliersKey,
    arquitecturaMaterialesmaterialSuppliersAdapter,
  )
  provideService(app, arquitecturaPresupuestosKey, arquitecturaPresupuestosAdapter)
  provideService(app, arquitecturaProyectoPresupuestoKey, arquitecturaProyectoPresupuestoAdapter)
  provideService(app, arquitecturaProyectosKey, arquitecturaProyectosAdapter)
  provideService(app, arquitecturaReportesKey, arquitecturaReportesAdapter)
  provideService(app, contabilidadAsientosKey, contabilidadAsientosAdapter)
  provideService(app, contabilidadAuditoriaKey, contabilidadAuditoriaAdapter)
  provideService(app, contabilidadCentrosCostoKey, contabilidadCentrosCostoAdapter)
  provideService(app, contabilidadCierreKey, contabilidadCierreAdapter)
  provideService(app, contabilidadComprasKey, contabilidadComprasAdapter)
  provideService(app, contabilidadConfiguracionKey, contabilidadConfiguracionAdapter)
  provideService(app, contabilidadCpeLogKey, contabilidadCpeLogAdapter)
  provideService(app, contabilidadDeclaracionesSolKey, contabilidadDeclaracionesSolAdapter)
  provideService(
    app,
    contabilidadFacturacionElectronicaKey,
    contabilidadFacturacionElectronicaAdapter,
  )
  provideService(app, contabilidadInventarioContableKey, contabilidadInventarioContableAdapter)
  provideService(app, contabilidadLibrosEKey, contabilidadLibrosEAdapter)
  provideService(app, contabilidadPeriodosKey, contabilidadPeriodosAdapter)
  provideService(app, contabilidadPlanCuentasKey, contabilidadPlanCuentasAdapter)
  provideService(app, contabilidadPlantillasAsientoKey, contabilidadPlantillasAsientoAdapter)
  provideService(app, contabilidadReportesFinancierosKey, contabilidadReportesFinancierosAdapter)
  provideService(
    app,
    contabilidadReportesFinancieroscontabilidadReportsKey,
    contabilidadReportesFinancieroscontabilidadReportsAdapter,
  )
  provideService(app, contabilidadTesoreriaKey, contabilidadTesoreriaAdapter)
  provideService(app, contabilidadTiposCambioKey, contabilidadTiposCambioAdapter)
  provideService(app, contabilidadTributosKey, contabilidadTributosAdapter)
  provideService(app, contabilidadVentasContablesKey, contabilidadVentasContablesAdapter)
  provideService(app, interiorismoCalendarioKey, interiorismoCalendarioAdapter)
  provideService(app, interiorismoClientesKey, interiorismoClientesAdapter)
  provideService(app, interiorismoConfiguracionKey, interiorismoConfiguracionAdapter)
  provideService(app, interiorismoDocumentosKey, interiorismoDocumentosAdapter)
  provideService(app, interiorismoEjecucionKey, interiorismoEjecucionAdapter)
  provideService(app, interiorismoFinanzasKey, interiorismoFinanzasAdapter)
  provideService(app, interiorismoMaterialesKey, interiorismoMaterialesAdapter)
  provideService(
    app,
    interiorismoMaterialesmaterialSuppliersKey,
    interiorismoMaterialesmaterialSuppliersAdapter,
  )
  provideService(app, interiorismoProyectoPresupuestoKey, interiorismoProyectoPresupuestoAdapter)
  provideService(app, interiorismoProyectosKey, interiorismoProyectosAdapter)
  provideService(app, interiorismoReportesKey, interiorismoReportesAdapter)
  provideService(app, produccionCatalogoKey, produccionCatalogoAdapter)
  provideService(app, produccionClientesKey, produccionClientesAdapter)
  provideService(app, produccionComprasKey, produccionComprasAdapter)
  provideService(app, produccionConfiguracionKey, produccionConfiguracionAdapter)
  provideService(app, produccionCostosKey, produccionCostosAdapter)
  provideService(app, produccionInventarioKey, produccionInventarioAdapter)
  provideService(app, produccionReportesKey, produccionReportesAdapter)
  provideService(app, produccionTallerKey, produccionTallerAdapter)
  provideService(app, produccionVentasKey, produccionVentasAdapter)
  provideService(app, auditLogsRepositoryKey, auditLogsApiRepository)
  provideService(app, settingsKey, settingsAdapter)
  provideService(app, settingsusersKey, settingsusersAdapter)
  provideService(app, ventasAgentesKey, ventasAgentesAdapter)
  provideService(app, ventasClientesKey, ventasClientesAdapter)
  provideService(app, ventasPropiedadesKey, ventasPropiedadesAdapter)
  provideService(app, ventasVentasConfiguracionKey, ventasVentasConfiguracionAdapter)
  provideService(app, ventasVentasFinanzasKey, ventasVentasFinanzasAdapter)
  provideService(app, ventasVentasReportesKey, ventasVentasReportesAdapter)
  provideService(app, ventasVentasSalesKey, ventasVentasSalesAdapter)
}
