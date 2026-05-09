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
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">

        <div className="flex items-center justify-between py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 17V8M9 17V3M15 17v-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Palvi</p>
              <p className="text-[11px] text-slate-400 leading-tight">Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className="font-medium text-emerald-300">Datos actualizados</span>
            </div>
            <span className="capitalize text-slate-400">{today}</span>
          </div>
        </div>

        <div className="flex items-end justify-between py-7">
          <div>
            <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-[0.15em] mb-2">
              Reporte ejecutivo
            </p>
            <h1 className="text-3xl font-semibold text-white leading-tight">
              Métricas de ventas y soporte
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Período analizado:
              </span>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1">
                <span className="text-xs font-medium text-slate-200">{startDate}</span>
                <span className="text-slate-500">→</span>
                <span className="text-xs font-medium text-slate-200">{endDate}</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-medium text-slate-300">{totalDays} días</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.15em]">
              Empresa
            </p>
            <DatasetSelector selected={selected} onChange={onChange} />
          </div>
        </div>

      </div>
    </div>
  )
}