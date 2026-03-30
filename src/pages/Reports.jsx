import React, { useState } from 'react'
import {
  FileText, Download, Table2, FileSpreadsheet, Calendar,
  ChevronDown, Filter, BarChart2, Clock,
} from 'lucide-react'
import { customers, deployments, sensors } from '../data/mockData'
import { PageHeader, StatusBadge } from '../components/ui'
import { format, subDays } from 'date-fns'
import clsx from 'clsx'

const REPORT_TYPES = [
  { id: 'temperature',  label: 'Temperature Only',          icon: BarChart2,  desc: 'Temperature readings with min/max/avg summaries' },
  { id: 'humidity',     label: 'Humidity Only',             icon: BarChart2,  desc: 'Humidity readings with min/max/avg summaries' },
  { id: 'temp_humid',   label: 'Temperature & Humidity',    icon: BarChart2,  desc: 'Combined temperature and humidity report' },
]

const FORMAT_OPTIONS = ['CSV', 'XLSX', 'PDF']

export default function Reports() {
  const [selectedCustomer, setSelectedCustomer]   = useState('')
  const [selectedDeployment, setSelectedDeployment] = useState('')
  const [selectedSensors, setSelectedSensors]     = useState([])
  const [reportType, setReportType]               = useState('temperature')
  const [exportFormat, setExportFormat]           = useState('CSV')
  const [dateFrom, setDateFrom]                   = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [dateTo, setDateTo]                       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [generating, setGenerating]               = useState(false)
  const [generated, setGenerated]                 = useState(false)

  const filteredDeployments = selectedCustomer
    ? Object.values(deployments).filter(d => d.customerId === selectedCustomer)
    : Object.values(deployments)

  const filteredSensors = selectedDeployment
    ? deployments[selectedDeployment]?.sensorIds.map(id => sensors[id]) || []
    : []

  function toggleSensor(id) {
    setSelectedSensors(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function handleGenerate() {
    setGenerating(true)
    setGenerated(false)
    setTimeout(() => { setGenerating(false); setGenerated(true) }, 1600)
  }

  const selectedReportType = REPORT_TYPES.find(r => r.id === reportType)
  const days = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and export telemetry reports for deployments and sensors"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Filters panel */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="font-display text-xs font-700 uppercase tracking-widest text-slate-400 mb-4">
              Report Configuration
            </h3>

            {/* Report type */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Report Type</label>
              <div className="space-y-1.5">
                {REPORT_TYPES.map(rt => {
                  const Icon = rt.icon
                  return (
                    <button
                      key={rt.id}
                      onClick={() => setReportType(rt.id)}
                      className={clsx(
                        'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all',
                        reportType === rt.id
                          ? 'bg-brand-500/15 border border-brand-500/40 text-brand-400'
                          : 'hover:bg-surface-600 text-slate-400 border border-transparent'
                      )}
                    >
                      <Icon size={14} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium">{rt.label}</p>
                        <p className="text-xs opacity-60 mt-0.5 leading-relaxed">{rt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Customer filter */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">Customer</label>
              <select
                className="select w-full"
                value={selectedCustomer}
                onChange={e => { setSelectedCustomer(e.target.value); setSelectedDeployment(''); setSelectedSensors([]) }}
              >
                <option value="">All customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Deployment filter */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">Deployment</label>
              <select
                className="select w-full"
                value={selectedDeployment}
                onChange={e => { setSelectedDeployment(e.target.value); setSelectedSensors([]) }}
              >
                <option value="">All deployments</option>
                {filteredDeployments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Sensor selection */}
            {filteredSensors.length > 0 && (
              <div className="mb-3">
                <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">
                  Sensors <span className="text-slate-600">(optional)</span>
                </label>
                <div className="space-y-1">
                  {filteredSensors.map(s => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSensors.includes(s.id)}
                        onChange={() => toggleSensor(s.id)}
                        className="accent-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-slate-300">{s.name}</span>
                      <StatusBadge status={s.status} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date range */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-600 mb-1">From</p>
                  <input
                    type="date"
                    className="input w-full text-xs"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs text-slate-600 mb-1">To</p>
                  <input
                    type="date"
                    className="input w-full text-xs"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Export format */}
            <div className="mb-5">
              <label className="text-xs text-slate-500 uppercase tracking-wider block mb-1.5">Format</label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map(f => (
                  <button
                    key={f}
                    onClick={() => setExportFormat(f)}
                    className={clsx(
                      'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      exportFormat === f
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                        : 'text-slate-500 border-surface-500 hover:border-surface-400 hover:text-slate-300'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full justify-center"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <BarChart2 size={14} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {generated ? (
            <>
              {/* Report preview card */}
              <div className="card">
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-500">
                  <div>
                    <h3 className="font-display text-base font-700 text-slate-100">{selectedReportType?.label}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCustomer ? customers.find(c => c.id === selectedCustomer)?.name : 'All customers'} ·{' '}
                      {dateFrom} to {dateTo} · {days} days
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost gap-2 text-xs">
                      <Download size={13} /> Download {exportFormat}
                    </button>
                  </div>
                </div>

                {/* Mock preview table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-surface-500">
                        {['Timestamp', 'Sensor', 'Temp (°C)', 'Humidity (%)', 'Battery', 'Status'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-slate-500 font-medium uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-600">
                      {[
                        { ts: '2024-04-15 09:00', sensor: 'Fridge Unit A1', temp: 4.7, humid: 43.2, bat: 87, status: 'ok' },
                        { ts: '2024-04-15 09:15', sensor: 'Fridge Unit A1', temp: 4.9, humid: 43.5, bat: 87, status: 'ok' },
                        { ts: '2024-04-15 09:30', sensor: 'Fridge Unit A1', temp: 5.1, humid: 43.1, bat: 87, status: 'ok' },
                        { ts: '2024-04-15 09:00', sensor: 'Ambient Monitor B1', temp: 24.8, humid: 56.2, bat: 24, status: 'warn' },
                        { ts: '2024-04-15 09:15', sensor: 'Ambient Monitor B1', temp: 25.7, humid: 57.0, bat: 23, status: 'breach' },
                        { ts: '2024-04-15 09:30', sensor: 'Ambient Monitor B1', temp: 26.1, humid: 58.4, bat: 23, status: 'breach' },
                      ].map((row, i) => (
                        <tr key={i} className={clsx('hover:bg-surface-700/30', row.status === 'breach' && 'bg-red-500/5')}>
                          <td className="px-5 py-2.5 font-mono text-slate-400">{row.ts}</td>
                          <td className="px-5 py-2.5 text-slate-300">{row.sensor}</td>
                          <td className={clsx(
                            'px-5 py-2.5 font-mono font-medium',
                            row.status === 'breach' ? 'text-red-400' :
                            row.status === 'warn'   ? 'text-amber-400' : 'text-slate-200'
                          )}>
                            {row.temp}
                          </td>
                          <td className="px-5 py-2.5 font-mono text-slate-300">{row.humid}</td>
                          <td className="px-5 py-2.5 font-mono text-slate-400">{row.bat}%</td>
                          <td className="px-5 py-2.5">
                            <span className={clsx(
                              'badge',
                              row.status === 'breach' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                              row.status === 'warn'   ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                            )}>
                              {row.status === 'ok' ? 'In range' : row.status === 'warn' ? 'Warning' : 'Breach'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-3 border-t border-surface-500 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Showing 6 of 1,248 rows (preview)</span>
                  <button className="btn-ghost text-xs">
                    <Download size={12} />
                    Export full dataset
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4 text-center">
                  <div className="text-2xl font-display font-700 text-slate-100 mb-1">1,248</div>
                  <div className="text-xs text-slate-500">Total records</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-display font-700 text-amber-400 mb-1">3</div>
                  <div className="text-xs text-slate-500">Excursion events</div>
                </div>
                <div className="card p-4 text-center">
                  <div className="text-2xl font-display font-700 text-brand-400 mb-1">98.8%</div>
                  <div className="text-xs text-slate-500">In-range readings</div>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="card flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center mb-4 border border-surface-500">
                <FileText size={28} className="text-slate-500" />
              </div>
              <h3 className="font-display text-base font-700 text-slate-300 mb-2">No report generated yet</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Configure filters and click <span className="text-brand-400">Generate Report</span> to preview and export data.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
