import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
  } from 'recharts'
  import type { DayEntry } from '../types/metrics'
  
  interface TrendChartProps {
    days: DayEntry[]
    metricKey: keyof DayEntry['metrics']
    label: string
    color?: string
  }
  
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
  }
  
  export default function TrendChart({ days, metricKey, label, color = '#378ADD' }: TrendChartProps) {
    const last90 = days.slice(-90)
  
    const data = last90
      .filter(d => d.metrics[metricKey] !== null)
      .map(d => ({
        date: formatDate(d.date),
        value: d.metrics[metricKey] as number,
      }))
  
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">{label}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval={14}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '13px',
              }}
              labelStyle={{ color: '#6b7280', marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name={label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${metricKey})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }