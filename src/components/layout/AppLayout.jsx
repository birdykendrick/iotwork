import React, { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Cpu, Wifi, AlertCircle, ChevronDown, Check,
} from 'lucide-react'
import { alerts, getActiveAlertCount, getSensorStatusCounts } from '../../data/mockData'
import { useRole } from '../../context/RoleContext'
import clsx from 'clsx'

// ─── Role Switcher Dropdown ───────────────────────────────────────────────────
function RoleSwitcher() {
  const { role, roleKey, setRoleKey, ROLES } = useRole()
  const [open, setOpen] = useState(false)
  const ref = useRef()

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
          'hover:shadow-sm',
          role.badgeCls,
        )}
      >
        {/* Prototype pill */}
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        <span className="hidden sm:inline text-surface-500 font-normal">Viewing as:</span>
        <span>{role.label}</span>
        <ChevronDown size={12} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-surface-200 rounded-xl shadow-card-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-surface-100">
            <p className="text-xs text-surface-400 uppercase tracking-wider font-medium">
              Prototype — Role Switcher
            </p>
          </div>

          {/* Role options */}
          <div className="p-1.5 space-y-0.5">
            {Object.values(ROLES).map(r => (
              <button
                key={r.key}
                onClick={() => { setRoleKey(r.key); setOpen(false) }}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                  roleKey === r.key
                    ? 'bg-surface-50 border border-surface-200'
                    : 'hover:bg-surface-50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm font-medium', r.color)}>{r.label}</p>
                  <p className="text-xs text-surface-400">{r.description}</p>
                </div>
                {roleKey === r.key && (
                  <Check size={14} className="text-brand-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-surface-100">
            <p className="text-xs text-surface-400">
              Real auth will be added later. This controls the UI view only.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── AppLayout ────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { role } = useRole()
  const [collapsed, setCollapsed] = useState(false)
  const alertCount = getActiveAlertCount()
  const { online, offline } = getSensorStatusCounts()

  // Bell nav item key to attach alert badge
  const isBellItem = (label) => label === 'Alerts & Events' || label === 'Alerts'

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">

      {/* ── Sidebar ── */}
      <aside className={clsx(
        'flex flex-col flex-shrink-0 bg-white border-r border-surface-200 transition-all duration-300 z-20 shadow-sm',
        collapsed ? 'w-16' : 'w-60',
      )}>

        {/* Logo */}
        <div className={clsx(
          'flex items-center h-14 border-b border-surface-200 flex-shrink-0',
          collapsed ? 'justify-center px-2' : 'gap-3 px-4',
        )}>
          {collapsed ? (
            /* Collapsed: just the toggle button, centred */
            <button
              onClick={() => setCollapsed(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
              title="Expand sidebar"
            >
              <div className="flex flex-col gap-[5px]">
                <div className="w-4 h-0.5 bg-current rounded" />
                <div className="w-4 h-0.5 bg-current rounded" />
                <div className="w-4 h-0.5 bg-current rounded" />
              </div>
            </button>
          ) : (
            /* Expanded: logo + wordmark + toggle */
            <>
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Cpu size={14} className="text-white" />
              </div>
              <span className="font-display text-base font-bold text-surface-800 tracking-tight">
                SensorOps
              </span>
              <button
                onClick={() => setCollapsed(v => !v)}
                className="ml-auto p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                title="Collapse sidebar"
              >
                <div className="flex flex-col gap-[5px]">
                  <div className="w-4 h-0.5 bg-current rounded" />
                  <div className="w-3 h-0.5 bg-current rounded" />
                  <div className="w-4 h-0.5 bg-current rounded" />
                </div>
              </button>
            </>
          )}
        </div>

        {/* Live status strip — only when expanded */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-100 bg-surface-50">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 pulse-dot" />
              <span className="text-xs text-surface-500">{online} online</span>
            </div>
            <div className="w-px h-3 bg-surface-200" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-surface-300" />
              <span className="text-xs text-surface-400">{offline} offline</span>
            </div>
          </div>
        )}
        
        {/* Nav — filtered by role */}
        <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
          {role.nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => clsx(
                'flex items-center rounded-lg text-sm transition-all group relative',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium border border-brand-100'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-surface-100',
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}

              {/* Alert badge on bell nav item */}
              {isBellItem(label) && alertCount > 0 && (
                <span className={clsx(
                  'ml-auto rounded-full text-xs font-semibold px-1.5 py-0.5 bg-red-100 text-red-600',
                  collapsed && 'absolute top-1 right-1 px-1 text-[10px]',
                )}>
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User avatar / account area */}
        <div className="p-3 border-t border-surface-200">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-surface-50 border border-surface-200">
              <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                A
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-surface-700 truncate">Admin User</span>
                <span className="text-xs text-surface-400 truncate">admin@sensorops.io</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
                A
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-surface-200 bg-white shadow-sm flex-shrink-0">
          {/* Left — live indicator */}
          <div className="flex items-center gap-2">
            <Wifi size={13} className="text-brand-500" />
            <span className="text-xs text-surface-400 font-mono">Live · refreshes every 60 s</span>
          </div>

          {/* Right — alert pill + date + role switcher */}
          <div className="flex items-center gap-3">
            {alertCount > 0 && (
              <NavLink
                to="/alerts"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
              >
                <AlertCircle size={12} />
                {alertCount} alert{alertCount !== 1 ? 's' : ''}
              </NavLink>
            )}

            <div className="h-5 w-px bg-surface-200" />

            <span className="text-xs text-surface-400 font-mono hidden md:block">
              {new Date().toLocaleDateString('en-SG', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </span>

            <div className="h-5 w-px bg-surface-200" />

            {/* Role switcher — main feature */}
            <RoleSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-50 bg-grid-pattern bg-grid">
          <div className="max-w-screen-2xl mx-auto p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
