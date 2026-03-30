import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, User, Shield, Thermometer,
  Droplets, Battery, Wifi, Clock, AlertTriangle, ChevronRight,
  Activity, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'
import {
  getDeploymentWithSensors, getAlertsForDeployment, sensors as allSensors,
} from '../data/mockData'
import {
  PageHeader, StatusBadge, SeverityBadge, AlertTypeBadge,
  BatteryBar, SensorRow,
} from '../components/ui'
import TelemetryChart from '../components/ui/TelemetryChart'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

// Compute min / avg / max from telemetry array
function getStats(data, key) {
  const vals = data.map(d => d[key]).filter(v => v != null)
  if (!vals.length) return { min: '—', avg: '—', max: '—' }
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return {
    min: min.toFixed(1),
    avg: avg.toFixed(1),
    max: max.toFixed(1),
  }
}

function StatPill({ label, value, unit, color }) {
  return (
    <div className="card-inner px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={clsx('text-lg font-display font-700', color || 'text-slate-200')}>
        {value}<span className="text-sm font-sans font-normal text-slate-400 ml-0.5">{unit}</span>
      </span>
    </div>
  )
}

export default function DeploymentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dep = getDeploymentWithSensors(id)
  const [selectedSensorId, setSelectedSensorId] = useState(dep?.sensors?.[0]?.id || null)

  if (!dep) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-slate-400">Deployment not found.</p>
        <button className="btn-ghost" onClick={() => navigate(-1)}>Go back</button>
      </div>
    )
  }

  const activeSensor = dep.sensors.find(s => s.id === selectedSensorId) || dep.sensors[0]
  const depAlerts    = getAlertsForDeployment(id)
  const activeAlerts = depAlerts.filter(a => !a.resolved)

  // Aggregate telemetry across all sensors (for deployment-level chart)
  const combinedTelemetry = activeSensor?.telemetry || []

  const tempStats   = getStats(combinedTelemetry, 'temperature')
  const humidStats  = getStats(combinedTelemetry, 'humidity')

  // Check if sensor reading is within threshold
  function tempStatus(sensor) {
    const val = sensor.latestReading?.temperature
    if (val == null) return 'offline'
    if (val > sensor.thresholds.tempMax || val < sensor.thresholds.tempMin) return 'breach'
    if (val > sensor.thresholds.tempMax - 1 || val < sensor.thresholds.tempMin + 1) return 'warn'
    return 'ok'
  }

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-3 transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>
        <PageHeader
          title={dep.name}
          subtitle={dep.location}
          breadcrumb={[dep.customer?.name, 'Deployments', dep.name]}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={dep.status} />
              {activeAlerts.length > 0 && (
                <span className="badge bg-red-500/10 text-red-400 border border-red-900/30">
                  <AlertTriangle size={11} />
                  {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Deployment meta cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <User size={13} />
            <span className="text-xs uppercase tracking-wider">Contact</span>
          </div>
          <p className="text-sm text-slate-200 font-medium">{dep.contactPerson}</p>
          <p className="text-xs text-slate-500">{dep.contactEmail}</p>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Activity size={13} />
            <span className="text-xs uppercase tracking-wider">Type</span>
          </div>
          <p className="text-sm text-slate-200 font-medium">{dep.type}</p>
          <p className="text-xs text-slate-500">{dep.sensors.length} sensors deployed</p>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Shield size={13} />
            <span className="text-xs uppercase tracking-wider">Threshold Profile</span>
          </div>
          <p className="text-sm text-slate-200 font-medium leading-tight">{dep.thresholdProfile}</p>
        </div>
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar size={13} />
            <span className="text-xs uppercase tracking-wider">Since</span>
          </div>
          <p className="text-sm text-slate-200 font-medium">{dep.startDate}</p>
          <p className="text-xs text-slate-500">
            {Math.floor((Date.now() - new Date(dep.startDate)) / (1000 * 60 * 60 * 24))} days running
          </p>
        </div>
      </div>

      {/* Main layout: chart + sensor list + alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Left: chart + stats */}
        <div className="xl:col-span-2 flex flex-col gap-4">

          {/* Sensor selector */}
          <div className="card">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-500 overflow-x-auto">
              <span className="text-xs text-slate-500 uppercase tracking-wider flex-shrink-0">Viewing:</span>
              {dep.sensors.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSensorId(s.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                    selectedSensorId === s.id
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-surface-400'
                  )}
                >
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    s.status === 'online'  ? 'bg-brand-400' :
                    s.status === 'warning' ? 'bg-amber-400' : 'bg-slate-500'
                  )} />
                  {s.name}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">{activeSensor?.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Last 24 hours · {activeSensor?.type === 'EM320' ? 'Milesight EM320-TH' : 'Teltonika Eye'}
                  </p>
                </div>
                {activeSensor?.lastSeen && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock size={11} />
                    <span>Last seen {formatDistanceToNow(new Date(activeSensor.lastSeen), { addSuffix: true })}</span>
                  </div>
                )}
              </div>

              <TelemetryChart
                data={combinedTelemetry}
                thresholds={activeSensor?.thresholds}
                height={220}
              />

              {/* Threshold indicator legend */}
              {activeSensor?.thresholds && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-surface-600">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-4 h-px bg-red-500 inline-block" style={{ borderTop: '1px dashed #ef4444' }} />
                    Upper limit: {activeSensor.thresholds.tempMax}°C
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="w-4 h-px bg-blue-500 inline-block" style={{ borderTop: '1px dashed #3b82f6' }} />
                    Lower limit: {activeSensor.thresholds.tempMin}°C
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Min / Avg / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={14} className="text-brand-400" />
                <span className="text-xs uppercase tracking-wider text-slate-500">Temperature Stats</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Min" value={tempStats.min} unit="°C" color="text-sky-400" />
                <StatPill label="Avg" value={tempStats.avg} unit="°C" color="text-brand-400" />
                <StatPill label="Max" value={tempStats.max} unit="°C" color="text-amber-400" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={14} className="text-sky-400" />
                <span className="text-xs uppercase tracking-wider text-slate-500">Humidity Stats</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Min" value={humidStats.min} unit="%" color="text-sky-400" />
                <StatPill label="Avg" value={humidStats.avg} unit="%" color="text-brand-400" />
                <StatPill label="Max" value={humidStats.max} unit="%" color="text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: sensors + alerts */}
        <div className="flex flex-col gap-4">
          {/* Sensor list */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-500">
              <h3 className="text-xs font-700 font-display uppercase tracking-widest text-slate-300">Sensors</h3>
              <span className="text-xs text-slate-500">{dep.sensors.length} devices</span>
            </div>
            <div className="divide-y divide-surface-600">
              {dep.sensors.map(sensor => {
                const ts = tempStatus(sensor)
                return (
                  <div
                    key={sensor.id}
                    className={clsx(
                      'px-5 py-4 hover:bg-surface-700/40 cursor-pointer transition-colors',
                      selectedSensorId === sensor.id && 'bg-brand-500/5'
                    )}
                    onClick={() => setSelectedSensorId(sensor.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          sensor.status === 'online'  ? 'bg-brand-400 pulse-dot' :
                          sensor.status === 'warning' ? 'bg-amber-400 pulse-dot' : 'bg-slate-600'
                        )} />
                        <span className="text-sm font-medium text-slate-200">{sensor.name}</span>
                      </div>
                      <StatusBadge status={sensor.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {sensor.latestReading.temperature != null ? (
                        <div className={clsx(
                          'card-inner px-3 py-2 flex items-center gap-2',
                          ts === 'breach' && 'border-red-500/40',
                          ts === 'warn'   && 'border-amber-500/40'
                        )}>
                          <Thermometer size={12} className="text-brand-400" />
                          <span className={clsx(
                            'text-sm font-mono font-medium',
                            ts === 'breach' ? 'text-red-400' :
                            ts === 'warn'   ? 'text-amber-400' : 'text-slate-200'
                          )}>
                            {sensor.latestReading.temperature}°C
                          </span>
                        </div>
                      ) : (
                        <div className="card-inner px-3 py-2 flex items-center gap-2">
                          <Thermometer size={12} className="text-slate-600" />
                          <span className="text-sm font-mono text-slate-600">—</span>
                        </div>
                      )}
                      {sensor.latestReading.humidity != null ? (
                        <div className="card-inner px-3 py-2 flex items-center gap-2">
                          <Droplets size={12} className="text-sky-400" />
                          <span className="text-sm font-mono font-medium text-slate-200">
                            {sensor.latestReading.humidity}%
                          </span>
                        </div>
                      ) : (
                        <div className="card-inner px-3 py-2 flex items-center gap-2">
                          <Droplets size={12} className="text-slate-600" />
                          <span className="text-sm font-mono text-slate-600">—</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <BatteryBar value={sensor.battery} />
                      <span className="text-xs text-slate-600 font-mono">
                        {sensor.lastSeen ? formatDistanceToNow(new Date(sensor.lastSeen), { addSuffix: true }) : '—'}
                      </span>
                    </div>

                    {/* Threshold breach indicator */}
                    {ts === 'breach' && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400">
                        <AlertTriangle size={11} />
                        Threshold breach
                      </div>
                    )}
                    {ts === 'warn' && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                        <AlertTriangle size={11} />
                        Approaching limit
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts panel */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-500">
              <h3 className="text-xs font-700 font-display uppercase tracking-widest text-slate-300">
                Alerts & Events
              </h3>
              {activeAlerts.length > 0 && (
                <span className="badge bg-red-500/10 text-red-400 border border-red-900/30">
                  {activeAlerts.length} active
                </span>
              )}
            </div>
            <div className="divide-y divide-surface-600">
              {depAlerts.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No events for this deployment
                </div>
              ) : (
                depAlerts.map(alert => (
                  <div key={alert.id} className={clsx(
                    'px-5 py-3.5 transition-colors',
                    alert.resolved ? 'opacity-50' : 'hover:bg-surface-700/30'
                  )}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <AlertTypeBadge type={alert.type} />
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={alert.severity} />
                        {alert.resolved && (
                          <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs">Resolved</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-slate-600 font-mono">{alert.sensorName}</span>
                      <span className="text-xs text-slate-600">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
