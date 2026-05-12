import type { DatasetData, DayEntry } from '../types/metrics'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import {
  average,
  getMetricValues,
  getDeltaPct,
  projectValue,
  getAccumulationRate,
} from '../utils/dataUtils'

interface AlertConfig {
  key: 'stale_deals' | 'avg_response_time_min' | 'support_tickets_opened' | 'deals_won'
  label: string
  unit: string
  direction: 'higher_is_better' | 'lower_is_better'
}

interface FocusModalProps {
  dataset: DatasetData
  alert: AlertConfig
  onClose: () => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

const METRIC_INTROS: Record<string, string> = {
  stale_deals: 'El análisis completo de los deals estancados — oportunidades de venta abiertas con más de 60 días sin actividad. Te muestra cómo evolucionaron, qué tan grave es la situación actual y a dónde se dirige si no hay intervención.',
  avg_response_time_min: 'El análisis completo del tiempo de respuesta — minutos que tarda el equipo en contactar nuevos leads. Te muestra cómo cambió, qué tan lejos está del benchmark y proyección si la tendencia continúa.',
  support_tickets_opened: 'El análisis completo de tickets de soporte abiertos por día. Te muestra el volumen actual, su evolución reciente y a dónde escala si no se identifica la causa raíz.',
  deals_won: 'El análisis completo de los deals ganados por día. Te muestra el ritmo actual de cierre, comparación histórica y proyección de impacto en resultados del trimestre.',
}

const CORR_NOTES: Record<string, string> = {
  traffic: 'Tráfico al sitio web',
  leads_created: 'Volumen de nuevos leads que entran al funnel',
  leads_qualified: 'Leads que pasaron el filtro de calificación',
  deals_created: 'Nuevas oportunidades abiertas',
  deals_won: 'Deals cerrados como venta confirmada',
  deals_lost: 'Deals cerrados sin venta',
  avg_response_time_min: 'Velocidad del equipo al contactar leads',
  avg_deal_cycle_days: 'Días promedio que toma cerrar un deal',
  stale_deals: 'Deals atrapados sin movimiento',
  support_tickets_opened: 'Volumen de problemas reportados por clientes',
}

export default function FocusModal({ dataset, alert, onClose }: FocusModalProps) {
  const days = dataset.days
  const last90 = days.slice(-90)

  const chartData = last90
    .filter((d: DayEntry) => d.metrics[alert.key] !== null)
    .map((d: DayEntry) => ({
      date: formatDate(d.date),
      value: d.metrics[alert.key] as number,
    }))

  const baseline = average(getMetricValues(days.slice(-90, -60), alert.key))
  const current = average(getMetricValues(days.slice(-7), alert.key))
  const delta30 = getDeltaPct(days, alert.key)
  const ratePerWeek = getAccumulationRate(days, alert.key)
  const projection30 = projectValue(days, alert.key, 30)
  const projection60 = projectValue(days, alert.key, 60)
  const projection90 = projectValue(days, alert.key, 90)

  const correlations = computeCorrelations(days, alert.key)
  const insight = generateChartInsight(chartData, baseline)
  const combinedReading = generateCombinedReading(alert.key, correlations)

  const projPct = (proj: number | null) => {
    if (proj === null || current === null || current === 0) return null
    return ((proj - current) / current) * 100
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >

        <div className="sticky top-0 bg-white border-b border-gray-100 px-7 py-5 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">
                Análisis profundo
              </p>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{alert.label}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-7 py-7">

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3 mb-7 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-blue-600">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 5.5v3M8 10.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-xs text-blue-900 leading-relaxed">
              <span className="font-semibold">¿Qué estás viendo aquí?</span>{' '}
              {METRIC_INTROS[alert.key] ?? 'Análisis detallado de la métrica seleccionada.'}
            </p>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Estado actual vs el pasado
          </h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Comparación de los números clave para entender la magnitud del problema.
          </p>

          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-red-50 border border-red-200/60 rounded-xl px-4 py-3.5">
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-2">Hoy</p>
              <p className="text-2xl font-semibold text-red-600 tabular-nums leading-none">
                {current !== null ? current.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-600 mt-1.5">{alert.unit}</p>
              <p className="text-[10px] text-gray-400 italic mt-1.5">promedio últimos 7 días</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Hace 3 meses</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums leading-none">
                {baseline !== null ? baseline.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-600 mt-1.5">{alert.unit}</p>
              <p className="text-[10px] text-gray-400 italic mt-1.5">la "normalidad" de referencia</p>
            </div>
            <div className="bg-orange-50/60 border border-orange-200/60 rounded-xl px-4 py-3.5">
              <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wider mb-2">Cambio</p>
              <p className="text-2xl font-semibold text-red-600 tabular-nums leading-none">
                {delta30 !== null ? `${delta30 > 0 ? '+' : ''}${delta30.toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-gray-600 mt-1.5">
                {delta30 !== null && delta30 > 0 ? 'peor que antes' : delta30 !== null && delta30 < 0 ? 'mejor que antes' : 'sin cambio'}
              </p>
              <p className="text-[10px] text-gray-400 italic mt-1.5">vs 30 días previos</p>
            </div>
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-4 py-3.5">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2">Empeora a</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums leading-none">
                {ratePerWeek !== null ? `${ratePerWeek > 0 ? '+' : ''}${ratePerWeek.toFixed(1)}` : '—'}
              </p>
              <p className="text-xs text-gray-600 mt-1.5">{alert.unit} / semana</p>
              <p className="text-[10px] text-gray-400 italic mt-1.5">últimas 4 semanas</p>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Cómo llegamos hasta acá
          </h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Evolución de la métrica en los últimos 90 días. La línea punteada marca el nivel "normal" de referencia.
          </p>

          <div className="bg-gray-50 rounded-xl p-5 mb-3">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="modal-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  interval={14}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                {baseline !== null && (
                  <ReferenceLine
                    y={baseline}
                    stroke="#9ca3af"
                    strokeDasharray="4 4"
                    label={{
                      value: `Normalidad: ${baseline.toFixed(0)}`,
                      position: 'right',
                      fontSize: 11,
                      fill: '#6b7280',
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="value"
                  name={alert.label}
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#modal-grad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {insight && (
            <div className="bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-4 py-3 mb-8 flex items-start gap-2.5">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-red-500">
                <path d="M8 1l7 13H1L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M8 6v3.5M8 11v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-xs text-red-900 leading-relaxed">{insight}</p>
            </div>
          )}

          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Hacia dónde vamos
          </h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Proyección si la tendencia actual se mantiene sin intervención. Calculada con la velocidad de cambio de las últimas 4 semanas.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { days: 30, value: projection30, color: 'yellow' },
              { days: 60, value: projection60, color: 'orange' },
              { days: 90, value: projection90, color: 'red' },
            ].map(({ days: d, value, color }) => {
              const pct = projPct(value)
              const barColor = color === 'yellow' ? '#fbbf24' : color === 'orange' ? '#fb923c' : '#ef4444'
              return (
                <div key={d} className="bg-white border border-gray-200 rounded-xl overflow-hidden relative">
                  <div className="h-1" style={{ backgroundColor: barColor }} />
                  <div className="px-4 py-3.5">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      En {d} días
                    </p>
                    <p className="text-xl font-semibold text-gray-900 tabular-nums">
                      ~{value !== null ? Math.round(value) : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{alert.unit}</p>
                    {pct !== null && (
                      <p className="text-[11px] font-medium text-red-600 mt-2">
                        {pct > 0 ? '+' : ''}{pct.toFixed(0)}% {pct > 0 ? 'más' : 'menos'} que hoy
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {correlations.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Qué más está pasando en paralelo
              </h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Otras métricas que se movieron al mismo tiempo. Pueden ser causa, consecuencia o estar relacionadas.
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {correlations.map(c => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {CORR_NOTES[c.key] ?? 'Métrica relacionada'}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${c.deltaPct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {c.deltaPct > 0 ? '↑' : '↓'} {Math.abs(c.deltaPct).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>

              {combinedReading && (
                <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg px-4 py-3 flex items-start gap-2.5">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5 text-amber-700">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M8 5.5v3M8 10.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <span className="font-semibold">Lectura combinada:</span> {combinedReading}
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}

function computeCorrelations(days: DayEntry[], excludeKey: string) {
  const allKeys: { key: keyof DayEntry['metrics']; label: string }[] = [
    { key: 'traffic', label: 'Tráfico' },
    { key: 'leads_created', label: 'Leads creados' },
    { key: 'leads_qualified', label: 'Leads calificados' },
    { key: 'deals_created', label: 'Deals creados' },
    { key: 'deals_won', label: 'Deals ganados' },
    { key: 'deals_lost', label: 'Deals perdidos' },
    { key: 'avg_response_time_min', label: 'Tiempo de respuesta' },
    { key: 'avg_deal_cycle_days', label: 'Ciclo de deal' },
    { key: 'stale_deals', label: 'Deals estancados' },
    { key: 'support_tickets_opened', label: 'Tickets de soporte' },
  ]

  return allKeys
    .filter(k => k.key !== excludeKey)
    .map(k => {
      const delta = getDeltaPct(days, k.key)
      return delta !== null
        ? { ...k, deltaPct: delta }
        : null
    })
    .filter((x): x is { key: keyof DayEntry['metrics']; label: string; deltaPct: number } => x !== null)
    .filter(x => Math.abs(x.deltaPct) > 10)
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4)
}

function generateChartInsight(chartData: { date: string; value: number }[], baseline: number | null): string | null {
  if (chartData.length < 30 || baseline === null) return null

  const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2))
  const secondHalf = chartData.slice(Math.floor(chartData.length / 2))

  const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / secondHalf.length

  const acceleration = (secondAvg - firstAvg) / firstAvg

  if (acceleration > 0.2) {
    return `El problema se aceleró en la segunda mitad del período. Durante los primeros 45 días la métrica se mantuvo en rangos cercanos a la normalidad, pero luego el deterioro se intensificó. Algo cambió en el proceso — vale la pena identificar qué ocurrió en ese punto de inflexión.`
  }
  if (acceleration < -0.2) {
    return `Hay una mejora reciente. La segunda mitad del período muestra mejores números que la primera. Si conoces la causa, vale la pena documentarla para mantener la tendencia.`
  }
  return `El cambio ha sido gradual y constante durante todo el período. No hay un punto de inflexión claro — es un problema sistémico que requiere intervención estructural, no un fix puntual.`
}

function generateCombinedReading(focusKey: string, correlations: { key: keyof DayEntry['metrics']; deltaPct: number }[]): string | null {
  if (correlations.length === 0) return null

  const hasMetric = (key: string) => correlations.some(c => c.key === key)
  const dealsLostDown = correlations.find(c => c.key === 'deals_lost' && c.deltaPct < -5)
  const cycleUp = correlations.find(c => c.key === 'avg_deal_cycle_days' && c.deltaPct > 5)
  const ticketsUp = correlations.find(c => c.key === 'support_tickets_opened' && c.deltaPct > 5)
  const trafficDown = correlations.find(c => c.key === 'traffic' && c.deltaPct < -5)
  const leadsDown = correlations.find(c => c.key === 'leads_created' && c.deltaPct < -5)

  if (focusKey === 'stale_deals' && dealsLostDown && cycleUp) {
    return 'los deals no se están cerrando ni como ganados ni como perdidos — simplemente se quedan abiertos sin actividad. Sumado al ciclo de deal más largo, sugiere falta de decisión en el equipo de ventas o procesos sin SLA claro.'
  }
  if (focusKey === 'avg_response_time_min' && hasMetric('leads_created')) {
    return 'el tiempo de respuesta empeora justo cuando hay cambios en el volumen de leads. Probable cuello de botella de capacidad — el equipo no puede manejar el flujo actual con los recursos disponibles.'
  }
  if (focusKey === 'support_tickets_opened' && ticketsUp === undefined && hasMetric('deals_won')) {
    return 'el aumento de tickets coincide con cambios en cierres. Vale la pena revisar si los clientes recientes son los que están generando más soporte — eso indicaría un mismatch entre lo que vende ventas y lo que entrega producto.'
  }
  if (focusKey === 'deals_won' && (trafficDown || leadsDown)) {
    return 'la caída en cierres viene acompañada de menos tráfico o menos leads — el problema no es del equipo de ventas, sino del top of funnel. La prioridad debería ser generación de demanda.'
  }
  if (correlations.filter(c => c.deltaPct > 5).length >= 2) {
    return 'múltiples métricas se están deteriorando en paralelo. Esto sugiere un problema sistémico — no es un evento aislado sino un patrón que afecta varios frentes del negocio.'
  }
  return 'estas métricas se movieron en el mismo período. Revisar si hay un evento común (cambio de equipo, herramienta, proceso) que pueda explicar el patrón.'
}