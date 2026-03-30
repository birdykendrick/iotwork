import React from 'react'
import clsx from 'clsx'
import { AlertTriangle, CheckCircle, XCircle, Info, Zap } from 'lucide-react'

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status, size = 'sm' }) {
  const map = {
    online:   { label: 'Online',   cls: 'bg-brand-500/15 text-brand-400 border-brand-500/30', dot: 'bg-brand-400' },
    warning:  { label: 'Warning',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  dot: 'bg-amber-400' },
    critical: { label: 'Critical', cls: 'bg-red-500/15   text-red-400   border-red-500/30',    dot: 'bg-red-400' },
    offline:  { label: 'Offline',  cls: 'bg-slate-700/40 text-slate-400 border-slate-600/30',  dot: 'bg-slate-500' },
    pass:     { label: 'Pass',     cls: 'bg-brand-500/15 text-brand-400 border-brand-500/30',  dot: 'bg-brand-400' },
    fail:     { label: 'Fail',     cls: 'bg-red-500/15   text-red-400   border-red-500/30',    dot: 'bg-red-400' },
  }
  const c = map[status] || map.offline
  return (
    <span className={clsx('badge border', c.cls, size === 'xs' ? 'text-xs' : 'text-xs')}>
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot,
        (status === 'online' || status === 'warning') && 'pulse-dot'
      )} />
      {c.label}
    </span>
  )
}

// ─── SeverityBadge ────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const map = {
    critical: { label: 'Critical', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
    warning:  { label: 'Warning',  cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    info:     { label: 'Info',     cls: 'bg-sky-500/15 text-sky-400 border border-sky-500/30' },
  }
  const c = map[severity] || map.info
  return <span className={clsx('badge', c.cls)}>{c.label}</span>
}

// ─── AlertTypeBadge ───────────────────────────────────────────────────────────
export function AlertTypeBadge({ type }) {
  const map = {
    threshold_breach: { label: 'Threshold', icon: Zap,           cls: 'text-amber-400' },
    sensor_offline:   { label: 'Offline',   icon: XCircle,       cls: 'text-red-400' },
    low_battery:      { label: 'Battery',   icon: AlertTriangle, cls: 'text-orange-400' },
    missing_data:     { label: 'Missing',   icon: AlertTriangle, cls: 'text-amber-400' },
    stale_data:       { label: 'Stale',     icon: Info,          cls: 'text-slate-400' },
  }
  const c = map[type] || { label: type, icon: Info, cls: 'text-slate-400' }
  const Icon = c.icon
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-mono', c.cls)}>
      <Icon size={11} />
      {c.label}
    </span>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, sub, accent, icon: Icon, trend }) {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', accent || 'bg-brand-500/15')}>
            <Icon size={15} className={clsx(accent ? 'text-white' : 'text-brand-400')} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="stat-value">{value}</span>
        {unit && <span className="text-sm text-slate-400 mb-1">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  )
}

// ─── SensorRow ────────────────────────────────────────────────────────────────
export function SensorRow({ sensor, onClick }) {
  const batteryColor =
    sensor.battery > 60 ? 'text-brand-400' :
    sensor.battery > 25 ? 'text-amber-400' :
    'text-red-400'

  const tempVal = sensor.latestReading?.temperature
  const humVal  = sensor.latestReading?.humidity

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-700 hover:bg-surface-600 cursor-pointer transition-colors border border-surface-500 hover:border-surface-400"
      onClick={onClick}
    >
      {/* status dot */}
      <span className={clsx(
        'w-2 h-2 rounded-full flex-shrink-0',
        sensor.status === 'online'  ? 'bg-brand-400 pulse-dot' :
        sensor.status === 'warning' ? 'bg-amber-400 pulse-dot' :
        'bg-slate-600'
      )} />

      {/* name */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium text-slate-200 truncate">{sensor.name}</span>
        <span className="text-xs text-slate-500 font-mono">{sensor.type === 'EM320' ? 'Milesight EM320-TH' : 'Teltonika Eye'}</span>
      </div>

      {/* readings */}
      <div className="flex items-center gap-4 text-sm font-mono">
        {tempVal != null ? (
          <span className="text-slate-200">{tempVal}°C</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
        {humVal != null ? (
          <span className="text-slate-400">{humVal}%</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </div>

      {/* battery */}
      <div className={clsx('text-xs font-mono', batteryColor)}>
        {sensor.battery}%
      </div>

      {/* status */}
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
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-slate-400' : ''}>{b}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="font-display text-2xl font-700 text-slate-100 leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
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
      <div className="w-16 h-1.5 rounded-full bg-surface-500 overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-400">{value}%</span>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={32} className="text-slate-600 mb-3" />}
      <p className="text-slate-400 font-medium">{title}</p>
      {message && <p className="text-sm text-slate-600 mt-1">{message}</p>}
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-surface-500" />
      {label && <span className="text-xs text-slate-600 uppercase tracking-wider">{label}</span>}
      <div className="flex-1 h-px bg-surface-500" />
    </div>
  )
}
