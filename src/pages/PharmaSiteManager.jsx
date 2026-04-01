import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, ChevronRight, ChevronDown, Plus, Settings,
  Thermometer, Droplets, AlertTriangle, Wifi, WifiOff,
  Pencil, Trash2, Check, X, Move, Bell, BellOff,
  Package, FlaskConical, Truck, Warehouse, Box,
} from 'lucide-react'
import {
  sites, floors, rooms, sensors, alerts,
  ROOM_TYPES, getSiteForCustomer, getFloorsForSite,
  getRoomsForFloor, getRoomStatus, getAlertsForRoom,
  getUnassignedSensors,
} from '../data/mockData'
import { StatusBadge } from '../components/ui'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOM_ICONS = {
  cold_storage: '🧊',
  ambient:      '🌡️',
  fleet:        '🚚',
  lab:          '🔬',
  warehouse:    '🏭',
  other:        '📦',
}

function roomTypeLabel(type) {
  return ROOM_TYPES.find(r => r.value === type)?.label || type
}

function statusColor(status) {
  if (status === 'online')      return { bar: 'bg-brand-500', bg: 'bg-brand-50',  border: 'border-brand-200',  text: 'text-brand-700' }
  if (status === 'warning')     return { bar: 'bg-amber-400', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700' }
  if (status === 'offline')     return { bar: 'bg-red-500',   bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700' }
  return { bar: 'bg-surface-300', bg: 'bg-surface-50', border: 'border-surface-200', text: 'text-surface-500' }
}

// ─── Inline editable label ────────────────────────────────────────────────────
function EditableLabel({ value, onSave, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    if (draft.trim()) onSave(draft.trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className="border border-brand-400 rounded px-1.5 py-0.5 text-sm outline-none focus:ring-2 focus:ring-brand-400/20 bg-white"
          style={{ width: Math.max(draft.length * 8 + 24, 80) }}
        />
        <button onClick={commit} className="p-0.5 rounded text-brand-600 hover:bg-brand-50"><Check size={12} /></button>
        <button onClick={() => setEditing(false)} className="p-0.5 rounded text-surface-400 hover:bg-surface-100"><X size={12} /></button>
      </span>
    )
  }

  return (
    <span
      className={clsx('group inline-flex items-center gap-1.5 cursor-pointer', className)}
      onClick={() => { setDraft(value); setEditing(true) }}
    >
      {value}
      <Pencil size={11} className="opacity-0 group-hover:opacity-40 transition-opacity text-surface-400" />
    </span>
  )
}

// ─── Threshold Editor ─────────────────────────────────────────────────────────
function ThresholdEditor({ thresholds, onSave, onClose }) {
  const [vals, setVals] = useState({ ...thresholds })
  const set = (key, v) => setVals(p => ({ ...p, [key]: parseFloat(v) || 0 }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg border border-surface-200 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h3 className="font-display font-semibold text-surface-800">Alert Thresholds</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Thermometer size={12} /> Temperature (°C)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-surface-400 block mb-1">Min</label>
                <input type="number" step="0.5" value={vals.tempMin} onChange={e => set('tempMin', e.target.value)}
                  className="input w-full text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-surface-400 block mb-1">Max</label>
                <input type="number" step="0.5" value={vals.tempMax} onChange={e => set('tempMax', e.target.value)}
                  className="input w-full text-sm font-mono" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Droplets size={12} /> Humidity (%)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-surface-400 block mb-1">Min</label>
                <input type="number" step="1" value={vals.humidMin} onChange={e => set('humidMin', e.target.value)}
                  className="input w-full text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-surface-400 block mb-1">Max</label>
                <input type="number" step="1" value={vals.humidMax} onChange={e => set('humidMax', e.target.value)}
                  className="input w-full text-sm font-mono" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 bg-surface-50 rounded-lg px-3 py-2 border border-surface-200">
            <Thermometer size={12} className="text-surface-400" />
            <span className="text-xs text-surface-500">
              Alerts fire when readings leave {vals.tempMin}–{vals.tempMax}°C / {vals.humidMin}–{vals.humidMax}%
            </span>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">Cancel</button>
          <button onClick={() => { onSave(vals); onClose() }} className="btn-primary flex-1 justify-center text-xs">Save Thresholds</button>
        </div>
      </div>
    </div>
  )
}

// ─── Device Assignment Panel ──────────────────────────────────────────────────
function DeviceAssignPanel({ room, siteId, onAssign, onUnassign, onClose }) {
  const unassigned = getUnassignedSensors(siteId)
  const assigned   = room.assignedSensorIds.map(id => sensors[id]).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg border border-surface-200 w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <div>
            <h3 className="font-display font-semibold text-surface-800">Assign Devices</h3>
            <p className="text-xs text-surface-400 mt-0.5">{room.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Currently assigned */}
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
              Assigned to this room ({assigned.length})
            </p>
            {assigned.length === 0 ? (
              <p className="text-xs text-surface-400 italic">No devices assigned yet</p>
            ) : (
              <div className="space-y-1.5">
                {assigned.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-brand-50 border border-brand-200">
                    <span className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                      s.status === 'online' ? 'bg-brand-500' :
                      s.status === 'warning' ? 'bg-amber-400' : 'bg-surface-300'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-800">{s.name}</p>
                      <p className="text-xs text-surface-400 font-mono">{s.type === 'EM320' ? 'Milesight EM320-TH' : 'Teltonika Eye'}</p>
                    </div>
                    <button
                      onClick={() => onUnassign(s.id)}
                      className="p-1 rounded hover:bg-red-50 text-surface-300 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned pool */}
          <div>
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
              Available devices ({unassigned.length})
            </p>
            {unassigned.length === 0 ? (
              <p className="text-xs text-surface-400 italic">All provisioned devices are assigned</p>
            ) : (
              <div className="space-y-1.5">
                {unassigned.map(s => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-50 border border-surface-200 hover:border-brand-200 transition-colors">
                    <span className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                      s.status === 'online' ? 'bg-brand-500' :
                      s.status === 'warning' ? 'bg-amber-400' : 'bg-surface-300'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-surface-800">{s.name}</p>
                      <p className="text-xs text-surface-400 font-mono">{s.type === 'EM320' ? 'Milesight EM320-TH' : 'Teltonika Eye'}</p>
                    </div>
                    <button
                      onClick={() => onAssign(s.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500 text-white text-xs font-medium hover:bg-brand-600 transition-colors"
                    >
                      <Plus size={11} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="px-5 pb-5 pt-2 border-t border-surface-100">
          <button onClick={onClose} className="btn-primary w-full justify-center text-sm">Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── Add Room / Floor Modal ───────────────────────────────────────────────────
function AddRoomModal({ floorName, onAdd, onClose }) {
  const [name, setName]   = useState('')
  const [type, setType]   = useState('ambient')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg border border-surface-200 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <div>
            <h3 className="font-display font-semibold text-surface-800">Add Room</h3>
            <p className="text-xs text-surface-400 mt-0.5">on {floorName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-surface-500 uppercase tracking-wider block mb-1.5 font-medium">Room Name</label>
            <input
              autoFocus
              className="input w-full"
              placeholder="e.g. Cold Storage Room B"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim(), type); onClose() }}}
            />
          </div>
          <div>
            <label className="text-xs text-surface-500 uppercase tracking-wider block mb-1.5 font-medium">Room Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {ROOM_TYPES.map(rt => (
                <button
                  key={rt.value}
                  onClick={() => setType(rt.value)}
                  className={clsx(
                    'flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs border transition-all',
                    type === rt.value
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-medium'
                      : 'border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50'
                  )}
                >
                  <span className="text-base">{rt.icon}</span>
                  <span className="leading-tight text-center">{rt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => { onAdd(name.trim(), type); onClose() }}
            className="btn-primary flex-1 justify-center text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add Room
          </button>
        </div>
      </div>
    </div>
  )
}

function AddFloorModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg border border-surface-200 w-full max-w-xs mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h3 className="font-display font-semibold text-surface-800">Add Floor</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>
        <div className="p-5">
          <label className="text-xs text-surface-500 uppercase tracking-wider block mb-1.5 font-medium">Floor Name</label>
          <input
            autoFocus
            className="input w-full"
            placeholder="e.g. Level 3, Basement 1"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose() }}}
          />
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn-ghost flex-1 justify-center text-xs">Cancel</button>
          <button
            disabled={!name.trim()}
            onClick={() => { onAdd(name.trim()); onClose() }}
            className="btn-primary flex-1 justify-center text-xs disabled:opacity-40"
          >
            Add Floor
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Room Card ────────────────────────────────────────────────────────────────
function RoomCard({ room, siteId, onUpdateName, onUpdateThresholds, onToggleAlerts, onAssign, onUnassign, onDelete, onNavigate }) {
  const [showThresholds,  setShowThresholds]  = useState(false)
  const [showAssign,      setShowAssign]      = useState(false)
  const [expanded,        setExpanded]        = useState(false)

  const status       = getRoomStatus(room)
  const roomAlerts   = getAlertsForRoom(room.id)
  const roomSensors  = room.assignedSensorIds.map(id => sensors[id]).filter(Boolean)
  const col          = statusColor(status)
  const th           = room.thresholdOverrides

  return (
    <>
      <div className={clsx(
        'rounded-xl border transition-all overflow-hidden',
        col.border, col.bg,
      )}>
        {/* Room header */}
        <div className="px-4 py-3 flex items-center gap-3">
          <span className="text-lg leading-none flex-shrink-0">{ROOM_ICONS[room.type] || '📦'}</span>
          <div className="flex-1 min-w-0">
            <EditableLabel
              value={room.name}
              onSave={onUpdateName}
              className={clsx('font-semibold text-sm', col.text)}
            />
            <p className="text-xs text-surface-400 mt-0.5">{roomTypeLabel(room.type)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {roomAlerts.length > 0 && (
              <span className="badge bg-red-50 text-red-600 border border-red-200 text-xs">
                {roomAlerts.length}
              </span>
            )}
            <StatusBadge status={status === 'unmonitored' ? 'offline' : status} />
          </div>
        </div>

        {/* Live readings strip */}
        {roomSensors.length > 0 && (
          <div className="px-4 pb-3 flex items-center gap-3 flex-wrap">
            {roomSensors.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-1.5 border border-white/80">
                <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0',
                  s.status === 'online' ? 'bg-brand-500 pulse-dot' :
                  s.status === 'warning' ? 'bg-amber-400 pulse-dot' : 'bg-surface-300'
                )} />
                <span className="text-xs text-surface-500 font-mono truncate max-w-[80px]">{s.name}</span>
                {s.latestReading?.temperature != null && (
                  <span className="text-xs font-mono font-semibold text-surface-800">
                    {s.latestReading.temperature}°C
                  </span>
                )}
              </div>
            ))}
            {room.assignedSensorIds.length === 0 && (
              <span className="text-xs text-surface-400 italic">No devices assigned</span>
            )}
          </div>
        )}

        {/* Threshold bar */}
        <div className="mx-4 mb-3 px-3 py-2 rounded-lg bg-white/60 border border-white/80 flex items-center gap-3 text-xs text-surface-500">
          <Thermometer size={11} />
          <span className="font-mono">{th.tempMin}–{th.tempMax}°C</span>
          <span className="text-surface-300">·</span>
          <Droplets size={11} />
          <span className="font-mono">{th.humidMin}–{th.humidMax}%</span>
          <button
            onClick={() => setShowThresholds(true)}
            className="ml-auto text-brand-600 hover:text-brand-700 flex items-center gap-0.5 transition-colors"
          >
            <Pencil size={10} /> Edit
          </button>
        </div>

        {/* Actions row */}
        <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowAssign(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-surface-200 text-surface-600 hover:border-brand-300 hover:text-brand-600 transition-all"
          >
            <Move size={11} /> Manage Devices
          </button>
          <button
            onClick={onToggleAlerts}
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
              room.alertsEnabled
                ? 'bg-white border-surface-200 text-surface-600 hover:border-amber-300 hover:text-amber-600'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            )}
          >
            {room.alertsEnabled ? <Bell size={11} /> : <BellOff size={11} />}
            {room.alertsEnabled ? 'Alerts On' : 'Alerts Off'}
          </button>
          {roomAlerts.length > 0 && (
            <button
              onClick={() => onNavigate(`/alerts`)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all"
            >
              <AlertTriangle size={11} /> {roomAlerts.length} Alert{roomAlerts.length > 1 ? 's' : ''}
            </button>
          )}
          <button
            onClick={onDelete}
            className="ml-auto p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete room"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {showThresholds && (
        <ThresholdEditor
          thresholds={room.thresholdOverrides}
          onSave={onUpdateThresholds}
          onClose={() => setShowThresholds(false)}
        />
      )}
      {showAssign && (
        <DeviceAssignPanel
          room={room}
          siteId={siteId}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onClose={() => setShowAssign(false)}
        />
      )}
    </>
  )
}

// ─── Floor Section ────────────────────────────────────────────────────────────
function FloorSection({ floor, siteId, roomsState, onAddRoom, onDeleteFloor, onRenameFloor, onRoomUpdate, onNavigate }) {
  const [expanded,    setExpanded]    = useState(true)
  const [showAddRoom, setShowAddRoom] = useState(false)

  const floorRooms = floor.roomIds.map(id => roomsState[id]).filter(Boolean)
  const totalSensors = floorRooms.flatMap(r => r.assignedSensorIds).length
  const hasAlerts = floorRooms.some(r => getAlertsForRoom(r.id).length > 0)

  return (
    <div className="mb-6">
      {/* Floor header */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 group"
        >
          <ChevronDown size={15} className={clsx('text-surface-400 transition-transform flex-shrink-0', !expanded && '-rotate-90')} />
          <div className="h-px flex-shrink-0 w-4 bg-surface-300 rounded" />
          <EditableLabel
            value={floor.name}
            onSave={name => onRenameFloor(floor.id, name)}
            className="font-display font-bold text-surface-700 text-sm"
          />
          <span className="text-xs text-surface-400 font-mono ml-1">
            {floorRooms.length} room{floorRooms.length !== 1 ? 's' : ''} · {totalSensors} device{totalSensors !== 1 ? 's' : ''}
          </span>
          {hasAlerts && (
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          )}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddRoom(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors"
          >
            <Plus size={11} /> Add Room
          </button>
          <button
            onClick={() => onDeleteFloor(floor.id)}
            className="p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Delete floor"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {floorRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              siteId={siteId}
              onUpdateName={name => onRoomUpdate(room.id, { name })}
              onUpdateThresholds={th => onRoomUpdate(room.id, { thresholdOverrides: th })}
              onToggleAlerts={() => onRoomUpdate(room.id, { alertsEnabled: !room.alertsEnabled })}
              onAssign={sensorId => onRoomUpdate(room.id, { assignedSensorIds: [...room.assignedSensorIds, sensorId] })}
              onUnassign={sensorId => onRoomUpdate(room.id, { assignedSensorIds: room.assignedSensorIds.filter(id => id !== sensorId) })}
              onDelete={() => onRoomUpdate(room.id, null)}
              onNavigate={onNavigate}
            />
          ))}
          {floorRooms.length === 0 && (
            <button
              onClick={() => setShowAddRoom(true)}
              className="col-span-full flex items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-surface-200 text-sm text-surface-400 hover:border-brand-300 hover:text-brand-500 transition-all"
            >
              <Plus size={16} /> Add your first room on this floor
            </button>
          )}
        </div>
      )}

      {showAddRoom && (
        <AddRoomModal
          floorName={floor.name}
          onAdd={(name, type) => onAddRoom(floor.id, name, type)}
          onClose={() => setShowAddRoom(false)}
        />
      )}
    </div>
  )
}

// ─── Unassigned Devices Banner ────────────────────────────────────────────────
function UnassignedBanner({ siteId }) {
  const unassigned = getUnassignedSensors(siteId)
  if (!unassigned.length) return null
  return (
    <div className="card p-4 border-amber-200 bg-amber-50 flex items-start gap-3">
      <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">
          {unassigned.length} device{unassigned.length > 1 ? 's' : ''} not yet assigned to a room
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          {unassigned.map(s => s.name).join(', ')} — use "Manage Devices" on a room to assign them.
        </p>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function PharmaSiteManager({ customerId }) {
  const navigate = useNavigate()

  // ── Local state mirrors (so changes feel instant without a real backend) ──
  const [floorsState, setFloorsState] = useState(() => ({ ...floors }))
  const [roomsState,  setRoomsState]  = useState(() => ({ ...rooms }))
  const [sitesState,  setSitesState]  = useState(() => ({ ...sites }))
  const [showAddFloor, setShowAddFloor] = useState(false)

  const site = Object.values(sitesState).find(s => s.customerId === customerId)

  if (!site) {
    return (
      <div className="card p-12 text-center">
        <Building2 size={32} className="text-surface-300 mx-auto mb-3" />
        <p className="text-surface-500 text-sm">No site configured yet. Contact Asia GMP to provision your site.</p>
      </div>
    )
  }

  const siteFloors = (site.floorIds || []).map(id => floorsState[id]).filter(Boolean)

  // ── Floor CRUD ──
  function addFloor(name) {
    const id = `fl_${Date.now()}`
    setFloorsState(p => ({ ...p, [id]: { id, siteId: site.id, name, level: siteFloors.length + 1, roomIds: [] } }))
    setSitesState(p => ({ ...p, [site.id]: { ...p[site.id], floorIds: [...p[site.id].floorIds, id] } }))
  }

  function deleteFloor(floorId) {
    if (!confirm('Delete this floor and all its rooms?')) return
    // Remove rooms
    const fl = floorsState[floorId]
    if (fl) setRoomsState(p => { const next = { ...p }; fl.roomIds.forEach(rid => delete next[rid]); return next })
    setFloorsState(p => { const next = { ...p }; delete next[floorId]; return next })
    setSitesState(p => ({ ...p, [site.id]: { ...p[site.id], floorIds: p[site.id].floorIds.filter(id => id !== floorId) } }))
  }

  function renameFloor(floorId, name) {
    setFloorsState(p => ({ ...p, [floorId]: { ...p[floorId], name } }))
  }

  // ── Room CRUD ──
  function addRoom(floorId, name, type) {
    const id = `rm_${Date.now()}`
    const newRoom = {
      id, floorId, name, type,
      assignedSensorIds: [],
      thresholdOverrides: { tempMin: 15, tempMax: 30, humidMin: 30, humidMax: 70 },
      alertsEnabled: true,
    }
    setRoomsState(p => ({ ...p, [id]: newRoom }))
    setFloorsState(p => ({ ...p, [floorId]: { ...p[floorId], roomIds: [...p[floorId].roomIds, id] } }))
  }

  function updateRoom(roomId, patch) {
    if (patch === null) {
      // Delete
      if (!confirm('Delete this room?')) return
      const room = roomsState[roomId]
      setRoomsState(p => { const next = { ...p }; delete next[roomId]; return next })
      setFloorsState(p => ({
        ...p,
        [room.floorId]: { ...p[room.floorId], roomIds: p[room.floorId].roomIds.filter(id => id !== roomId) }
      }))
    } else {
      setRoomsState(p => ({ ...p, [roomId]: { ...p[roomId], ...patch } }))
    }
  }

  // ── Summary counts ──
  const allRooms    = siteFloors.flatMap(f => (f.roomIds || []).map(id => roomsState[id]).filter(Boolean))
  const totalDevices = allRooms.flatMap(r => r.assignedSensorIds).length
  const activeAlerts = allRooms.flatMap(r => getAlertsForRoom(r.id)).length
  const onlineRooms  = allRooms.filter(r => getRoomStatus(r) === 'online').length
  const warnRooms    = allRooms.filter(r => ['warning', 'offline'].includes(getRoomStatus(r))).length

  return (
    <div className="space-y-5">
      {/* Site header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-brand-600" />
            </div>
            <div>
              <h2 className="font-display font-bold text-surface-800 text-lg">{site.name}</h2>
              <p className="text-xs text-surface-400 mt-0.5">{site.address}</p>
            </div>
          </div>
          {/* Summary pills */}
          <div className="flex items-center gap-4 flex-shrink-0 flex-wrap justify-end">
            {[
              { label: 'Floors',   value: siteFloors.length,  cls: 'text-surface-700' },
              { label: 'Rooms',    value: allRooms.length,    cls: 'text-surface-700' },
              { label: 'Devices',  value: totalDevices,       cls: 'text-brand-600' },
              { label: 'Alerts',   value: activeAlerts,       cls: activeAlerts > 0 ? 'text-amber-600' : 'text-surface-400' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={clsx('text-xl font-display font-bold', s.cls)}>{s.value}</div>
                <div className="text-xs text-surface-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unassigned devices warning */}
      <UnassignedBanner siteId={site.id} />

      {/* Floors + rooms */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-header">Floors & Rooms</h3>
          <button
            onClick={() => setShowAddFloor(true)}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            <Plus size={13} /> Add Floor
          </button>
        </div>

        {siteFloors.length === 0 ? (
          <button
            onClick={() => setShowAddFloor(true)}
            className="w-full flex items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-surface-200 text-sm text-surface-400 hover:border-brand-300 hover:text-brand-500 transition-all"
          >
            <Plus size={16} /> Add your first floor
          </button>
        ) : (
          siteFloors.map(floor => (
            <FloorSection
              key={floor.id}
              floor={floor}
              siteId={site.id}
              roomsState={roomsState}
              onAddRoom={addRoom}
              onDeleteFloor={deleteFloor}
              onRenameFloor={renameFloor}
              onRoomUpdate={updateRoom}
              onNavigate={navigate}
            />
          ))
        )}
      </div>

      {showAddFloor && (
        <AddFloorModal onAdd={addFloor} onClose={() => setShowAddFloor(false)} />
      )}
    </div>
  )
}
