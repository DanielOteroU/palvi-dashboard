import { isTrendGood } from '../utils/dataUtils'
import type { MetricMeta } from '../types/metrics'

interface KPICardProps {
  label: string
  value: number | null
  unit: string
  trend: 'up' | 'down' | 'neutral'
  direction: MetricMeta['direction']
}

export default function KPICard({ label, value, unit, trend, direction }: KPICardProps) {
  const good = isTrendGood(trend, direction)

  const trendColor =
    good === true ? 'text-emerald-500' :
    good === false ? 'text-red-500' :
    'text-gray-400'

  const trendBg =
    good === true ? 'bg-emerald-50 border-emerald-200' :
    good === false ? 'bg-red-50 border-red-200' :
    'bg-gray-50 border-gray-200'

  const trendArrow =
    trend === 'up' ? '↑' :
    trend === 'down' ? '↓' : '→'

  const trendLabel =
    trend === 'up' ? 'subiendo' :
    trend === 'down' ? 'bajando' : 'estable'

  const displayValue = value === null
    ? '—'
    : unit === '%'
      ? `${value.toFixed(1)}%`
      : `${Math.round(value)}`

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 shadow-sm">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-semibold text-gray-900">{displayValue}</span>
        {value !== null && (
          <span className="text-sm text-gray-400 mb-1">{unit}</span>
        )}
      </div>
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium w-fit ${trendBg} ${trendColor}`}>
        <span>{trendArrow}</span>
        <span>{trendLabel} vs 30d</span>
      </div>
    </div>
  )
}