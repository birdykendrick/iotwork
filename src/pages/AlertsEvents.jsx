import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Filter, ChevronRight, CheckCircle, Circle,
  AlertTriangle, XCircle, Wifi, Battery, Clock,
  Search, Zap,
} from 'lucide-react'
import { alerts, customers, deployments } from '../data/mockData'
import { PageHeader, SeverityBadge, AlertTypeBadge } from '../components/ui'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

const SEVERITY_OPTIONS = ['all', 'critical', 'warning', 'info']
const TYPE_OPTIONS = [
  { value: 'all',               label: 'All types' },
  { value: 'threshold_breach',  label: 'Threshold' },
  { value: 'sensor_offline',    label: 'Offline' },
  { value: 'low_battery',       label: 'Battery' },
  { value: 'missing_data',      label: 'Missing data' },
  { value: 'stale_data',        label: 'Stale data' },
]

export default function AlertsEvents() {
  const navigate = useNavigate()
  const [filterCustomer,   setFilterCustomer]   = useState('all')
  const [filterDeployment, setFilterDeployment] = useState('all')
  const [filterSeverity,   setFilterSeverity]   = useState('all')
  const [filterType,       setFilterType]       = useState('all')
  const [filterResolved,   setFilterResolved]   = useState('active') // 'all' | 'active' | 'resolved'
  const [search,           setSearch]           = useState('')
  const [acknowledgedIds,  setAcknowledgedIds]  = useState([])

  const custDeps = filterCustomer !== 'all'
    ? Object.values(deployments).filter(d => d.customerId === filterCustomer)
    : Object.values(deployments)

  const filtered = alerts.filter(a => {
    if (filterCustomer   !== 'all' && a.customerId    !== filterCustomer)   return false
    if (filterDeployment !== 'all' && a.deploymentId  !== filterDeployment) return false
    if (filterSeverity   !== 'all' && a.severity      !== filterSeverity)   return false
    if (filterType       !== 'all' && a.type          !== filterType)       return false
    if (filterResolved   === 'active'   && a.resolved)   return false
    if (filterResolved   === 'resolved' && !a.resolved)  return false
    if (search) {
      const q = search.toLowerCase()
      return (
        a.title.toLowerCase().includes(q)       ||
        a.sensorName.toLowerCase().includes(q)  ||
        a.message.toLowerCase().includes(q)
      )
    }
    return true
  })

  // Sort: active first, then by timestamp desc
  const sorted = [...filtered].sort((a, b) => {
    if (!a.resolved && b.resolved) return -1
    if (a.resolved && !b.resolved) return 1
    return new Date(b.timestamp) - new Date(a.timestamp)
  })

  const activeCount   = alerts.filter(a => !a.resolved).length
  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'critical').length
  const warningCount  = alerts.filter(a => !a.resolved && a.severity === 'warning').length

  function typeIcon(type) {
    const map = {
      threshold_breach: Zap,
      sensor_offline:   XCircle,
      low_battery:      Battery,
      missing_data:     AlertTriangle,
      stale_data:       Clock,
    }
    const Icon = map[type] || Bell
    return <Icon size={15} className="text-slate-400" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alerts & Events"
        subtitle="Triggered issues across all deployments"
        actions={
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="badge bg-red-500/15 text-red-400 border border-red-500/30">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30">
                {warningCount} warning
              </span>
            )}
          </div>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active',   value: activeCount,               color: 'text-red-400',    border: 'border-red-900/30' },
          { label: 'Critical', value: criticalCount,             color: 'text-red-400',    border: '' },
          { label: 'Warning',  value: warningCount,              color: 'text-amber-400',  border: '' },
          { label: 'Resolved', value: alerts.filter(a => a.resolved).length, color: 'text-brand-400', border: '' },
        ].map(s => (
          <div key={s.label} className={clsx('card p-4', s.border)}>
            <div className={clsx('text-2xl font-display font-700', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-8 w-52"
              placeholder="Search alerts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 bg-surface-700 rounded-lg p-1 border border-surface-500">
            {['active', 'all', 'resolved'].map(v => (
              <button
                key={v}
                onClick={() => setFilterResolved(v)}
                className={clsx(
                  'px-3 py-1 rounded text-xs font-medium capitalize transition-all',
                  filterResolved === v
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Severity */}
          <select className="select" value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
            {SEVERITY_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Type */}
          <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {/* Customer */}
          <select className="select" value={filterCustomer} onChange={e => { setFilterCustomer(e.target.value); setFilterDeployment('all') }}>
            <option value="all">All customers</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Deployment */}
          <select className="select" value={filterDeployment} onChange={e => setFilterDeployment(e.target.value)}>
            <option value="all">All deployments</option>
            {custDeps.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <span className="ml-auto text-xs text-slate-500">{sorted.length} result{sorted.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Alerts table */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-surface-500 text-xs text-slate-500 uppercase tracking-wider font-medium">
          <span className="w-6"></span>
          <span>Alert</span>
          <span className="w-24 text-right">Severity</span>
          <span className="w-20 text-right">Type</span>
          <span className="w-32 text-right">Time</span>
          <span className="w-8"></span>
        </div>

        <div className="divide-y divide-surface-600">
          {sorted.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">No alerts match your filters.</div>
          ) : (
            sorted.map(alert => {
              const isAcked = acknowledgedIds.includes(alert.id)
              const dep = deployments[alert.deploymentId]
              const cust = customers.find(c => c.id === alert.customerId)
              return (
                <div
                  key={alert.id}
                  className={clsx(
                    'group grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-start px-5 py-4 transition-colors',
                    alert.resolved || isAcked
                      ? 'opacity-50 hover:opacity-70'
                      : alert.severity === 'critical'
                      ? 'hover:bg-red-500/5'
                      : 'hover:bg-surface-700/40'
                  )}
                >
                  {/* Type icon */}
                  <div className="mt-0.5 w-6 flex justify-center">
                    {typeIcon(alert.type)}
                  </div>

                  {/* Main content */}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      {!alert.resolved && !isAcked && (
                        <span className={clsx(
                          'w-1.5 h-1.5 rounded-full flex-shrink-0',
                          alert.severity === 'critical' ? 'bg-red-400 pulse-dot' :
                          alert.severity === 'warning'  ? 'bg-amber-400 pulse-dot' :
                          'bg-sky-400'
                        )} />
                      )}
                      <span className="text-sm font-medium text-slate-200">{alert.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{alert.message}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-mono">{alert.sensorName}</span>
                      <span>·</span>
                      <button
                        className="hover:text-brand-400 transition-colors"
                        onClick={() => navigate(`/deployments/${alert.deploymentId}`)}
                      >
                        {dep?.name}
                      </button>
                      <span>·</span>
                      <span>{cust?.name}</span>
                    </div>
                  </div>

                  {/* Severity */}
                  <div className="flex justify-end mt-0.5">
                    <SeverityBadge severity={alert.severity} />
                  </div>

                  {/* Type */}
                  <div className="flex justify-end mt-0.5">
                    <AlertTypeBadge type={alert.type} />
                  </div>

                  {/* Time */}
                  <div className="text-right mt-0.5">
                    <div className="text-xs text-slate-500 font-mono">
                      {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                    </div>
                    <div className="text-xs text-slate-600">
                      {format(new Date(alert.timestamp), 'dd MMM HH:mm')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {!alert.resolved && !isAcked ? (
                      <button
                        onClick={() => setAcknowledgedIds(p => [...p, alert.id])}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-brand-500/15 text-brand-400"
                        title="Acknowledge"
                      >
                        <CheckCircle size={14} />
                      </button>
                    ) : (
                      <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">
                        {alert.resolved ? 'Resolved' : "Ack'd"}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
