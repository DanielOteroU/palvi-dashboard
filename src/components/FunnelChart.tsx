import type { DayEntry } from '../types/metrics'
import { getFunnelData } from '../utils/dataUtils'

interface FunnelChartProps {
  days: DayEntry[]
}

export default function FunnelChart({ days }: FunnelChartProps) {
  const data = getFunnelData(days)
  const max = data[0].value

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-5">
        Funnel de conversión — promedio 30d
      </h3>
      <div className="flex flex-col gap-3">
        {data.map((item, i) => {
          const prev = i > 0 ? data[i - 1].value : null
          const convRate = prev && prev > 0
            ? ((item.value / prev) * 100).toFixed(1)
            : null

          return (
            <div key={item.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.name}</span>
                <div className="flex items-center gap-3">
                  {convRate && (
                    <span className="text-xs text-gray-400">{convRate}% del paso anterior</span>
                  )}
                  <span className="font-semibold text-gray-900 w-16 text-right">
                    {item.value.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}