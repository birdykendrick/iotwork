import React, { useState, useRef } from 'react'
import {
  FlaskConical, CheckCircle, Eye,
  Download, Trash2, Search, CalendarDays,
} from 'lucide-react'
import { sensors } from '../data/mockData'
import { PageHeader } from '../components/ui'
import { useRole } from '../context/RoleContext'
import { format } from 'date-fns'
import clsx from 'clsx'

const PARSER_TYPES = [
  { value: 'accumac_txt',  label: 'AccuMac (TXT)' },
  { value: 'rotronic_xls', label: 'Rotronic (XLS)' },
  { value: 'testo_csv',    label: 'Testo (CSV)' },
  { value: 'generic_csv',  label: 'Generic CSV' },
  { value: 'fluke_txt',    label: 'Fluke (TXT)' },
]

function parseFileContent(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return { channels: [], dataPoints: 0, fileName }
  let headerLine = null
  let dataLines  = []
  for (let i = 0; i < lines.length; i++) {
    const tokens     = lines[i].split(/\s+|,|;|\t/).filter(Boolean)
    const firstToken = tokens[0]
    const looksLikeData = /^[\d+\-]/.test(firstToken) && tokens.length > 1
    if (!looksLikeData && headerLine === null) headerLine = tokens
    else if (looksLikeData) dataLines.push(tokens)
  }
  if (!headerLine && dataLines.length > 0)
    headerLine = dataLines[0].map((_, i) => i === 0 ? 'Time' : `Col${i}`)
  const channels = headerLine
    ? headerLine.filter((_, i) =>
        i > 0 || !/time|date|timestamp/i.test(headerLine[0]) ? true : i !== 0)
    : []
  const dataChannels = channels.filter(ch => !/^(time|date|timestamp)$/i.test(ch))
  return { channels: dataChannels, dataPoints: dataLines.length, fileName }
}

function normalizeTimeInput(value) {
  let v = value.toLowerCase().replace(/[^0-9apm:\s]/g, '').trim()
  const match = v.match(/^(\d{1,2})(?::?(\d{0,2}))?\s*(a|am|p|pm)?$/)
  if (!match) return value
  let [, hh, mm = '', suffix = ''] = match
  let hour = parseInt(hh || '12', 10)
  if (Number.isNaN(hour)) return value
  hour = Math.min(Math.max(hour, 1), 12)
  if (mm.length > 2) mm = mm.slice(0, 2)
  if (mm.length === 0) mm = '00'
  if (suffix === 'a') suffix = 'am'
  if (suffix === 'p') suffix = 'pm'
  return `${hour}:${mm}${suffix ? ` ${suffix}` : ''}`
}

const allSensors = Object.values(sensors)

const INITIAL_SESSIONS = [
  {
    id: 'cal001',
    name: 'Q1 2024 — Fridge Unit A1',
    devices: ['s001'],
    timePeriod: { from: '2024-01-15T08:00', to: '2024-01-15T20:00' },
    parameters: 'Temperature',
    reference: { type: 'file', name: 'ref_jan2024.txt' },
    stablePeriods: 4,
    status: 'pass',
  },
  {
    id: 'cal002',
    name: 'Lab 201 — Annual Temp Mapping',
    devices: ['s009', 's010', 's011'],
    timePeriod: { from: '2024-04-10T09:00', to: '2024-04-10T17:00' },
    parameters: 'Both',
    reference: { type: 'file', name: 'rotronic.XLS' },
    stablePeriods: 0,
    status: 'pass',
  },
]

function AlertToast({ message, onClose }) {
  if (!message) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4 bg-white border border-surface-200 rounded-xl px-5 py-4 shadow-card-lg">
        <CheckCircle size={16} className="text-brand-500 flex-shrink-0" />
        <span className="text-sm text-surface-700">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 px-3 py-1 rounded-lg border border-surface-300 text-xs text-surface-600 hover:bg-surface-50 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}

