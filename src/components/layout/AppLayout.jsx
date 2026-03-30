import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, MapPin, FileText, FlaskConical,
  Bell, ChevronRight, Cpu, Menu, X, AlertCircle, Wifi,
} from 'lucide-react'
import { alerts, getActiveAlertCount, getSensorStatusCounts } from '../../data/mockData'
import clsx from 'clsx'

const nav = [
  { to: '/overview',    icon: LayoutDashboard, label: 'Overview' },
  { to: '/customers',   icon: Users,            label: 'Customers' },
  { to: '/reports',     icon: FileText,         label: 'Reports' },
  { to: '/calibration', icon: FlaskConical,     label: 'Calibration' },
  { to: '/alerts',      icon: Bell,             label: 'Alerts & Events' },
]

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const alertCount = getActiveAlertCount()
  const { online, offline } = getSensorStatusCounts()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col flex-shrink-0 bg-surface-800 border-r border-surface-500 transition-all duration-300 z-20',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-surface-500 h-14">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Cpu size={14} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-display text-base font-700 text-slate-100 tracking-tight">
              SensorOps
            </span>
          )}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
          >
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Status strip */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-500 bg-surface-900/40">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 pulse-dot" />
              <span className="text-xs text-slate-400">{online} online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-xs text-slate-500">{offline} offline</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => {
            const isBell = label === 'Alerts & Events'
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group relative',
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-600'
                )}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
                {isBell && alertCount > 0 && (
                  <span className={clsx(
                    'ml-auto rounded-full text-xs font-semibold px-1.5 py-0.5 bg-red-500/20 text-red-400',
                    collapsed ? 'absolute top-1 right-1 px-1' : ''
                  )}>
                    {alertCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-surface-500">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-surface-700">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                A
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-slate-200 truncate">Admin User</span>
                <span className="text-xs text-slate-500 truncate">admin@sensorops.io</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">A</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 h-14 border-b border-surface-500 bg-surface-800 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wifi size={14} className="text-brand-400" />
            <span className="text-slate-400 font-mono text-xs">Live — refreshes every 60s</span>
          </div>
          <div className="flex items-center gap-3">
            {alertCount > 0 && (
              <NavLink to="/alerts" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-900/40">
                <AlertCircle size={13} />
                {alertCount} active alert{alertCount !== 1 ? 's' : ''}
              </NavLink>
            )}
            <div className="h-8 w-px bg-surface-500" />
            <span className="text-xs text-slate-500 font-mono">
              {new Date().toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto bg-surface-900 bg-grid-pattern bg-grid">
          <div className="max-w-screen-2xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
