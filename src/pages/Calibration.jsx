import React, { useState, useRef } from 'react'
import {
  FlaskConical, CheckCircle, Eye,
  Download, Trash2, Search, CalendarDays, Clock3,
} from 'lucide-react'
import { sensors } from '../data/mockData'
import { PageHeader } from '../components/ui'
import { format } from 'date-fns'
import clsx from 'clsx'

// ─── Parser types ─────────────────────────────────────────────────────────────
const PARSER_TYPES = [
  { value: 'accumac_txt', label: 'AccuMac (TXT)' },
  { value: 'rotronic_xls', label: 'Rotronic (XLS)' },
  { value: 'testo_csv', label: 'Testo (CSV)' },
  { value: 'generic_csv', label: 'Generic CSV' },
  { value: 'fluke_txt', label: 'Fluke (TXT)' },
]

// ─── Real file parser ─────────────────────────────────────────────────────────
function parseFileContent(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return { channels: [], dataPoints: 0, fileName }

  let headerLine = null
  let dataLines = []

  for (let i = 0; i < lines.length; i++) {
    const tokens = lines[i].split(/\s+|,|;|\t/).filter(Boolean)
    const firstToken = tokens[0]
    const looksLikeData = /^[\d+\-]/.test(firstToken) && tokens.length > 1
    if (!looksLikeData && headerLine === null) {
      headerLine = tokens
    } else if (looksLikeData) {
      dataLines.push(tokens)
    }
  }

  if (!headerLine && dataLines.length > 0) {
    headerLine = dataLines[0].map((_, i) => i === 0 ? 'Time' : `Col${i}`)
  }

  const channels = headerLine
    ? headerLine.filter((_, i) =>
        i > 0 || !/time|date|timestamp/i.test(headerLine[0]) ? true : i !== 0
      )
    : []

  const dataChannels = channels.filter(ch => !/^(time|date|timestamp)$/i.test(ch))

  return { channels: dataChannels, dataPoints: dataLines.length, fileName }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeTimeInput(value) {
  let v = value.toLowerCase().replace(/[^0-9apm:\s]/g, '').trim()

  // 1, 12, 1230, 1230p, 12:30 pm, etc.
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

// ─── All sensors flat list ────────────────────────────────────────────────────
const allSensors = Object.values(sensors)

// ─── Initial sessions ─────────────────────────────────────────────────────────
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

// ─── Alert toast ──────────────────────────────────────────────────────────────
function AlertModal({ message, onClose }) {
  if (!message) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-4 bg-surface-700 border border-surface-400 rounded-xl px-5 py-4 shadow-2xl">
        <CheckCircle size={16} className="text-brand-400 flex-shrink-0" />
        <span className="text-sm text-slate-200">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 px-3 py-1 rounded-lg border border-surface-400 text-xs text-slate-300 hover:bg-surface-600 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}

// ─── Date Input with white custom icon ───────────────────────────────────────
function DateField({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="date"
        className="input pr-10 w-full"
        value={value}
        onChange={onChange}
      />
      <CalendarDays
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90 pointer-events-none"
      />
    </div>
  )
}

// ─── Time Text Input ──────────────────────────────────────────────────────────
function TimeField({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="input w-full font-mono"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(normalizeTimeInput(e.target.value))}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Calibration() {
  const [sessionName, setSessionName] = useState('')
  const [deviceSearch, setDeviceSearch] = useState('')
  const [selectedDevices, setSelectedDevices] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [timeTo, setTimeTo] = useState('')
  const [parameters, setParameters] = useState('temperature')
  const [refSource, setRefSource] = useState('file')
  const [parserType, setParserType] = useState('accumac_txt')
  const [parsedFile, setParsedFile] = useState(null)
  const [tempChannel, setTempChannel] = useState('')
  const [humidChannel, setHumidChannel] = useState('')
  const [notes, setNotes] = useState('')
  const [alertMsg, setAlertMsg] = useState('')
  const [sessions, setSessions] = useState(INITIAL_SESSIONS)
  const fileInputRef = useRef()

  const filteredDevices = allSensors.filter(s =>
    s.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    s.id.toLowerCase().includes(deviceSearch.toLowerCase())
  )

  function toggleDevice(id) {
    setSelectedDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  function selectAllDevices() {
    setSelectedDevices(filteredDevices.map(s => s.id))
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
        `File uploaded successfully! Found ${result.channels.length} channels with ${result.dataPoints} data point${result.dataPoints !== 1 ? 's' : ''}.`
      )
    }
    reader.readAsText(file)
  }

  function handleCreate() {
    if (!sessionName.trim()) {
      setAlertMsg('Please enter a session name.')
      return
    }
    if (selectedDevices.length === 0) {
      setAlertMsg('Please select at least one device.')
      return
    }

    const paramLabel =
      parameters === 'temperature'
        ? 'Temperature'
        : parameters === 'humidity'
          ? 'Humidity'
          : 'Both'

    const fromStr = dateFrom ? `${dateFrom}T${timeFrom || '12:00 am'}` : new Date().toISOString()
    const toStr = dateTo ? `${dateTo}T${timeTo || '11:59 pm'}` : new Date().toISOString()

    const newSession = {
      id: `cal_${Date.now()}`,
      name: sessionName.trim(),
      devices: selectedDevices,
      timePeriod: { from: fromStr, to: toStr },
      parameters: paramLabel,
      reference: parsedFile
        ? { type: 'file', name: parsedFile.fileName }
        : { type: refSource === 'thingsboard' ? 'ThingsBoard' : 'file', name: '—' },
      stablePeriods: Math.floor(Math.random() * 6),
      status: Math.random() > 0.3 ? 'pass' : 'fail',
    }

    setSessions(prev => [newSession, ...prev])
    setAlertMsg(`Calibration session "${newSession.name}" created successfully!`)

    setSessionName('')
    setSelectedDevices([])
    setDateFrom('')
    setTimeFrom('')
    setDateTo('')
    setTimeTo('')
    setParsedFile(null)
    setTempChannel('')
    setHumidChannel('')
    setNotes('')
  }

  function handleDelete(id) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const showTempChannel = parameters === 'temperature' || parameters === 'both'
  const showHumidChannel = parameters === 'humidity' || parameters === 'both'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calibration"
        subtitle="Create calibration sessions and compare sensor readings against reference standards"
      />

      <div className="card p-6 space-y-6">
        <h2 className="font-display text-lg font-700 text-slate-100">
          Create New Calibration Session
        </h2>

        {/* Session name */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Calibration Session Name
          </label>
          <input
            className="input w-full"
            placeholder="e.g., Truck A — January 2024"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
          />
        </div>

        {/* Device selection */}
        <div className="card-inner p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Select IoT Devices to Calibrate</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the devices you want to calibrate against the reference standard
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input pl-8 w-full"
                placeholder="Search devices..."
                value={deviceSearch}
                onChange={e => setDeviceSearch(e.target.value)}
              />
            </div>
            <button onClick={selectAllDevices} className="btn-ghost text-xs py-2">
              Select All
            </button>
          </div>

          <p className="text-xs text-slate-500">
            {selectedDevices.length} of {allSensors.length} devices selected
          </p>

          <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
            {filteredDevices.map(s => (
              <label
                key={s.id}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border',
                  selectedDevices.includes(s.id)
                    ? 'bg-brand-500/10 border-brand-500/30'
                    : 'border-surface-500 hover:bg-surface-600/50'
                )}
              >
                <input
                  type="checkbox"
                  className="accent-brand-500 w-4 h-4 flex-shrink-0"
                  checked={selectedDevices.includes(s.id)}
                  onChange={() => toggleDevice(s.id)}
                />
                <span className="text-sm text-slate-200 font-medium">{s.name}</span>
                <span className="text-xs text-slate-500 font-mono ml-auto">{s.id}</span>
              </label>
            ))}
          </div>

          {/* Date and time range */}
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-2">
              Select Date and Time Range
            </label>

            <div className="grid grid-cols-2 gap-4">
              {/* From */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-slate-500">From</p>
                <DateField value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <TimeField
                  value={timeFrom}
                  onChange={setTimeFrom}
                  placeholder="12:00 am"
                />
              </div>

              {/* To */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-slate-500">To</p>
                <DateField value={dateTo} onChange={e => setDateTo(e.target.value)} />
                <TimeField
                  value={timeTo}
                  onChange={setTimeTo}
                  placeholder="11:59 pm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calibration parameters */}
        <div>
          <p className="text-sm font-medium text-slate-200 mb-2">Calibration Parameters</p>
          <div className="flex flex-col gap-2">
            {[
              { value: 'temperature', label: 'Temperature Only' },
              { value: 'humidity', label: 'Humidity Only' },
              { value: 'both', label: 'Both Temperature & Humidity' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="parameters"
                  className="accent-brand-500 w-4 h-4"
                  checked={parameters === opt.value}
                  onChange={() => setParameters(opt.value)}
                />
                <span className="text-sm text-slate-300">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reference standard source */}
        <div className="card-inner p-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-200 mb-2">Reference Standard Source</p>
            <div className="flex flex-col gap-2">
              {[
                { value: 'file', label: 'Upload Reference Standard File' },
                { value: 'thingsboard', label: 'Use ThingsBoard Device' },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="refSource"
                    className="accent-brand-500 w-4 h-4"
                    checked={refSource === opt.value}
                    onChange={() => setRefSource(opt.value)}
                  />
                  <span className="text-sm text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {refSource === 'file' && (
            <>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                  Parser Type
                </label>
                <select
                  className="select w-full"
                  value={parserType}
                  onChange={e => {
                    setParserType(e.target.value)
                    setParsedFile(null)
                  }}
                >
                  {PARSER_TYPES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
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
                  <span className="text-xs text-slate-400">
                    {parsedFile ? parsedFile.fileName : 'No file chosen'}
                  </span>
                </div>
              </div>

              {parsedFile && (
                <div className="bg-surface-700 border border-surface-400 rounded-lg p-3 text-xs font-mono space-y-1">
                  <p className="text-slate-300">
                    File: <span className="text-slate-100">{parsedFile.fileName}</span>
                  </p>
                  <p className="text-slate-300">
                    Data points: <span className="text-slate-100">{parsedFile.dataPoints}</span>
                  </p>
                  <p className="text-slate-300">
                    Channels: <span className="text-slate-100">{parsedFile.channels.join(', ')}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Reference channel selection */}
        {parsedFile && (
          <div className="card-inner p-4 space-y-3">
            <p className="text-sm font-medium text-slate-200">Select Reference Channels</p>

            {showTempChannel && (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                  Temperature Reference Channel
                </label>
                <select
                  className="select w-full"
                  value={tempChannel}
                  onChange={e => setTempChannel(e.target.value)}
                >
                  <option value="">Select temperature channel...</option>
                  {parsedFile.channels.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
            )}

            {showHumidChannel && (
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
                  Humidity Reference Channel
                </label>
                <select
                  className="select w-full"
                  value={humidChannel}
                  onChange={e => setHumidChannel(e.target.value)}
                >
                  <option value="">Select humidity channel...</option>
                  {parsedFile.channels.map(ch => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Notes (optional)
          </label>
          <textarea
            className="input w-full resize-none"
            rows={3}
            placeholder="Add any notes about this calibration session..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button onClick={handleCreate} className="btn-primary w-full justify-center py-3">
          <FlaskConical size={15} />
          Create Calibration Session
        </button>
      </div>

      {/* Sessions Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-500 flex items-center justify-between">
          <h2 className="font-display text-sm font-700 uppercase tracking-widest text-slate-300">
            Calibration Sessions
          </h2>
          <span className="text-xs text-slate-500">{sessions.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-500">
                {['Name', 'Devices', 'Time Period', 'Parameters', 'Reference', 'Stable Periods', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-600">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-500">
                    No calibration sessions yet. Create one above.
                  </td>
                </tr>
              ) : (
                sessions.map(sess => {
                  const deviceNames = sess.devices.map(id => sensors[id]?.name || id)
                  return (
                    <tr key={sess.id} className="hover:bg-surface-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-200">{sess.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400 font-mono">
                          {deviceNames.join(', ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                        <div>
                          {sess.timePeriod.from ? format(new Date(sess.timePeriod.from), 'MMM d, yyyy HH:mm') : '—'}
                        </div>
                        <div className="text-slate-600">to</div>
                        <div>
                          {sess.timePeriod.to ? format(new Date(sess.timePeriod.to), 'MMM d, yyyy HH:mm') : '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge bg-surface-600 text-slate-300 border border-surface-400 text-xs">
                          {sess.parameters}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400">
                        <div className="text-slate-300 font-medium">
                          {sess.reference.type === 'file' ? 'File' : sess.reference.type}
                        </div>
                        <div className="font-mono text-slate-500 truncate max-w-[140px]">
                          {sess.reference.name}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={clsx(
                            'badge text-xs',
                            sess.stablePeriods > 0
                              ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                              : 'bg-surface-600 text-slate-500 border border-surface-400'
                          )}
                        >
                          {sess.stablePeriods} period{sess.stablePeriods !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button className="btn-ghost text-xs py-1.5 px-3">
                            <Eye size={12} />
                            View/Edit
                          </button>
                          <button className="btn-ghost text-xs py-1.5 px-3">
                            <Download size={12} />
                            Export
                          </button>
                          <button
                            onClick={() => handleDelete(sess.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-900/40 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
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

      <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  )
}