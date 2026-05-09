import type { DatasetData, DatasetKey } from '../types/metrics'
import DatasetSelector from './DatasetSelector'

interface HeaderProps {
  dataset: DatasetData
  selected: DatasetKey
  onChange: (key: DatasetKey) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Header({ dataset, selected, onChange }: HeaderProps) {
  const today = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const startDate = formatDate(dataset.metadata.start_date)
  const endDate = formatDate(dataset.metadata.end_date)
  const totalDays = dataset.metadata.days

  return (
    <div className="bg-white border-b border-gray-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)]">
      <div className="max-w-6xl mx-auto px-6">

        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 17V8M9 17V3M15 17v-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Palvi</p>
              <p className="text-[11px] text-gray-400 leading-tight">Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-700">Datos actualizados</span>
            </div>
            <span className="capitalize text-gray-500">{today}</span>
          </div>
        </div>

        <div className="flex items-end justify-between py-6">
          <div>
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-[0.15em] mb-2">
              Reporte ejecutivo
            </p>
            <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
              Métricas de ventas y soporte
            </h1>
            <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
              <span className="font-medium">{startDate}</span>
              <span className="text-gray-300">→</span>
              <span className="font-medium">{endDate}</span>
              <span className="text-gray-300">·</span>
              <span className="bg-gray-100 rounded-full px-2.5 py-0.5 text-xs font-medium text-gray-600">
                {totalDays} días
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em]">
              Empresa
            </p>
            <DatasetSelector selected={selected} onChange={onChange} />
          </div>
        </div>

      </div>
    </div>
  )
}