export default function Calibration() {
  const { role } = useRole()

  // Guard: only admin and cal_engineer can access this page
  if (!role.features.showCalibration) {
    return (
      <div className="card p-12 text-center">
        <FlaskConical size={32} className="text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 text-sm">
          Calibration management is not available for your role.
        </p>
      </div>
    )
  }

  const [sessionName,     setSessionName]     = useState('')
  const [deviceSearch,    setDeviceSearch]    = useState('')
  const [selectedDevices, setSelectedDevices] = useState([])
  const [dateFrom,        setDateFrom]        = useState('')
  const [timeFrom,        setTimeFrom]        = useState('')
  const [dateTo,          setDateTo]          = useState('')
  const [timeTo,          setTimeTo]          = useState('')
  const [parameters,      setParameters]      = useState('temperature')
  const [refSource,       setRefSource]       = useState('file')
  const [parserType,      setParserType]      = useState('accumac_txt')
  const [parsedFile,      setParsedFile]      = useState(null)
  const [tempChannel,     setTempChannel]     = useState('')
  const [humidChannel,    setHumidChannel]    = useState('')
  const [notes,           setNotes]           = useState('')
  const [alertMsg,        setAlertMsg]        = useState('')
  const [sessions,        setSessions]        = useState(INITIAL_SESSIONS)
  const fileInputRef = useRef()

  const filteredDevices = allSensors.filter(s =>
    s.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    s.id.toLowerCase().includes(deviceSearch.toLowerCase()),
  )

  function toggleDevice(id) {
    setSelectedDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id],
    )
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      const result = parseFileContent(evt.target.result, file.name)
      setParsedFile(result)
      setTempChannel('')
      setHumidChannel('')
      setAlertMsg(
        `File uploaded! Found ${result.channels.length} channels with ${result.dataPoints} data point${result.dataPoints !== 1 ? 's' : ''}.`,
      )
    }
    reader.readAsText(file)
  }

  function handleCreate() {
    if (!sessionName.trim()) { setAlertMsg('Please enter a session name.'); return }
    if (selectedDevices.length === 0) { setAlertMsg('Please select at least one device.'); return }

    const newSession = {
      id: `cal${Date.now()}`,
      name: sessionName.trim(),
      devices: selectedDevices,
      timePeriod: {
        from: dateFrom ? `${dateFrom}T${timeFrom || '00:00'}` : '',
        to:   dateTo   ? `${dateTo}T${timeTo || '00:00'}` : '',
      },
      parameters: parameters === 'temperature' ? 'Temperature' :
                  parameters === 'humidity'    ? 'Humidity' : 'Both',
      reference: {
        type: refSource,
        name: parsedFile?.fileName || refSource,
      },
      stablePeriods: 0,
      status: 'pending',
    }
    setSessions(prev => [newSession, ...prev])
    // Reset form
    setSessionName(''); setSelectedDevices([]); setDateFrom(''); setTimeFrom('')
    setDateTo(''); setTimeTo(''); setParsedFile(null); setNotes('')
    setAlertMsg('Calibration session created successfully.')
  }

  function handleDelete(id) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const showTempChannel  = parameters === 'temperature' || parameters === 'both'
  const showHumidChannel = parameters === 'humidity'    || parameters === 'both'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calibration"
        subtitle="Manage calibration sessions and reference data"
      />

      {/* Create session form */}
      <div className="card p-6 space-y-5">
        <h2 className="section-header">New Calibration Session</h2>

        {/* Session name */}
        <div>
          <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
            Session Name
          </label>
          <input
            className="input w-full"
            placeholder="e.g. Q2 2024 — Fridge Unit A1"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
          />
        </div>

        {/* Device selection */}
        <div>
          <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
            Devices
          </label>
          <div className="relative mb-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              className="input pl-8 w-full"
              placeholder="Search sensors…"
              value={deviceSearch}
              onChange={e => setDeviceSearch(e.target.value)}
            />
          </div>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-surface-200 divide-y divide-surface-100">
            {filteredDevices.map(s => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(s.id)}
                  onChange={() => toggleDevice(s.id)}
                  className="accent-brand-500 w-3.5 h-3.5"
                />
                <span className="text-xs font-medium text-surface-700">{s.name}</span>
                <span className="text-xs text-surface-400 font-mono ml-auto">{s.id}</span>
              </label>
            ))}
          </div>
          {selectedDevices.length > 0 && (
            <p className="text-xs text-brand-600 mt-1.5 font-medium">
              {selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Date/time range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
              Start
            </label>
            <div className="space-y-2">
              <input type="date" className="input w-full" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <input
                type="text" className="input w-full font-mono"
                placeholder="e.g. 9:00 am"
                value={timeFrom}
                onChange={e => setTimeFrom(normalizeTimeInput(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
              End
            </label>
            <div className="space-y-2">
              <input type="date" className="input w-full" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              <input
                type="text" className="input w-full font-mono"
                placeholder="e.g. 5:00 pm"
                value={timeTo}
                onChange={e => setTimeTo(normalizeTimeInput(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div>
          <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
            Parameters
          </label>
          <div className="flex gap-2">
            {[
              { value: 'temperature', label: 'Temperature' },
              { value: 'humidity',    label: 'Humidity' },
              { value: 'both',        label: 'Both' },
            ].map(p => (
              <button
                key={p.value}
                onClick={() => setParameters(p.value)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-semibold transition-all border',
                  parameters === p.value
                    ? 'bg-brand-50 text-brand-700 border-brand-300'
                    : 'text-surface-500 border-surface-300 hover:border-surface-400',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference source */}
        <div className="card-inner p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-surface-700">Reference Source</p>
            <div className="flex gap-1">
              {[
                { value: 'file',   label: 'Upload file' },
                { value: 'manual', label: 'Manual entry' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRefSource(opt.value)}
                  className={clsx(
                    'px-3 py-1 rounded text-xs font-medium transition-all',
                    refSource === opt.value
                      ? 'bg-white border border-surface-300 text-surface-700 shadow-sm'
                      : 'text-surface-400 hover:text-surface-600',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {refSource === 'file' && (
            <>
              <div>
                <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
                  Parser Type
                </label>
                <select className="select w-full" value={parserType} onChange={e => setParserType(e.target.value)}>
                  {PARSER_TYPES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
                  Select File
                </label>
                <div className="flex items-center gap-2">
                  <label className="btn-ghost cursor-pointer text-xs py-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.csv,.xls,.xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    Choose File
                  </label>
                  <span className="text-xs text-surface-500">
                    {parsedFile ? parsedFile.fileName : 'No file chosen'}
                  </span>
                </div>
              </div>
              {parsedFile && (
                <div className="bg-surface-50 border border-surface-200 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p className="text-surface-500">File: <span className="text-surface-800">{parsedFile.fileName}</span></p>
                  <p className="text-surface-500">Data points: <span className="text-surface-800">{parsedFile.dataPoints}</span></p>
                  <p className="text-surface-500">Channels: <span className="text-surface-800">{parsedFile.channels.join(', ')}</span></p>
                </div>
              )}
            </>
          )}

          {refSource === 'manual' && (
            <input
              className="input w-full"
              placeholder="Reference device name or ID…"
            />
          )}
        </div>

        {/* Channel selection */}
        {parsedFile && (
          <div className="card-inner p-4 space-y-3">
            <p className="text-sm font-semibold text-surface-700">Select Reference Channels</p>
            {showTempChannel && (
              <div>
                <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
                  Temperature Channel
                </label>
                <select className="select w-full" value={tempChannel} onChange={e => setTempChannel(e.target.value)}>
                  <option value="">Select temperature channel…</option>
                  {parsedFile.channels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
            )}
            {showHumidChannel && (
              <div>
                <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
                  Humidity Channel
                </label>
                <select className="select w-full" value={humidChannel} onChange={e => setHumidChannel(e.target.value)}>
                  <option value="">Select humidity channel…</option>
                  {parsedFile.channels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs text-surface-500 uppercase tracking-wider font-medium block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            className="input w-full resize-none"
            rows={3}
            placeholder="Add any notes about this calibration session…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button onClick={handleCreate} className="btn-primary w-full justify-center py-3">
          <FlaskConical size={15} />
          Create Calibration Session
        </button>
      </div>

      {/* Sessions table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <h2 className="section-header">Calibration Sessions</h2>
          <span className="text-xs text-surface-400">{sessions.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                {['Name', 'Devices', 'Time Period', 'Parameters', 'Reference', 'Stable Periods', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-surface-500 font-semibold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-surface-400">
                    No calibration sessions yet. Create one above.
                  </td>
                </tr>
              ) : (
                sessions.map(sess => {
                  const deviceNames = sess.devices.map(id => sensors[id]?.name || id)
                  return (
                    <tr key={sess.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-surface-800 text-sm">{sess.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-surface-500 font-mono">{deviceNames.join(', ')}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-surface-500 font-mono whitespace-nowrap">
                        <div>{sess.timePeriod.from ? format(new Date(sess.timePeriod.from), 'MMM d, yyyy HH:mm') : '—'}</div>
                        <div className="text-surface-300">to</div>
                        <div>{sess.timePeriod.to ? format(new Date(sess.timePeriod.to), 'MMM d, yyyy HH:mm') : '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge bg-surface-100 text-surface-600 border border-surface-200 text-xs">
                          {sess.parameters}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-medium text-surface-700">
                          {sess.reference.type === 'file' ? 'File' : sess.reference.type}
                        </div>
                        <div className="font-mono text-surface-400 truncate max-w-[140px]">
                          {sess.reference.name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={clsx(
                          'badge text-xs',
                          sess.stablePeriods > 0
                            ? 'bg-brand-50 text-brand-700 border border-brand-200'
                            : 'bg-surface-100 text-surface-500 border border-surface-200',
                        )}>
                          {sess.stablePeriods} period{sess.stablePeriods !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button className="btn-ghost text-xs py-1.5 px-3">
                            <Eye size={12} /> View/Edit
                          </button>
                          <button className="btn-ghost text-xs py-1.5 px-3">
                            <Download size={12} /> Export
                          </button>
                          <button
                            onClick={() => handleDelete(sess.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertToast message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  )
}
