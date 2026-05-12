import type { DatasetData, DayEntry, MetricMeta } from '../types/metrics'

export function getLastNDays(days: DayEntry[], n: number): DayEntry[] {
  return days.slice(-n)
}

export function average(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export function getMetricValues(days: DayEntry[], key: keyof DayEntry['metrics']): (number | null)[] {
  return days.map(d => d.metrics[key] as number | null)
}

export function calcWinRate(days: DayEntry[]): number | null {
  const won = days.reduce((a, d) => a + d.metrics.deals_won, 0)
  const lost = days.reduce((a, d) => a + d.metrics.deals_lost, 0)
  if (won + lost === 0) return null
  return (won / (won + lost)) * 100
}

export function getTrend(
  days: DayEntry[],
  key: keyof DayEntry['metrics'],
  windowDays: number = 30
): 'up' | 'down' | 'neutral' {
  if (days.length < windowDays * 2) return 'neutral'
  const prev = average(getMetricValues(days.slice(-windowDays * 2, -windowDays), key))
  const curr = average(getMetricValues(days.slice(-windowDays), key))
  if (prev === null || curr === null) return 'neutral'
  const delta = (curr - prev) / prev
  if (delta > 0.03) return 'up'
  if (delta < -0.03) return 'down'
  return 'neutral'
}

export function isTrendGood(
  trend: 'up' | 'down' | 'neutral',
  direction: MetricMeta['direction']
): boolean | null {
  if (trend === 'neutral') return null
  if (direction === 'higher_is_better') return trend === 'up'
  return trend === 'down'
}

export function getFunnelData(days: DayEntry[]) {
  const last30 = getLastNDays(days, 30)
  const traffic = average(getMetricValues(last30, 'traffic')) ?? 0
  const leads = average(getMetricValues(last30, 'leads_created')) ?? 0
  const qualified = average(getMetricValues(last30, 'leads_qualified')) ?? 0
  const deals = average(getMetricValues(last30, 'deals_created')) ?? 0
  const won = average(getMetricValues(last30, 'deals_won')) ?? 0

  return [
    { name: 'Tráfico', value: Math.round(traffic), color: '#378ADD' },
    { name: 'Leads', value: Math.round(leads), color: '#1D9E75' },
    { name: 'Calificados', value: Math.round(qualified), color: '#7F77DD' },
    { name: 'Deals', value: Math.round(deals), color: '#EF9F27' },
    { name: 'Ganados', value: Math.round(won), color: '#E24B4A' },
  ]
}

export function getKPIs(dataset: DatasetData) {
  const days = dataset.days
  const last30 = getLastNDays(days, 30)
  const last7 = getLastNDays(days, 7)

  return {
    winRate: {
      value: calcWinRate(last30),
      trend: getTrend(days, 'deals_won'),
      label: 'Win rate',
      unit: '%',
      direction: 'higher_is_better' as const,
      description: '% de deals que se ganan vs los que se cierran',
      period: 'acumulado últimos 30 días',
      tooltip: 'Calculado como deals ganados / (ganados + perdidos) en los últimos 30 días. Mide la efectividad del equipo al cerrar oportunidades reales.',
      days,
      metricKey: 'deals_won' as const,
    },
    responseTime: {
      value: average(getMetricValues(last7, 'avg_response_time_min')),
      trend: getTrend(days, 'avg_response_time_min'),
      label: 'Tiempo de respuesta',
      unit: 'min',
      direction: 'lower_is_better' as const,
      description: 'Promedio de minutos en contactar leads nuevos',
      period: 'promedio últimos 7 días',
      tooltip: 'Minutos desde que entra un lead nuevo hasta que el equipo lo contacta por primera vez. En B2B, responder en menos de 30 min puede duplicar la conversión.',
      days,
      metricKey: 'avg_response_time_min' as const,
    },
    staleDeals: {
      value: last30[last30.length - 1]?.metrics.stale_deals ?? null,
      trend: getTrend(days, 'stale_deals'),
      label: 'Deals estancados',
      unit: 'deals',
      direction: 'lower_is_better' as const,
      description: 'Deals abiertos con +60 días sin actividad',
      period: 'valor actual al cierre del día',
      tooltip: 'Conteo total de deals abiertos que llevan más de 60 días sin actividad documentada. Indican pipeline que no avanza.',
      days,
      metricKey: 'stale_deals' as const,
    },
    supportTickets: {
      value: average(getMetricValues(last7, 'support_tickets_opened')),
      trend: getTrend(days, 'support_tickets_opened'),
      label: 'Tickets de soporte',
      unit: '/día',
      direction: 'lower_is_better' as const,
      description: 'Promedio diario de tickets nuevos',
      period: 'promedio últimos 7 días',
      tooltip: 'Nuevos tickets de soporte abiertos por clientes existentes. Un crecimiento sostenido suele indicar un problema recurrente que afecta a varios usuarios.',
      days,
      metricKey: 'support_tickets_opened' as const,
    },
  }
}

export function getAccumulationRate(
    days: DayEntry[],
    key: keyof DayEntry['metrics'],
    weeks: number = 4
  ): number | null {
    const recentDays = days.slice(-weeks * 7)
    if (recentDays.length < 7) return null
  
    const firstWeekAvg = average(getMetricValues(recentDays.slice(0, 7), key))
    const lastWeekAvg = average(getMetricValues(recentDays.slice(-7), key))
  
    if (firstWeekAvg === null || lastWeekAvg === null) return null
    return (lastWeekAvg - firstWeekAvg) / weeks
  }
  
  export function projectValue(
    days: DayEntry[],
    key: keyof DayEntry['metrics'],
    daysAhead: number = 30
  ): number | null {
    const ratePerWeek = getAccumulationRate(days, key)
    if (ratePerWeek === null) return null
  
    const currentValue = average(getMetricValues(days.slice(-7), key))
    if (currentValue === null) return null
  
    return currentValue + (ratePerWeek * (daysAhead / 7))
  }
  
  export function getDeltaPct(
    days: DayEntry[],
    key: keyof DayEntry['metrics']
  ): number | null {
    const recent = average(getMetricValues(days.slice(-30), key))
    const previous = average(getMetricValues(days.slice(-60, -30), key))
    if (recent === null || previous === null || previous === 0) return null
    return ((recent - previous) / previous) * 100
  }
  
  export function getYearAgoValue(
    days: DayEntry[],
    key: keyof DayEntry['metrics']
  ): number | null {
    return average(getMetricValues(days.slice(0, 7), key))
  }