import { isTrendGood, getDeltaPct } from '../utils/dataUtils'
import type { MetricMeta, DayEntry } from '../types/metrics'

interface KPICardProps {
  label: string
  value: number | null
  unit: string
  trend: 'up' | 'down' | 'neutral'
  direction: MetricMeta['direction']
  description: string
  period: string
  tooltip: string
  days?: DayEntry[]
  metricKey?: keyof DayEntry['metrics']
}

export default function KPICard({
  label,
  value,
  unit,
  trend,
  direction,
  description,
  period,
  tooltip,
  days,
  metricKey,
}: KPICardProps) {
  const good = isTrendGood(trend, direction)

  const trendColor =
    good === true ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
    good === false ? 'bg-red-50 border-red-200 text-red-700' :
    'bg-gray-50 border-gray-200 text-gray-600'

  const trendArrow =
    trend === 'up' ? '↑' :
    trend === 'down' ? '↓' : '→'

  const deltaPct = days && metricKey ? getDeltaPct(days, metricKey) : null

  const trendText = () => {
    if (trend === 'neutral') return 'Estable vs 30 días previos'
    if (deltaPct === null) return `${trend === 'up' ? 'Subiendo' : 'Bajando'} vs 30 días previos`
    const absPct = Math.abs(deltaPct).toFixed(1)
    return `${absPct}% vs 30 días previos`
  }

  const displayValue = value === null
    ? '—'
    : unit === '%'
      ? `${value.toFixed(1)}%`
      : `${Math.round(value)}`

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-[18px] shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_0_rgba(0,0,0,0.06),0_8px_24px_-4px_rgba(0,0,0,0.06)] transition-shadow">

      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-snug">
          {label}
        </span>
        <div className="relative group flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400 cursor-help mt-0.5">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 5.5v3M8 10.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="absolute right-0 top-6 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg leading-relaxed">
            {tooltip}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-snug mb-3.5">
        {description}
      </p>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-[28px] font-semibold text-gray-900 leading-none">
          {displayValue}
        </span>
        {value !== null && unit !== '%' && (
          <span className="text-sm text-gray-400">{unit}</span>
        )}
      </div>

      <p className="text-[10px] text-gray-400 italic mb-3">{period}</p>

      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-medium ${trendColor}`}>
        <span>{trendArrow}</span>
        <span>{trendText()}</span>
      </span>
    </div>
  )
}