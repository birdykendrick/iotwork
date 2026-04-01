import React from 'react'
import clsx from 'clsx'
import { AlertTriangle, CheckCircle, XCircle, Info, Zap } from 'lucide-react'

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    online:   { label: 'Online',   cls: 'bg-brand-50 text-brand-700 border-brand-200',   dot: 'bg-brand-500' },
    warning:  { label: 'Warning',  cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
    critical: { label: 'Critical', cls: 'bg-red-50   text-red-700   border-red-200',     dot: 'bg-red-500' },
    offline:  { label: 'Offline',  cls: 'bg-surface-100 text-surface-500 border-surface-300', dot: 'bg-surface-400' },
    pass:     { label: 'Pass',     cls: 'bg-brand-50 text-brand-700 border-brand-200',   dot: 'bg-brand-500' },
    fail:     { label: 'Fail',     cls: 'bg-red-50   text-red-700   border-red-200',     dot: 'bg-red-500' },
  }
  const c = map[status] || map.offline
  return (
    <span className={clsx('badge border', c.cls)}>
      <span className={clsx(
        'w-1.5 h-1.5 rounded-full flex-shrink-0',
        c.dot,
        (status === 'online' || status === 'warning') && 'pulse-dot',
      )} />
      {c.label}
    </span>
  )
}

// ─── SeverityBadge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const map = {
    critical: { label: 'Critical', cls: 'bg-red-50   text-red-700   border border-red-200' },
    warning:  { label: 'Warning',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    info:     { label: 'Info',     cls: 'bg-sky-50   text-sky-700   border border-sky-200' },
  }
  const c = map[severity] || map.info
  return <span className={clsx('badge', c.cls)}>{c.label}</span>
}

// ─── AlertTypeBadge ───────────────────────────────────────────────────────────
export function AlertTypeBadge({ type }) {
  const map = {
    threshold_breach: { label: 'Threshold', icon: Zap,           cls: 'text-amber-600' },
    sensor_offline:   { label: 'Offline',   icon: XCircle,       cls: 'text-red-500' },
    low_battery:      { label: 'Battery',   icon: AlertTriangle, cls: 'text-orange-500' },
    missing_data:     { label: 'Missing',   icon: AlertTriangle, cls: 'text-amber-600' },
    stale_data:       { label: 'Stale',     icon: Info,          cls: 'text-surface-400' },
  }
  const c = map[type] || { label: type, icon: Info, cls: 'text-surface-400' }
  const Icon = c.icon
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-mono', c.cls)}>
      <Icon size={11} />
      {c.label}
    </span>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, sub, icon: Icon, accentCls }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', accentCls || 'bg-brand-50')}>
            <Icon size={15} className={accentCls ? 'text-white' : 'text-brand-600'} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5">
        <span className="stat-value">{value}</span>
        {unit && <span className="text-sm text-surface-400 mb-0.5">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-surface-400">{sub}</span>}
    </div>
  )
}

// ─── SensorRow ────────────────────────────────────────────────────────────────
export function SensorRow({ sensor, onClick }) {
  const batteryColor =
    sensor.battery > 60 ? 'text-brand-600' :
    sensor.battery > 25 ? 'text-amber-600' :
    'text-red-600'

  const tempVal = sensor.latestReading?.temperature
  const humVal  = sensor.latestReading?.humidity

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white hover:bg-surface-50 cursor-pointer transition-colors border border-surface-200 hover:border-surface-300 shadow-card"
      onClick={onClick}
    >
      <span className={clsx(
        'w-2 h-2 rounded-full flex-shrink-0',
        sensor.status === 'online'  ? 'bg-brand-500 pulse-dot' :
        sensor.status === 'warning' ? 'bg-amber-500 pulse-dot' :
        'bg-surface-300',
      )} />

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-surface-800 truncate">{sensor.name}</span>
        <span className="text-xs text-surface-400 font-mono">
          {sensor.type === 'EM320' ? 'Milesight EM320-TH' : 'Teltonika Eye'}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm font-mono">
        {tempVal != null
          ? <span className="text-surface-700">{tempVal}°C</span>
          : <span className="text-surface-300">—</span>}
        {humVal != null
          ? <span className="text-surface-500">{humVal}%</span>
          : <span className="text-surface-300">—</span>}
      </div>

      <div className={clsx('text-xs font-mono', batteryColor)}>{sensor.battery}%</div>
      <StatusBadge status={sensor.status} />
    </div>
  )
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex flex-col gap-1">
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-xs text-surface-400 mb-1">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-surface-300">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-surface-600' : ''}>{b}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-surface-800 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── BatteryBar ───────────────────────────────────────────────────────────────
export function BatteryBar({ value }) {
  const color =
    value > 60 ? 'bg-brand-500' :
    value > 25 ? 'bg-amber-500' :
    'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-surface-200 overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-surface-500">{value}%</span>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-3 border border-surface-200">
          <Icon size={22} className="text-surface-400" />
        </div>
      )}
      <p className="text-surface-600 font-medium">{title}</p>
      {message && <p className="text-sm text-surface-400 mt-1">{message}</p>}
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-surface-200" />
      {label && <span className="text-xs text-surface-400 uppercase tracking-wider">{label}</span>}
      <div className="flex-1 h-px bg-surface-200" />
    </div>
  )
}

// ─── InfoRow — key/value pair for metadata panels ────────────────────────────
export function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-surface-100 last:border-0">
      <span className="text-xs text-surface-500 font-medium flex-shrink-0">{label}</span>
      <span className="text-xs text-surface-700 text-right">{value}</span>
    </div>
  )
}
