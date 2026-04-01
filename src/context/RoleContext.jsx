import React, { createContext, useContext, useState } from 'react'
import {
  LayoutDashboard, Users, FileText, FlaskConical,
  Bell, Activity, Wrench,
} from 'lucide-react'

// ─── Role definitions ─────────────────────────────────────────────────────────
// Each role gets: label, description, nav items, and feature flags.
// Feature flags are used by individual pages to show/hide sections.

export const ROLES = {
  admin: {
    key:         'admin',
    label:       'Admin',
    description: 'Asia GMP Internal',
    color:       'text-violet-600',
    badgeCls:    'bg-violet-50 text-violet-700 border-violet-200',
    nav: [
      { to: '/overview',    icon: LayoutDashboard, label: 'Overview' },
      { to: '/customers',   icon: Users,            label: 'Customers' },
      { to: '/reports',     icon: FileText,         label: 'Reports' },
      { to: '/calibration', icon: FlaskConical,     label: 'Calibration' },
      { to: '/alerts',      icon: Bell,             label: 'Alerts & Events' },
    ],
    features: {
      showCustomers:       true,
      showCalibration:     true,
      showReports:         true,
      showAllDeployments:  true,  // sees all customers' deployments
      showAdminMeta:       true,  // customer IDs, internal notes, etc.
    },
  },

  pharma: {
    key:         'pharma',
    label:       'Pharma User',
    description: 'Haleon Singapore',
    color:       'text-brand-600',
    badgeCls:    'bg-brand-50 text-brand-700 border-brand-200',
    nav: [
      { to: '/overview',  icon: Activity,         label: 'My Sites' },
      { to: '/reports',   icon: FileText,          label: 'Reports' },
      { to: '/alerts',    icon: Bell,              label: 'Alerts' },
    ],
    features: {
      showCustomers:       false,
      showCalibration:     false,
      showReports:         true,
      showAllDeployments:  false, // only sees own customer's deployments
      showAdminMeta:       false,
      // Pharma-specific
      pharmaCustomerId:    'c001', // Haleon — filter data to this customer
    },
  },

  cal_engineer: {
    key:         'cal_engineer',
    label:       'Cal. Engineer',
    description: 'Calibration & Ops',
    color:       'text-amber-600',
    badgeCls:    'bg-amber-50 text-amber-700 border-amber-200',
    nav: [
      { to: '/overview',    icon: LayoutDashboard, label: 'Overview' },
      { to: '/calibration', icon: FlaskConical,    label: 'Calibration' },
      { to: '/reports',     icon: FileText,        label: 'Reports' },
      { to: '/alerts',      icon: Bell,            label: 'Alerts' },
    ],
    features: {
      showCustomers:       false,
      showCalibration:     true,
      showReports:         true,
      showAllDeployments:  true,
      showAdminMeta:       false,
    },
  },
}

// ─── Context ──────────────────────────────────────────────────────────────────
const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [roleKey, setRoleKey] = useState('admin')

  const role = ROLES[roleKey]

  return (
    <RoleContext.Provider value={{ role, roleKey, setRoleKey, ROLES }}>
      {children}
    </RoleContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
