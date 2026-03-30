import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, MapPin, Mail, Phone, Layers, Radio, AlertTriangle } from 'lucide-react'
import { customers, deployments, sensors, alerts } from '../data/mockData'
import { PageHeader, StatusBadge, SeverityBadge } from '../components/ui'
import clsx from 'clsx'

function DeploymentCard({ dep, onClick }) {
  const depSensors = dep.sensorIds.map(id => sensors[id])
  const onlineCount  = depSensors.filter(s => s.status === 'online').length
  const warnCount    = depSensors.filter(s => s.status === 'warning').length
  const offlineCount = depSensors.filter(s => s.status === 'offline').length
  const depAlerts    = alerts.filter(a => a.deploymentId === dep.id && !a.resolved)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-surface-700/60 hover:bg-surface-600/80 border border-surface-500 hover:border-brand-500/30 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className={clsx(
        'w-0.5 h-8 rounded-full flex-shrink-0',
        dep.status === 'online'   ? 'bg-brand-500' :
        dep.status === 'warning'  ? 'bg-amber-500' :
        dep.status === 'critical' ? 'bg-red-500'   : 'bg-slate-600'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-slate-200 truncate">{dep.name}</span>
        </div>
        <span className="text-xs text-slate-500">{dep.type} · {dep.location.split('—')[1]?.trim() || dep.location}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="font-mono text-slate-400">{depSensors.length} sensors</span>
        {offlineCount > 0 && <span className="text-red-400">{offlineCount} offline</span>}
        {warnCount > 0 && <span className="text-amber-400">{warnCount} warn</span>}
        {depAlerts.length > 0 && (
          <span className="badge bg-red-500/10 text-red-400 border border-red-900/30">
            {depAlerts.length}
          </span>
        )}
        <ChevronRight size={13} className="text-slate-600" />
      </div>
    </div>
  )
}

export default function Customers() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.industry.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} active customer accounts`}
        actions={
          <input
            className="input w-60"
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        }
      />

      <div className="space-y-5">
        {filtered.map(cust => {
          const custDeps   = cust.deploymentIds.map(id => deployments[id])
          const sensorList = custDeps.flatMap(d => d.sensorIds.map(sid => sensors[sid]))
          const onlineC    = sensorList.filter(s => s.status === 'online').length
          const offlineC   = sensorList.filter(s => s.status === 'offline').length
          const warnC      = sensorList.filter(s => s.status === 'warning').length
          const custAlerts = alerts.filter(a => a.customerId === cust.id && !a.resolved)

          return (
            <div key={cust.id} className="card overflow-hidden">
              {/* Customer header */}
              <div className="px-6 py-5 flex items-start gap-4 border-b border-surface-500">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-700 text-xl flex-shrink-0"
                  style={{ backgroundColor: `${cust.color}1a`, color: cust.color }}
                >
                  {cust.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-display text-lg font-700 text-slate-100">{cust.name}</h2>
                    <StatusBadge status={cust.status} />
                    <span className="text-xs text-slate-500 bg-surface-600 px-2 py-0.5 rounded-full">{cust.industry}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><MapPin size={11} />{cust.address}</span>
                    <span className="flex items-center gap-1.5"><Mail size={11} />{cust.contactEmail}</span>
                    <span className="flex items-center gap-1.5"><Phone size={11} />{cust.contactPhone}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xl font-display font-700 text-slate-100">{custDeps.length}</div>
                    <div className="text-xs text-slate-500">Deployments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-display font-700 text-brand-400">{onlineC}</div>
                    <div className="text-xs text-slate-500">Online</div>
                  </div>
                  {offlineC > 0 && (
                    <div className="text-center">
                      <div className="text-xl font-display font-700 text-red-400">{offlineC}</div>
                      <div className="text-xs text-slate-500">Offline</div>
                    </div>
                  )}
                  {custAlerts.length > 0 && (
                    <div className="text-center">
                      <div className="text-xl font-display font-700 text-amber-400">{custAlerts.length}</div>
                      <div className="text-xs text-slate-500">Alerts</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deployments */}
              <div className="p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
                  Deployments ({custDeps.length})
                </p>
                <div className="space-y-2">
                  {custDeps.map(dep => (
                    <DeploymentCard
                      key={dep.id}
                      dep={dep}
                      onClick={() => navigate(`/deployments/${dep.id}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Active alerts if any */}
              {custAlerts.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
                    Active Alerts
                  </p>
                  <div className="space-y-2">
                    {custAlerts.slice(0, 3).map(al => (
                      <div key={al.id} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface-700/40 border border-surface-500">
                        <AlertTriangle size={13} className={clsx(
                          'mt-0.5 flex-shrink-0',
                          al.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300">{al.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{al.sensorName}</p>
                        </div>
                        <SeverityBadge severity={al.severity} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
