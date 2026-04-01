import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, User, Shield,
  Thermometer, Droplets, Battery, AlertTriangle, Activity,
} from 'lucide-react'
import {
  getDeploymentWithSensors, getAlertsForDeployment,
} from '../data/mockData'
import {
  PageHeader, StatusBadge, SeverityBadge, AlertTypeBadge, BatteryBar,
} from '../components/ui'
import TelemetryChart from '../components/ui/TelemetryChart'
import { formatDistanceToNow, format } from 'date-fns'
import clsx from 'clsx'

function getStats(data, key) {
  const vals = data.map(d => d[key]).filter(v => v != null)
  if (!vals.length) return { min: '—', avg: '—', max: '—' }
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return { min: min.toFixed(1), avg: avg.toFixed(1), max: max.toFixed(1) }
}

function StatPill({ label, value, unit, color }) {
  return (
    <div className="card-inner px-4 py-3 flex flex-col gap-1">
      <span className="text-xs text-surface-500">{label}</span>
      <span className={clsx('text-lg font-display font-bold', color || 'text-surface-800')}>
        {value}
        <span className="text-sm font-sans font-normal text-surface-400 ml-0.5">{unit}</span>
      </span>
    </div>
  )
}

function tempStatus(sensor) {
  const val = sensor.latestReading?.temperature
  if (val == null) return 'offline'
  if (val > sensor.thresholds.tempMax || val < sensor.thresholds.tempMin) return 'breach'
  if (val > sensor.thresholds.tempMax - 1 || val < sensor.thresholds.tempMin + 1) return 'warn'
  return 'ok'
}

