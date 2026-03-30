import React, { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts'
import clsx from 'clsx'

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-700 border border-surface-400 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-mono">
          {p.name}: <strong>{p.value}</strong>{p.name === 'temp' ? '°C' : '%'}
        </p>
      ))}
    </div>
  )
}

// ─── TelemetryChart ───────────────────────────────────────────────────────────
export default function TelemetryChart({ data, thresholds, height = 220, showHumidity = true }) {
  const [mode, setMode] = useState('both') // 'both' | 'temp' | 'humid'

  const showTemp  = mode === 'both' || mode === 'temp'
  const showHumid = showHumidity && (mode === 'both' || mode === 'humid')

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-1 mb-3">
        {['both', 'temp', 'humid'].map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={clsx(
              'px-2.5 py-1 rounded text-xs font-medium transition-colors',
              mode === m
                ? 'bg-brand-500/20 text-brand-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {m === 'both' ? 'All' : m === 'temp' ? 'Temp' : 'Humidity'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="temp"
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          {showHumid && (
            <YAxis
              yAxisId="humid"
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
          )}
          <Tooltip content={<CustomTooltip />} />

          {/* Threshold lines */}
          {showTemp && thresholds?.tempMax && (
            <ReferenceLine yAxisId="temp" y={thresholds.tempMax} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />
          )}
          {showTemp && thresholds?.tempMin && (
            <ReferenceLine yAxisId="temp" y={thresholds.tempMin} stroke="#3b82f6" strokeDasharray="4 2" strokeWidth={1} />
          )}

          {showTemp && (
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              name="temp"
              stroke="#26a269"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#26a269', stroke: '#0a0f0d', strokeWidth: 2 }}
            />
          )}
          {showHumid && (
            <Line
              yAxisId="humid"
              type="monotone"
              dataKey="humidity"
              name="humidity"
              stroke="#0ea5e9"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="4 2"
              activeDot={{ r: 3, fill: '#0ea5e9', stroke: '#0a0f0d', strokeWidth: 2 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
