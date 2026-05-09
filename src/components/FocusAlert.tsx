import type { DatasetData } from '../types/metrics'
import { getLastNDays, getTrend, average, getMetricValues } from '../utils/dataUtils'

interface FocusAlertProps {
  dataset: DatasetData
}

export default function FocusAlert({ dataset }: FocusAlertProps) {
  const days = dataset.days
  const last7 = getLastNDays(days, 7)

  const checks = [
    {
      key: 'stale_deals' as const,
      label: 'Deals estancados',
      description: 'Hay deals sin actividad hace más de 60 días acumulándose.',
      action: 'Revisar pipeline y contactar los deals más antiguos hoy.',
      direction: 'lower_is_better' as const,
    },
    {
      key: 'avg_response_time_min' as const,
      label: 'Tiempo de respuesta',
      description: 'El equipo está tardando más en contactar nuevos leads.',
      action: 'En B2B, responder en menos de 30 min puede duplicar la conversión.',
      direction: 'lower_is_better' as const,
    },
    {
      key: 'support_tickets_opened' as const,
      label: 'Tickets de soporte',
      description: 'El volumen de tickets está aumentando.',
      action: 'Revisar si hay un problema recurrente que pueda resolverse en masa.',
      direction: 'lower_is_better' as const,
    },
    {
      key: 'deals_won' as const,
      label: 'Deals ganados',
      description: 'El cierre de deals está bajando en las últimas semanas.',
      action: 'Revisar los deals en etapa final y priorizar el seguimiento.',
      direction: 'higher_is_better' as const,
    },
  ]

  const alerts = checks.filter(({ key, direction }) => {
    const trend = getTrend(days, key)
    if (trend === 'neutral') return false
    if (direction === 'lower_is_better') return trend === 'up'
    return trend === 'down'
  })

  const value = (key: typeof checks[0]['key']) => {
    const v = average(getMetricValues(last7, key))
    return v !== null ? Math.round(v) : null
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
        <span className="text-emerald-500 text-xl">✓</span>
        <div>
          <p className="text-sm font-medium text-emerald-800">Todo bajo control</p>
          <p className="text-xs text-emerald-600 mt-0.5">No se detectaron métricas con tendencia negativa esta semana.</p>
        </div>
      </div>
    )
  }

  const top = alerts[0]

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-red-500 text-xl mt-0.5">⚠</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            Foco del día — {top.label}
            {value(top.key) !== null && (
              <span className="ml-2 font-normal text-red-600">({value(top.key)})</span>
            )}
          </p>
          <p className="text-xs text-red-700 mt-1">{top.description}</p>
          <p className="text-xs text-red-900 font-medium mt-1.5">{top.action}</p>
          {alerts.length > 1 && (
            <p className="text-xs text-red-400 mt-2">
              +{alerts.length - 1} métrica{alerts.length - 1 > 1 ? 's' : ''} más con tendencia negativa: {alerts.slice(1).map(a => a.label).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}