export default function DeploymentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dep = getDeploymentWithSensors(id)
  const [selectedSensorId, setSelectedSensorId] = useState(dep?.sensors?.[0]?.id || null)

  if (!dep) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center gap-3">
        <p className="text-surface-500">Deployment not found.</p>
        <button className="btn-ghost" onClick={() => navigate(-1)}>Go back</button>
      </div>
    )
  }

  const activeSensor  = dep.sensors.find(s => s.id === selectedSensorId) || dep.sensors[0]
  const depAlerts     = getAlertsForDeployment(id)
  const activeAlerts  = depAlerts.filter(a => !a.resolved)
  const telemetry     = activeSensor?.telemetry || []
  const tempStats     = getStats(telemetry, 'temperature')
  const humidStats    = getStats(telemetry, 'humidity')

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-700 mb-3 transition-colors"
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
                <span className="badge bg-red-50 text-red-600 border border-red-200">
                  <AlertTriangle size={11} />
                  {activeAlerts.length} alert{activeAlerts.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: User, label: 'Contact',
            content: <><p className="text-sm font-semibold text-surface-800">{dep.contactPerson}</p><p className="text-xs text-surface-400">{dep.contactEmail}</p></>,
          },
          {
            icon: Activity, label: 'Type',
            content: <><p className="text-sm font-semibold text-surface-800">{dep.type}</p><p className="text-xs text-surface-400">{dep.sensors.length} sensors deployed</p></>,
          },
          {
            icon: Shield, label: 'Threshold Profile',
            content: <p className="text-sm font-semibold text-surface-800 leading-tight">{dep.thresholdProfile}</p>,
          },
          {
            icon: Calendar, label: 'Since',
            content: <><p className="text-sm font-semibold text-surface-800">{dep.startDate}</p><p className="text-xs text-surface-400">{Math.floor((Date.now() - new Date(dep.startDate)) / (1000 * 60 * 60 * 24))} days running</p></>,
          },
        ].map(card => (
          <div key={card.label} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-surface-400">
              <card.icon size={13} />
              <span className="text-xs uppercase tracking-wider font-medium">{card.label}</span>
            </div>
            {card.content}
          </div>
        ))}
      </div>

      {/* Chart + sensor list + alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Left: chart + stats */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="card">
            {/* Sensor selector tabs */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-200 overflow-x-auto bg-surface-50 rounded-t-xl">
              <span className="text-xs text-surface-400 uppercase tracking-wider flex-shrink-0">Viewing:</span>
              {dep.sensors.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSensorId(s.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border',
                    selectedSensorId === s.id
                      ? 'bg-brand-50 text-brand-700 border-brand-200'
                      : 'text-surface-500 hover:text-surface-700 border-transparent hover:border-surface-200',
                  )}
                >
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    s.status === 'online'  ? 'bg-brand-500' :
                    s.status === 'warning' ? 'bg-amber-400' : 'bg-surface-300',
                  )} />
                  {s.name}
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-surface-800">{activeSensor?.name}</h3>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Thresholds: {activeSensor?.thresholds.tempMin}–{activeSensor?.thresholds.tempMax}°C
                  </p>
                </div>
                {activeSensor?.latestReading?.temperature != null && (
                  <div className="flex items-center gap-3">
                    <div className="card-inner px-3 py-2 flex items-center gap-2">
                      <Thermometer size={13} className="text-brand-500" />
                      <span className="text-sm font-mono font-semibold text-surface-800">
                        {activeSensor.latestReading.temperature}°C
                      </span>
                    </div>
                    {activeSensor?.latestReading?.humidity != null && (
                      <div className="card-inner px-3 py-2 flex items-center gap-2">
                        <Droplets size={13} className="text-sky-500" />
                        <span className="text-sm font-mono font-semibold text-surface-800">
                          {activeSensor.latestReading.humidity}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <TelemetryChart
                data={telemetry}
                thresholds={activeSensor?.thresholds}
                height={240}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={14} className="text-brand-500" />
                <span className="text-xs uppercase tracking-wider text-surface-500 font-medium">Temperature Stats</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Min" value={tempStats.min} unit="°C" color="text-sky-600" />
                <StatPill label="Avg" value={tempStats.avg} unit="°C" color="text-brand-600" />
                <StatPill label="Max" value={tempStats.max} unit="°C" color="text-amber-600" />
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplets size={14} className="text-sky-500" />
                <span className="text-xs uppercase tracking-wider text-surface-500 font-medium">Humidity Stats</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Min" value={humidStats.min} unit="%" color="text-sky-600" />
                <StatPill label="Avg" value={humidStats.avg} unit="%" color="text-brand-600" />
                <StatPill label="Max" value={humidStats.max} unit="%" color="text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: sensors + alerts */}
        <div className="flex flex-col gap-4">
          {/* Sensor list */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 bg-surface-50 rounded-t-xl">
              <h3 className="section-header">Sensors</h3>
              <span className="text-xs text-surface-400">{dep.sensors.length} devices</span>
            </div>
            <div className="divide-y divide-surface-100">
              {dep.sensors.map(sensor => {
                const ts = tempStatus(sensor)
                return (
                  <div
                    key={sensor.id}
                    className={clsx(
                      'px-5 py-4 hover:bg-surface-50 cursor-pointer transition-colors',
                      selectedSensorId === sensor.id && 'bg-brand-50/40 border-l-2 border-brand-400',
                    )}
                    onClick={() => setSelectedSensorId(sensor.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          sensor.status === 'online'  ? 'bg-brand-500 pulse-dot' :
                          sensor.status === 'warning' ? 'bg-amber-400 pulse-dot' : 'bg-surface-300',
                        )} />
                        <span className="text-sm font-medium text-surface-800">{sensor.name}</span>
                      </div>
                      <StatusBadge status={sensor.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {sensor.latestReading.temperature != null ? (
                        <div className={clsx(
                          'card-inner px-3 py-2 flex items-center gap-2',
                          ts === 'breach' && 'border-red-300 bg-red-50',
                          ts === 'warn'   && 'border-amber-300 bg-amber-50',
                        )}>
                          <Thermometer size={12} className="text-brand-500" />
                          <span className={clsx(
                            'text-sm font-mono font-semibold',
                            ts === 'breach' ? 'text-red-600' :
                            ts === 'warn'   ? 'text-amber-600' : 'text-surface-800',
                          )}>
                            {sensor.latestReading.temperature}°C
                          </span>
                        </div>
                      ) : (
                        <div className="card-inner px-3 py-2 flex items-center gap-2">
                          <Thermometer size={12} className="text-surface-300" />
                          <span className="text-sm font-mono text-surface-300">—</span>
                        </div>
                      )}

                      {sensor.latestReading.humidity != null ? (
                        <div className="card-inner px-3 py-2 flex items-center gap-2">
                          <Droplets size={12} className="text-sky-500" />
                          <span className="text-sm font-mono font-semibold text-surface-800">
                            {sensor.latestReading.humidity}%
                          </span>
                        </div>
                      ) : (
                        <div className="card-inner px-3 py-2 flex items-center gap-2">
                          <Droplets size={12} className="text-surface-300" />
                          <span className="text-sm font-mono text-surface-300">—</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <BatteryBar value={sensor.battery} />
                      <span className="text-xs text-surface-400 font-mono">
                        {sensor.lastSeen
                          ? formatDistanceToNow(new Date(sensor.lastSeen), { addSuffix: true })
                          : '—'}
                      </span>
                    </div>

                    {ts === 'breach' && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium">
                        <AlertTriangle size={11} /> Threshold breach
                      </div>
                    )}
                    {ts === 'warn' && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 font-medium">
                        <AlertTriangle size={11} /> Approaching limit
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-200 bg-surface-50 rounded-t-xl">
              <h3 className="section-header">Alerts & Events</h3>
              {activeAlerts.length > 0 && (
                <span className="badge bg-red-50 text-red-600 border border-red-200">
                  {activeAlerts.length} active
                </span>
              )}
            </div>
            <div className="divide-y divide-surface-100">
              {depAlerts.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-surface-400">
                  No events for this deployment
                </div>
              ) : (
                depAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={clsx(
                      'px-5 py-3.5 transition-colors',
                      alert.resolved ? 'opacity-50' : 'hover:bg-surface-50',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <AlertTypeBadge type={alert.type} />
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={alert.severity} />
                        {alert.resolved && (
                          <span className="badge bg-brand-50 text-brand-600 border border-brand-200 text-xs">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-surface-700 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-surface-400 font-mono">{alert.sensorName}</span>
                      <span className="text-xs text-surface-400">
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
