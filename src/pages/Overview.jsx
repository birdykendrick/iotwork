import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Layers, Radio, WifiOff, AlertTriangle,
  TrendingUp, Clock, ChevronRight, Zap, Battery,
} from 'lucide-react'
import {
  customers, deployments, sensors, alerts,
  getSensorStatusCounts, getActiveAlertCount,
} from '../data/mockData'
import { PageHeader, MetricCard, StatusBadge, SeverityBadge, AlertTypeBadge } from '../components/ui'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function Overview() {
  const navigate = useNavigate()
  const counts = getSensorStatusCounts()
  const activeAlerts = alerts.filter(a => !a.resolved).slice(0, 6)

  const deploymentList = Object.values(deployments)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Live platform status across all customers and deployments"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Customers</span>
            <Users size={15} className="text-brand-400" />
          </div>
          <span className="stat-value">{customers.length}</span>
          <p className="text-xs text-slate-500 mt-1">Active contracts</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Deployments</span>
            <Layers size={15} className="text-brand-400" />
          </div>
          <span className="stat-value">{deploymentList.length}</span>
          <p className="text-xs text-slate-500 mt-1">Across {customers.length} customers</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Active Sensors</span>
            <Radio size={15} className="text-brand-400" />
          </div>
          <span className="stat-value">{counts.online}</span>
          <p className="text-xs text-slate-500 mt-1">{counts.total} total deployed</p>
        </div>

        <div className="card p-4 border-red-900/30">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Offline Sensors</span>
            <WifiOff size={15} className="text-red-400" />
          </div>
          <span className="stat-value text-red-400">{counts.offline}</span>
          <p className="text-xs text-slate-500 mt-1">{counts.warning} in warning state</p>
        </div>

        <div className="card p-4 border-amber-900/30">
          <div className="flex items-center justify-between mb-3">
            <span className="stat-label">Active Alerts</span>
            <AlertTriangle size={15} className="text-amber-400" />
          </div>
          <span className="stat-value text-amber-400">{getActiveAlertCount()}</span>
          <p className="text-xs text-slate-500 mt-1">Across all deployments</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Deployments list */}
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-500">
            <h2 className="font-display text-sm font-700 text-slate-200 uppercase tracking-widest">Deployments</h2>
            <span className="text-xs text-slate-500">{deploymentList.length} total</span>
          </div>
          <div className="divide-y divide-surface-600">
            {deploymentList.map(dep => {
              const cust = customers.find(c => c.id === dep.customerId)
              const depSensors = dep.sensorIds.map(id => sensors[id])
              const offline = depSensors.filter(s => s.status === 'offline').length
              const warn    = depSensors.filter(s => s.status === 'warning').length
              const depAlerts = alerts.filter(a => a.deploymentId === dep.id && !a.resolved)
              return (
                <div
                  key={dep.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-700/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/deployments/${dep.id}`)}
                >
                  {/* indicator */}
                  <div className={clsx(
                    'w-1 h-12 rounded-full flex-shrink-0',
                    dep.status === 'online'   ? 'bg-brand-500' :
                    dep.status === 'warning'  ? 'bg-amber-500' :
                    dep.status === 'critical' ? 'bg-red-500'   : 'bg-slate-600'
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-slate-200">{dep.name}</span>
                      <StatusBadge status={dep.status} />
                    </div>
                    <span className="text-xs text-slate-500">{cust?.name} · {dep.type}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="text-right">
                      <div className="font-mono text-slate-300">{depSensors.length} sensors</div>
                      {offline > 0 && <div className="text-red-400">{offline} offline</div>}
                      {warn > 0 && !offline && <div className="text-amber-400">{warn} warning</div>}
                    </div>
                    {depAlerts.length > 0 && (
                      <span className="badge bg-red-500/10 text-red-400 border border-red-900/30">
                        {depAlerts.length} alert{depAlerts.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent events */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-500">
            <h2 className="font-display text-sm font-700 text-slate-200 uppercase tracking-widest">Recent Events</h2>
            <button
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              onClick={() => navigate('/alerts')}
            >
              View all
            </button>
          </div>
          <div className="flex flex-col divide-y divide-surface-600 flex-1">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="px-5 py-3.5 hover:bg-surface-700/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <AlertTypeBadge type={alert.type} />
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">{alert.title}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-600 font-mono">{alert.sensorName}</span>
                  <span className="text-xs text-slate-600">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer quick status */}
      <div>
        <h2 className="font-display text-sm font-700 text-slate-400 uppercase tracking-widest mb-3">Customer Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {customers.map(cust => {
            const custDeps = cust.deploymentIds.map(id => deployments[id])
            const sensorList = custDeps.flatMap(d => d.sensorIds.map(sid => sensors[sid]))
            const onlineCount  = sensorList.filter(s => s.status === 'online').length
            const offlineCount = sensorList.filter(s => s.status === 'offline').length
            const alertCount   = alerts.filter(a => a.customerId === cust.id && !a.resolved).length

            return (
              <div
                key={cust.id}
                className="card p-5 cursor-pointer hover:border-brand-500/30 transition-colors"
                onClick={() => navigate('/customers')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-700 text-base"
                    style={{ backgroundColor: `${cust.color}22`, color: cust.color }}
                  >
                    {cust.logo}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{cust.name}</p>
                    <p className="text-xs text-slate-500">{cust.industry}</p>
                  </div>
                  <StatusBadge status={cust.status} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="card-inner p-2 text-center">
                    <div className="text-sm font-mono font-medium text-slate-200">{custDeps.length}</div>
                    <div className="text-xs text-slate-500">Deploys</div>
                  </div>
                  <div className="card-inner p-2 text-center">
                    <div className="text-sm font-mono font-medium text-brand-400">{onlineCount}</div>
                    <div className="text-xs text-slate-500">Online</div>
                  </div>
                  <div className="card-inner p-2 text-center">
                    <div className={clsx('text-sm font-mono font-medium', alertCount > 0 ? 'text-amber-400' : 'text-slate-400')}>
                      {alertCount}
                    </div>
                    <div className="text-xs text-slate-500">Alerts</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
