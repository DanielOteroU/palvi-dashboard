import { useState, useEffect } from 'react'
import type { MetricsFile, DatasetKey } from './types/metrics'
import { getKPIs } from './utils/dataUtils'
import DatasetSelector from './components/DatasetSelector'
import KPICard from './components/KPICard'
import TrendChart from './components/TrendChart'
import FunnelChart from './components/FunnelChart'

export default function App() {
  const [data, setData] = useState<MetricsFile | null>(null)
  const [selected, setSelected] = useState<DatasetKey>('A')

  useEffect(() => {
    fetch('/metrics.json')
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Cargando datos...</span>
      </div>
    )
  }

  const dataset = data[selected]
  const kpis = getKPIs(dataset)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reporte ejecutivo</h1>
            <p className="text-sm text-gray-400 mt-1">
              {dataset.metadata.start_date} — {dataset.metadata.end_date}
            </p>
          </div>
          <DatasetSelector selected={selected} onChange={setSelected} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard {...kpis.winRate} />
          <KPICard {...kpis.responseTime} />
          <KPICard {...kpis.staleDeals} />
          <KPICard {...kpis.supportTickets} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TrendChart
            days={dataset.days}
            metricKey="deals_won"
            label="Deals ganados (90d)"
            color="#1D9E75"
          />
          <TrendChart
            days={dataset.days}
            metricKey="avg_response_time_min"
            label="Tiempo de respuesta (90d)"
            color="#E24B4A"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FunnelChart days={dataset.days} />
          <TrendChart
            days={dataset.days}
            metricKey="stale_deals"
            label="Deals estancados (90d)"
            color="#EF9F27"
          />
        </div>

      </div>
    </div>
  )
}