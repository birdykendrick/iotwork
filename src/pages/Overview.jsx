import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Layers, Radio, WifiOff, AlertTriangle,
  ChevronRight, Thermometer, Droplets, Activity,
  MapPin, Building2, Settings,
} from 'lucide-react'
import {
  customers, deployments, sensors, alerts,
  getSensorStatusCounts, getActiveAlertCount,
} from '../data/mockData'
import { PageHeader, StatusBadge, SeverityBadge, AlertTypeBadge } from '../components/ui'
import { useRole } from '../context/RoleContext'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import PharmaSiteManager from './PharmaSiteManager'

// ─── Shared: deployment row used in both views ────────────────────────────────
function DeploymentRow({ dep, navigate }) {
  const cust       = customers.find(c => c.id === dep.customerId)
  const depSensors = dep.sensorIds.map(id => sensors[id])
  const offline    = depSensors.filter(s => s.status === 'offline').length
  const warn       = depSensors.filter(s => s.status === 'warning').length
  const depAlerts  = alerts.filter(a => a.deploymentId === dep.id && !a.resolved)

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50 cursor-pointer transition-colors"
      onClick={() => navigate(`/deployments/${dep.id}`)}
    >
      <div className={clsx(
        'w-1 h-10 rounded-full flex-shrink-0',
        dep.status === 'online'   ? 'bg-brand-500' :
        dep.status === 'warning'  ? 'bg-amber-400' :
        dep.status === 'critical' ? 'bg-red-500'   : 'bg-surface-300',
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-surface-800">{dep.name}</span>
          <StatusBadge status={dep.status} />
        </div>
        <span className="text-xs text-surface-400">{cust?.name} · {dep.type}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-surface-500">
        <div className="text-right">
          <div className="font-mono text-surface-600">{depSensors.length} sensors</div>
          {offline > 0 && <div className="text-red-600">{offline} offline</div>}
          {warn > 0 && !offline && <div className="text-amber-600">{warn} warning</div>}
        </div>
        {depAlerts.length > 0 && (
          <span className="badge bg-red-50 text-red-600 border border-red-200">
            {depAlerts.length} alert{depAlerts.length > 1 ? 's' : ''}
          </span>
        )}
        <ChevronRight size={14} className="text-surface-300" />
      </div>
    </div>
  )
}

// ─── Admin / Full Overview ────────────────────────────────────────────────────
function AdminOverview({ navigate }) {
  const counts       = getSensorStatusCounts()
  const deployList   = Object.values(deployments)
  const activeAlerts = alerts.filter(a => !a.resolved).slice(0, 6)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Live platform status across all customers and deployments"
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Customers',      value: customers.length,    sub: 'Active contracts',          icon: Users,          cls: '' },
          { label: 'Deployments',    value: deployList.length,   sub: `Across ${customers.length} customers`, icon: Layers, cls: '' },
          { label: 'Active Sensors', value: counts.online,       sub: `${counts.total} total`,     icon: Radio,          cls: '' },
          { label: 'Offline',        value: counts.offline,      sub: `${counts.warning} warning`,  icon: WifiOff,        cls: 'text-red-600', valueCls: 'text-red-600' },
          { label: 'Active Alerts',  value: getActiveAlertCount(), sub: 'Across all deployments',  icon: AlertTriangle,  cls: 'text-amber-600', valueCls: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="stat-label">{k.label}</span>
              <k.icon size={15} className={k.cls || 'text-brand-600'} />
            </div>
            <div className={clsx('stat-value mb-1', k.valueCls)}>{k.value}</div>
            <p className="text-xs text-surface-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Deployments + Events grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
            <h2 className="section-header">Deployments</h2>
            <span className="text-xs text-surface-400">{deployList.length} total</span>
          </div>
          <div className="divide-y divide-surface-100">
            {deployList.map(dep => (
              <DeploymentRow key={dep.id} dep={dep} navigate={navigate} />
            ))}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
            <h2 className="section-header">Recent Events</h2>
            <button
              className="text-xs text-brand-600 hover:text-brand-700 transition-colors font-medium"
              onClick={() => navigate('/alerts')}
            >
              View all
            </button>
          </div>
          <div className="flex flex-col divide-y divide-surface-100 flex-1">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="px-5 py-3.5 hover:bg-surface-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <AlertTypeBadge type={alert.type} />
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="text-xs text-surface-700 leading-relaxed mt-1">{alert.title}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-surface-400 font-mono">{alert.sensorName}</span>
                  <span className="text-xs text-surface-400">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer health */}
      <div>
        <h2 className="section-header mb-3">Customer Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {customers.map(cust => {
            const custDeps     = cust.deploymentIds.map(id => deployments[id])
            const sensorList   = custDeps.flatMap(d => d.sensorIds.map(sid => sensors[sid]))
            const onlineCount  = sensorList.filter(s => s.status === 'online').length
            const alertCount   = alerts.filter(a => a.customerId === cust.id && !a.resolved).length
            return (
              <div
                key={cust.id}
                className="card p-5 cursor-pointer hover:border-brand-300 hover:shadow-card-md transition-all"
                onClick={() => navigate('/customers')}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-base"
                    style={{ backgroundColor: `${cust.color}18`, color: cust.color }}
                  >
                    {cust.logo}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">{cust.name}</p>
                    <p className="text-xs text-surface-400">{cust.industry}</p>
                  </div>
                  <div className="ml-auto"><StatusBadge status={cust.status} /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Deploys', value: custDeps.length,  cls: 'text-surface-700' },
                    { label: 'Online',  value: onlineCount,       cls: 'text-brand-600' },
                    { label: 'Alerts',  value: alertCount,        cls: alertCount > 0 ? 'text-amber-600' : 'text-surface-400' },
                  ].map(s => (
                    <div key={s.label} className="card-inner p-2 text-center">
                      <div className={clsx('text-sm font-mono font-semibold', s.cls)}>{s.value}</div>
                      <div className="text-xs text-surface-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Pharma view — tabs: Live Status | Site Configuration ────────────────────
function PharmaOverview({ navigate, pharmaCustomerId }) {
  const [tab, setTab] = useState('status')
  const cust        = customers.find(c => c.id === pharmaCustomerId)
  const custDeps    = (cust?.deploymentIds || []).map(id => deployments[id])
  const sensorList  = custDeps.flatMap(d => d.sensorIds.map(sid => sensors[sid]))
  const onlineCount = sensorList.filter(s => s.status === 'online').length
  const warnCount   = sensorList.filter(s => s.status === 'warning').length
  const offlineCount= sensorList.filter(s => s.status === 'offline').length
  const myAlerts    = alerts.filter(a => a.customerId === pharmaCustomerId && !a.resolved)

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-1">{cust?.name}</p>
          <h1 className="font-display text-2xl font-bold text-surface-800">My Sites</h1>
          <p className="text-sm text-surface-500 mt-1">Live status and configuration for your monitored locations</p>
        </div>
        {myAlerts.length > 0 && (
          <span
            className="badge bg-red-50 text-red-600 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => navigate('/alerts')}
          >
            <AlertTriangle size={11} />
            {myAlerts.length} active alert{myAlerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1 border border-surface-200 w-fit">
        {[
          { key: 'status', label: 'Live Status',     icon: Radio },
          { key: 'config', label: 'Site Configuration', icon: Settings },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t.key
                ? 'bg-white text-surface-800 shadow-sm border border-surface-200'
                : 'text-surface-500 hover:text-surface-700',
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'status' && (
        <div className="space-y-5 animate-fade-in">
          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Radio,         label: 'Sensors Online', value: onlineCount, cls: 'text-brand-700',  bg: 'bg-brand-50',  iconCls: 'text-brand-600' },
              { icon: AlertTriangle, label: 'In Warning',     value: warnCount,   cls: warnCount > 0 ? 'text-amber-700' : 'text-surface-400',  bg: warnCount > 0 ? 'bg-amber-50' : 'bg-surface-100', iconCls: warnCount > 0 ? 'text-amber-500' : 'text-surface-400' },
              { icon: WifiOff,       label: 'Offline',        value: offlineCount, cls: offlineCount > 0 ? 'text-red-700' : 'text-surface-400', bg: offlineCount > 0 ? 'bg-red-50' : 'bg-surface-100', iconCls: offlineCount > 0 ? 'text-red-500' : 'text-surface-400' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                    <s.icon size={18} className={s.iconCls} />
                  </div>
                  <div>
                    <div className={clsx('text-2xl font-display font-bold', s.cls)}>{s.value}</div>
                    <div className="text-xs text-surface-500">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Deployment cards */}
          <div>
            <h2 className="section-header mb-3">Your Deployments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {custDeps.map(dep => {
                const depSensors = dep.sensorIds.map(id => sensors[id])
                const depWarn    = depSensors.filter(s => s.status === 'warning').length
                const depOffline = depSensors.filter(s => s.status === 'offline').length
                const depAlerts  = alerts.filter(a => a.deploymentId === dep.id && !a.resolved)
                const firstSensor = depSensors.find(s => s.latestReading?.temperature != null)
                return (
                  <div
                    key={dep.id}
                    className="card p-5 cursor-pointer hover:border-brand-300 hover:shadow-card-md transition-all"
                    onClick={() => navigate(`/deployments/${dep.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-2 h-10 rounded-full flex-shrink-0',
                          dep.status === 'online' ? 'bg-brand-500' :
                          dep.status === 'warning' ? 'bg-amber-400' :
                          dep.status === 'critical' ? 'bg-red-500' : 'bg-surface-300'
                        )} />
                        <div>
                          <h3 className="text-sm font-semibold text-surface-800">{dep.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-surface-400 mt-0.5">
                            <MapPin size={10} />{dep.location.split('—')[1]?.trim() || dep.location}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={dep.status} />
                    </div>
                    {firstSensor && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1.5 card-inner px-3 py-2 flex-1">
                          <Thermometer size={13} className="text-brand-500" />
                          <span className="text-sm font-mono font-semibold text-surface-800">{firstSensor.latestReading.temperature}°C</span>
                          <span className="text-xs text-surface-400 ml-auto">temp</span>
                        </div>
                        {firstSensor.latestReading.humidity != null && (
                          <div className="flex items-center gap-1.5 card-inner px-3 py-2 flex-1">
                            <Droplets size={13} className="text-sky-500" />
                            <span className="text-sm font-mono font-semibold text-surface-800">{firstSensor.latestReading.humidity}%</span>
                            <span className="text-xs text-surface-400 ml-auto">humidity</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-surface-400">
                      <span>{depSensors.length} sensor{depSensors.length !== 1 ? 's' : ''}</span>
                      <div className="flex items-center gap-3">
                        {depOffline > 0 && <span className="text-red-600">{depOffline} offline</span>}
                        {depWarn > 0 && <span className="text-amber-600">{depWarn} warning</span>}
                        {depAlerts.length > 0 && (
                          <span className="badge bg-red-50 text-red-600 border border-red-200">
                            {depAlerts.length} alert{depAlerts.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <ChevronRight size={13} className="text-surface-300" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active alerts */}
          {myAlerts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-header">Active Alerts</h2>
                <button className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors" onClick={() => navigate('/alerts')}>
                  View all →
                </button>
              </div>
              <div className="card divide-y divide-surface-100">
                {myAlerts.slice(0, 4).map(alert => (
                  <div key={alert.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-50 transition-colors">
                    <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      alert.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'
                    )}>
                      <AlertTriangle size={14} className={alert.severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-surface-800">{alert.title}</span>
                        <SeverityBadge severity={alert.severity} />
                      </div>
                      <p className="text-xs text-surface-500 leading-relaxed">{alert.message}</p>
                      <p className="text-xs text-surface-400 font-mono mt-1">
                        {alert.sensorName} · {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="animate-fade-in">
          <PharmaSiteManager customerId={pharmaCustomerId} />
        </div>
      )}
    </div>
  )
}

// ─── Cal Engineer view — deployment + device health focus ────────────────────
// ─── Cal Engineer view — deployment + device health focus ────────────────────
function CalEngineerOverview({ navigate }) {
  const counts     = getSensorStatusCounts()
  const deployList = Object.values(deployments)
  const activeAlerts = alerts.filter(a => !a.resolved)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Device readiness and deployment health"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Deployments',    value: deployList.length,     sub: 'Active',            icon: Layers,        cls: 'text-brand-600' },
          { label: 'Sensors Online', value: counts.online,         sub: `of ${counts.total}`, icon: Radio,         cls: 'text-brand-600' },
          { label: 'Offline',        value: counts.offline,        sub: 'Need attention',     icon: WifiOff,       cls: 'text-red-600',   valueCls: 'text-red-600' },
          { label: 'Active Alerts',  value: activeAlerts.length,   sub: 'Open items',         icon: AlertTriangle, cls: 'text-amber-600', valueCls: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="stat-label">{k.label}</span>
              <k.icon size={15} className={k.cls} />
            </div>
            <div className={clsx('stat-value mb-1', k.valueCls)}>{k.value}</div>
            <p className="text-xs text-surface-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-surface-200">
          <h2 className="section-header">All Deployments</h2>
        </div>
        <div className="divide-y divide-surface-100">
          {deployList.map(dep => (
            <DeploymentRow key={dep.id} dep={dep} navigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main export — role switch ────────────────────────────────────────────────
export default function Overview() {
  const navigate = useNavigate()
  const { role } = useRole()

  if (role.key === 'pharma') {
    return <PharmaOverview navigate={navigate} pharmaCustomerId={role.features.pharmaCustomerId} />
  }
  if (role.key === 'cal_engineer') {
    return <CalEngineerOverview navigate={navigate} />
  }
  return <AdminOverview navigate={navigate} />
}
