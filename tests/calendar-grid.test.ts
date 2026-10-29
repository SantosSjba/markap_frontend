import assert from 'node:assert/strict'
import {
  addMonths,
  groupByDay,
  monthGrid,
  shiftAnchor,
  startOfWeek,
  viewRange,
  weekDays,
} from '@shared/domain/calendar-grid'
import { ganttBar, ganttMonths, ganttScale } from '@modules/interiorismo/features/ejecucion/domain/gantt-layout'

export async function run() {
  let passed = 0
  const check = (name: string, fn: () => void) => {
    fn()
    console.log(`PASS ${name}`)
    passed++
  }

  check('Calendario: la semana empieza el lunes', () => {
    assert.equal(startOfWeek('2026-10-28'), '2026-10-26')
    assert.equal(startOfWeek('2026-11-01'), '2026-10-26')
    assert.deepEqual(weekDays('2026-10-26'), ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'])
  })

  check('Calendario: el mes ocupa semanas completas', () => {
    const cells = monthGrid('2026-10-15')
    assert.equal(cells.length % 7, 0)
    assert.equal(cells[0]?.date, '2026-09-28')
    assert.equal(cells[cells.length - 1]?.date, '2026-11-01')
    assert.equal(cells.filter((c) => c.inMonth).length, 31)
    assert.equal(monthGrid('2027-02-10').length, 28)
  })

  check('Calendario: sumar meses respeta el fin de mes', () => {
    assert.equal(addMonths('2026-01-31', 1), '2026-02-28')
    assert.equal(addMonths('2026-12-15', 1), '2027-01-15')
    assert.equal(shiftAnchor('week', '2026-12-30', 1), '2027-01-06')
  })

  check('Calendario: rango visible por vista', () => {
    assert.deepEqual(viewRange('week', '2026-10-28'), { from: '2026-10-26', to: '2026-11-01' })
    assert.deepEqual(viewRange('list', '2026-02-10'), { from: '2026-02-01', to: '2026-02-28' })
    assert.deepEqual(viewRange('month', '2026-10-15'), { from: '2026-09-28', to: '2026-11-01' })
  })

  check('Calendario: eventos de varios días se reparten y recortan al rango', () => {
    const items = [
      { id: 'a', s: '2026-10-25', e: '2026-10-27' },
      { id: 'b', s: '2026-10-28', e: null },
    ]
    const map = groupByDay(items, { from: '2026-10-26', to: '2026-11-01' }, (i) => i.s, (i) => i.e)
    assert.deepEqual([...map.keys()], ['2026-10-26', '2026-10-27', '2026-10-28'])
    assert.equal(map.get('2026-10-28')?.[0]?.id, 'b')
  })

  check('Gantt: la escala cubre meses completos e incluye hoy', () => {
    const scale = ganttScale(['2026-11-10', null, '2026-12-05'], '2026-10-28')
    assert.deepEqual([scale.from, scale.to, scale.days], ['2026-10-01', '2026-12-31', 92])
    assert.deepEqual(ganttMonths(scale).map((m) => m.date), ['2026-10-01', '2026-11-01', '2026-12-01'])
    assert.deepEqual(ganttScale([], '2026-10-28'), { from: '2026-10-01', to: '2026-11-30', days: 61 })
  })

  check('Gantt: barras inclusivas y tareas con una sola fecha', () => {
    const scale = ganttScale(['2026-10-01', '2026-10-31'], '2026-10-15')
    assert.equal(scale.days, 31)
    const full = ganttBar(scale, '2026-10-01', '2026-10-31')!
    assert.equal(full.left, 0)
    assert.equal(Math.round(full.width), 100)
    assert.equal(ganttBar(scale, null, '2026-10-02')!.width, (1 / 31) * 100)
    assert.equal(ganttBar(scale, null, null), null)
  })

  console.log(`PASS ${passed} comprobaciones de calendario`)
}
