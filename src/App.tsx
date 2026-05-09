import { useState, useEffect } from 'react'
import type { MetricsFile, DatasetKey } from './types/metrics'
import { getKPIs } from './utils/dataUtils'
import Header from './components/Header'
import KPICard from './components/KPICard'
import TrendChart from './components/TrendChart'
import FunnelChart from './components/FunnelChart'
import FocusAlert from './components/FocusAlert'

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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Cargando datos...</span>
      </div>
    )
  }

  const dataset = data[selected]
  const kpis = getKPIs(dataset)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">

      <Header dataset={dataset} selected={selected} onChange={setSelected} />

      <div className="max-w-6xl mx-auto px-6 pb-16 pt-8">

        <FocusAlert dataset={dataset} />

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">
              Indicadores clave
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard {...kpis.winRate} />
            <KPICard {...kpis.responseTime} />
            <KPICard {...kpis.staleDeals} />
            <KPICard {...kpis.supportTickets} />
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">
              Tendencias últimos 90 días
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrendChart
              days={dataset.days}
              metricKey="deals_won"
              label="Deals ganados"
              color="#1D9E75"
            />
            <TrendChart
              days={dataset.days}
              metricKey="avg_response_time_min"
              label="Tiempo de respuesta"
              color="#E24B4A"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.15em]">
              Conversión y pipeline
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FunnelChart days={dataset.days} />
            <TrendChart
              days={dataset.days}
              metricKey="stale_deals"
              label="Deals estancados"
              color="#EF9F27"
            />
          </div>
        </div>

      </div>
    </div>
  )
}