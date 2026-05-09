import { useState } from 'react'
import type { DatasetData } from '../types/metrics'
import {
  getLastNDays,
  getTrend,
  average,
  getMetricValues,
  getDeltaPct,
  getAccumulationRate,
  projectValue,
  getYearAgoValue,
} from '../utils/dataUtils'
import FocusModal from './FocusModal'

interface FocusAlertProps {
  dataset: DatasetData
}

interface AlertConfig {
  key: 'stale_deals' | 'avg_response_time_min' | 'support_tickets_opened' | 'deals_won'
  label: string
  unit: string
  direction: 'higher_is_better' | 'lower_is_better'
  headline: string
  subtitle: string
  critical: string
  actions: string[]
  primaryCTA: string
}

export default function FocusAlert({ dataset }: FocusAlertProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const days = dataset.days

  const checks: AlertConfig[] = [
    {
      key: 'stale_deals',
      label: 'Deals estancados',
      unit: 'deals',
      direction: 'lower_is_better',
      headline: 'El pipeline está acumulando deals sin movimiento.',
      subtitle: 'Los deals estancados están creciendo y aceleran su ritmo en las últimas semanas. Sin acción, el pipeline pierde capacidad de cierre.',
      critical: 'Los deals estancados están creciendo mientras el cierre baja. Cada semana que pasa, el equipo trabaja sobre un pipeline más viejo y menos convertible. Es el problema más urgente del negocio hoy.',
      actions: [
        'Filtrar el CRM por deals con más de 60 días sin actividad y revisar los 10 más antiguos uno a uno.',
        'Definir hoy: cada deal avanza con próximo paso concreto, o se cierra como perdido. No hay tercera opción.',
        'Implementar un SLA: ningún deal puede pasar más de 21 días sin actividad documentada.',
      ],
      primaryCTA: 'Abrir lista de deals',
    },
    {
      key: 'avg_response_time_min',
      label: 'Tiempo de respuesta',
      unit: 'min',
      direction: 'lower_is_better',
      headline: 'El equipo está tardando demasiado en contactar nuevos leads.',
      subtitle: 'El tiempo promedio de primera respuesta se deterioró en las últimas semanas. En B2B, cada minuto extra reduce significativamente la conversión.',
      critical: 'Estudios muestran que responder en menos de 5 minutos puede multiplicar por 9 la probabilidad de conversión vs responder en 30 min. El equipo está muy por encima de ese umbral y empeorando.',
      actions: [
        'Revisar la cola de leads sin contactar de las últimas 24 horas y asignarlos ahora.',
        'Configurar alertas: cualquier lead nuevo sin respuesta en 30 minutos genera notificación al supervisor.',
        'Identificar el bottleneck: ¿falta personal, falta proceso, o falta priorización? Atacarlo esta semana.',
      ],
      primaryCTA: 'Ver leads sin contactar',
    },
    {
      key: 'support_tickets_opened',
      label: 'Tickets de soporte',
      unit: 'tickets/día',
      direction: 'lower_is_better',
      headline: 'El volumen de tickets de soporte está aumentando sostenidamente.',
      subtitle: 'Los tickets diarios crecieron significativamente. Esto suele indicar un problema recurrente que no se está resolviendo de raíz.',
      critical: 'El crecimiento sostenido de tickets afecta directamente la satisfacción del cliente y la capacidad del equipo de soporte. Si no se identifica el origen, escala a churn.',
      actions: [
        'Revisar los tipos de tickets más frecuentes de las últimas 2 semanas y categorizarlos.',
        'Identificar el top 3 de problemas y resolver el de mayor volumen con un fix permanente, no parche.',
        'Comunicar internamente la solución a producto/ingeniería antes que sigan llegando más casos similares.',
      ],
      primaryCTA: 'Ver tickets abiertos',
    },
    {
      key: 'deals_won',
      label: 'Deals ganados',
      unit: 'deals/día',
      direction: 'higher_is_better',
      headline: 'El cierre de deals está bajando esta semana.',
      subtitle: 'Los deals ganados diarios se redujeron vs el período anterior. Si la tendencia se mantiene, el resultado del trimestre está en riesgo.',
      critical: 'La caída en cierres puede tener múltiples causas: pipeline débil, equipo desmotivado, ciclo de venta más largo, o competencia. Hay que identificar la causa raíz antes de actuar.',
      actions: [
        'Revisar todos los deals en etapa final del pipeline con cierre proyectado este mes.',
        'Reunión 1:1 con cada vendedor: qué deals tienen y qué necesitan para cerrarlos esta semana.',
        'Si el problema es volumen del pipeline, escalar generación de leads inmediatamente.',
      ],
      primaryCTA: 'Ver deals en cierre',
    },
  ]

  const computed = checks.map(c => {
    const trend = getTrend(days, c.key)
    const isNegative =
      (c.direction === 'lower_is_better' && trend === 'up') ||
      (c.direction === 'higher_is_better' && trend === 'down')
    const deltaPct = getDeltaPct(days, c.key)
    return { ...c, trend, isNegative, deltaPct }
  })

  const alerts = computed.filter(c => c.isNegative)

  const today = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  if (alerts.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 px-8 py-7">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">
            Foco del día — {today}
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 leading-tight max-w-2xl">
          Todas las métricas están en rangos saludables.
        </h2>
        <p className="text-sm text-gray-500 mt-3 max-w-2xl leading-relaxed">
          Ninguna métrica clave muestra deterioro vs los 30 días previos. Buen día para enfocarse en estrategia de largo plazo y revisar oportunidades de optimización.
        </p>
      </div>
    )
  }

  const top = alerts[0]
  const last7 = getLastNDays(days, 7)
  const currentValue = average(getMetricValues(last7, top.key))
  const todayValue = days[days.length - 1]?.metrics[top.key] ?? null
  const yearAgo = getYearAgoValue(days, top.key)
  const ratePerWeek = getAccumulationRate(days, top.key)
  const projection = projectValue(days, top.key, 30)

  const formattedValue = currentValue !== null ? currentValue.toFixed(1) : '—'

  const formatRate = (rate: number | null) => {
    if (rate === null) return '—'
    const sign = rate > 0 ? '+' : ''
    return `${sign}${rate.toFixed(1)}`
  }

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
        <div className="px-8 py-7">

          <div className="flex items-start justify-between gap-8 mb-7">
            <div className="flex-1 min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">
                  Foco del día — {today}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 leading-tight">
                {top.headline}
              </h2>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                {top.subtitle}
              </p>
            </div>

            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-5xl font-light text-red-500 tabular-nums leading-none">
                {formattedValue}
              </span>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em] mt-3">
                {top.label} · {top.unit} · MEDIA 7D
              </span>
              {top.deltaPct !== null && (
                <span className="text-xs font-medium text-red-500 mt-2">
                  ↑ {top.deltaPct > 0 ? '+' : ''}{top.deltaPct.toFixed(1)}% vs 30d previos
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 py-5 border-t border-b border-gray-100 mb-6">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Hoy</p>
              <p className="text-lg font-semibold text-gray-900">
                {todayValue !== null ? Math.round(todayValue) : '—'} {top.unit}
              </p>
              {yearAgo !== null && (
                <p className="text-xs text-gray-500 mt-1">
                  vs {Math.round(yearAgo)} hace 12 meses
                </p>
              )}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Velocidad de cambio</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatRate(ratePerWeek)} / semana
              </p>
              <p className="text-xs text-gray-500 mt-1">últimas 4 semanas</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Proyección 30 días</p>
              <p className="text-lg font-semibold text-gray-900">
                ~{projection !== null ? Math.round(projection) : '—'} {top.unit}
              </p>
              <p className="text-xs text-gray-500 mt-1">si la tendencia continúa</p>
            </div>
          </div>

          <div className="bg-red-50 border-l-[3px] border-red-500 rounded-r-lg px-5 py-4 mb-5">
            <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider mb-1.5">
              Lo crítico
            </p>
            <p className="text-sm text-red-900 leading-relaxed">
              {top.critical}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 mb-5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Acciones inmediatas
            </p>
            <div className="flex flex-col gap-3">
              {top.actions.map((action, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Ver detalle de deals →
            </button>
          </div>
        </div>

        {alerts.length > 1 && (
          <div className="border-t border-gray-100 px-8 py-4">
            <p className="text-xs text-gray-500 mb-2.5">
            Otras métricas con tendencia negativa esta semana (vs 30 días previos):
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {alerts.slice(1).map(a => (
                <div key={a.key} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <span className="text-xs font-medium text-gray-700">{a.label}</span>
                  <span className="text-gray-300">·</span>
                  {a.deltaPct !== null && (
                    <span className="text-xs font-medium text-red-500">
                      {a.deltaPct > 0 ? '+' : ''}{a.deltaPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <FocusModal
          dataset={dataset}
          alert={top}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}