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
      label: 'Win rate (30d)',
      unit: '%',
      direction: 'higher_is_better' as const,
    },
    responseTime: {
      value: average(getMetricValues(last7, 'avg_response_time_min')),
      trend: getTrend(days, 'avg_response_time_min'),
      label: 'Tiempo de respuesta',
      unit: 'min',
      direction: 'lower_is_better' as const,
    },
    staleDeals: {
      value: last30[last30.length - 1]?.metrics.stale_deals ?? null,
      trend: getTrend(days, 'stale_deals'),
      label: 'Deals estancados',
      unit: 'deals',
      direction: 'lower_is_better' as const,
    },
    supportTickets: {
      value: average(getMetricValues(last7, 'support_tickets_opened')),
      trend: getTrend(days, 'support_tickets_opened'),
      label: 'Tickets soporte (7d)',
      unit: '/día',
      direction: 'lower_is_better' as const,
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