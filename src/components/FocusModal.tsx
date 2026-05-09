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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >

        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1">
              Análisis profundo
            </p>
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

        <div className="p-8">

          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Actual</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                {current !== null ? current.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{alert.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Baseline</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                {baseline !== null ? baseline.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">90-60 días atrás</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Cambio</p>
              <p className="text-2xl font-semibold text-red-500 tabular-nums">
                {delta30 !== null ? `${delta30 > 0 ? '+' : ''}${delta30.toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">vs 30d previos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Velocidad</p>
              <p className="text-2xl font-semibold text-gray-900 tabular-nums">
                {ratePerWeek !== null ? `${ratePerWeek > 0 ? '+' : ''}${ratePerWeek.toFixed(1)}` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">por semana</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Evolución últimos 90 días
            </h3>
            <div className="bg-gray-50 rounded-xl p-5">
              <ResponsiveContainer width="100%" height={240}>
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
                        value: `Baseline: ${baseline.toFixed(0)}`,
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
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Proyecciones a futuro
            </h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Si la tendencia actual se mantiene sin intervención, estos serán los valores estimados.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">+30 días</p>
                <p className="text-xl font-semibold text-gray-900 tabular-nums">
                  ~{projection30 !== null ? Math.round(projection30) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{alert.unit}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">+60 días</p>
                <p className="text-xl font-semibold text-gray-900 tabular-nums">
                  ~{projection60 !== null ? Math.round(projection60) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{alert.unit}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">+90 días</p>
                <p className="text-xl font-semibold text-gray-900 tabular-nums">
                  ~{projection90 !== null ? Math.round(projection90) : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{alert.unit}</p>
              </div>
            </div>
          </div>

          {correlations.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Métricas relacionadas
              </h3>
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Otras métricas que se movieron en el mismo período. Pueden ser causa, consecuencia o estar correlacionadas.
              </p>
              <div className="flex flex-col gap-2">
                {correlations.map(c => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.note}</p>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${c.deltaPct > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {c.deltaPct > 0 ? '↑' : '↓'} {Math.abs(c.deltaPct).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
        ? { ...k, deltaPct: delta, note: `Cambio vs 30d previos` }
        : null
    })
    .filter((x): x is { key: keyof DayEntry['metrics']; label: string; deltaPct: number; note: string } => x !== null)
    .filter(x => Math.abs(x.deltaPct) > 10)
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4)
}