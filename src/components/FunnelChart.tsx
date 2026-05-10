import type { DayEntry } from '../types/metrics'
import { getFunnelData } from '../utils/dataUtils'

interface FunnelChartProps {
  days: DayEntry[]
}

const BENCHMARKS: Record<string, { good: number; label: string }> = {
  'Tráfico→Leads': { good: 3, label: 'tráfico → lead' },
  'Leads→Calificados': { good: 50, label: 'lead → calificado' },
  'Calificados→Deals': { good: 60, label: 'calificado → deal' },
  'Deals→Ganados': { good: 35, label: 'deal → ganado' },
}

export default function FunnelChart({ days }: FunnelChartProps) {
  const data = getFunnelData(days)
  const max = data[0].value

  const conversions = data.slice(1).map((item, i) => {
    const prev = data[i].value
    const rate = prev > 0 ? (item.value / prev) * 100 : 0
    const stepKey = `${data[i].name}→${item.name}`
    const benchmark = BENCHMARKS[stepKey]?.good ?? 50
    const gap = benchmark - rate

    return {
      from: data[i].name,
      to: item.name,
      rate,
      benchmark,
      gap,
      index: i + 1,
      stepKey,
    }
  })

  const significantSteps = conversions.filter(c => c.from !== 'Tráfico')

  const worstStep = significantSteps.reduce((worst, current) =>
    current.gap > worst.gap ? current : worst
  , significantSteps[0])

  const isProblematic = worstStep.gap > 3

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_4px_12px_-2px_rgba(0,0,0,0.04)]">
      <div className="mb-5">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Funnel de conversión — promedio 30d
        </h3>
        <p className="text-xs text-gray-400 mt-1.5">
          Cómo el tráfico del sitio se transforma en ventas confirmadas, paso por paso.
        </p>
      </div>

      <div className="flex flex-col gap-4 pb-2 mb-5">
        {data.map((item, i) => {
          const prev = i > 0 ? data[i - 1].value : null
          const convRate = prev && prev > 0
            ? ((item.value / prev) * 100).toFixed(1)
            : null
          const isWorst = isProblematic && i === worstStep.index

          return (
            <div key={item.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${isWorst ? 'text-red-600' : 'text-gray-700'}`}>
                  {item.name}
                </span>
                <div className="flex items-center gap-3">
                  {convRate && i > 0 && (
                    <span className={`text-xs ${isWorst ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {convRate}% de {data[i - 1].name.toLowerCase()} convierte
                    </span>
                  )}
                  <span className="font-semibold text-gray-900 w-16 text-right">
                    {item.value.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max((item.value / max) * 100, 1)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {isProblematic ? (
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
            <path d="M8 1l7 13H1L8 1z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M8 6v3.5M8 11v.01" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
              Cuello de botella detectado
            </p>
            <p className="text-xs text-amber-900 leading-relaxed">
              {getInsightMessage(worstStep)}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg px-4 py-3 flex items-start gap-2.5">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
            <path d="M3 8l3.5 3.5L13 5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider mb-1">
              Funnel saludable
            </p>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Todas las conversiones del funnel están dentro de rangos esperados para B2B SaaS. El proceso de venta funciona bien en cada etapa.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function getInsightMessage(step: { from: string; to: string; rate: number; benchmark: number }): string {
  const rateStr = step.rate.toFixed(1)
  const benchStr = step.benchmark.toFixed(0)

  if (step.from === 'Deals') {
    return `Solo ${rateStr}% de los deals se cierran como ganados, vs ~${benchStr}% esperado para B2B SaaS. Cada deal perdido aquí ya pasó marketing, calificación y negociación — es el punto más caro del funnel para fallar. Revisar precios, propuesta de valor, manejo de objeciones y proceso de cierre.`
  }
  if (step.from === 'Calificados') {
    return `Solo ${rateStr}% de los leads calificados llega a abrir un deal, vs ~${benchStr}% esperado. Los leads pasaron el filtro pero se enfrían antes de la negociación. Suele indicar fricción en el handoff, demora en agendar reuniones, o calificación muy laxa.`
  }
  if (step.from === 'Leads') {
    return `Solo ${rateStr}% de los leads pasa la calificación, vs ~${benchStr}% esperado. El marketing puede estar atrayendo audiencia equivocada — fuera de mercado, sin presupuesto, o sin necesidad real. Vale la pena revisar canales y mensajes de adquisición.`
  }
  return `El paso ${step.from.toLowerCase()} → ${step.to.toLowerCase()} tiene una conversión del ${rateStr}%, por debajo del ~${benchStr}% esperado.`
}