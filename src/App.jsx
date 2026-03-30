import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import Overview from './pages/Overview'
import Customers from './pages/Customers'
import DeploymentDetail from './pages/DeploymentDetail'
import Reports from './pages/Reports'
import Calibration from './pages/Calibration'
import AlertsEvents from './pages/AlertsEvents'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="customers" element={<Customers />} />
          <Route path="deployments/:id" element={<DeploymentDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calibration" element={<Calibration />} />
          <Route path="alerts" element={<AlertsEvents />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
