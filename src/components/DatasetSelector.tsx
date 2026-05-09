import type { DatasetKey } from '../types/metrics'

interface DatasetSelectorProps {
  selected: DatasetKey
  onChange: (key: DatasetKey) => void
}

const DATASETS: { key: DatasetKey; label: string }[] = [
  { key: 'A', label: 'Dataset A' },
  { key: 'B', label: 'Dataset B' },
  { key: 'C', label: 'Dataset C' },
  { key: 'D', label: 'Dataset D' },
]

export default function DatasetSelector({ selected, onChange }: DatasetSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {DATASETS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            selected === key
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}