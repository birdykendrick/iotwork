// ─── Mock Data ───────────────────────────────────────────────────────────────
// Structured as: Customers → Deployments → Sensors → Readings/Events

import { subHours, subMinutes, subDays, format } from 'date-fns'

const now = new Date()

// ─── Sensor Types ────────────────────────────────────────────────────────────
export const SENSOR_TYPES = {
  EM320: 'Milesight EM320-TH',
  EYE:   'Teltonika Eye Sensor',
}

// ─── Helper: Generate time-series telemetry ──────────────────────────────────
function generateTelemetry(hours = 24, baseTemp = 22, baseHumid = 55, drift = 0) {
  const points = []
  for (let i = hours; i >= 0; i--) {
    const t = subHours(now, i)
    const noise = () => (Math.random() - 0.5) * 2
    points.push({
      time:        format(t, 'HH:mm'),
      timestamp:   t.toISOString(),
      temperature: parseFloat((baseTemp + drift * (1 - i / hours) + noise()).toFixed(1)),
      humidity:    parseFloat((baseHumid + noise() * 3).toFixed(1)),
      battery:     Math.max(20, 95 - Math.floor(i * 0.1)),
    })
  }
  return points
}

// ─── Sensors ─────────────────────────────────────────────────────────────────
export const sensors = {
  // Pharma cold chain
  s001: {
    id: 's001', name: 'Fridge Unit A1', type: 'EM320',
    status: 'online', battery: 87, signal: -72,
    lastSeen: subMinutes(now, 4).toISOString(),
    location: 'Cold Storage Room 1',
    thresholds: { tempMin: 2, tempMax: 8, humidMin: 30, humidMax: 60 },
    telemetry: generateTelemetry(24, 4.5, 42),
    latestReading: { temperature: 4.7, humidity: 43.2 },
  },
  s002: {
    id: 's002', name: 'Fridge Unit A2', type: 'EM320',
    status: 'online', battery: 64, signal: -78,
    lastSeen: subMinutes(now, 7).toISOString(),
    location: 'Cold Storage Room 1',
    thresholds: { tempMin: 2, tempMax: 8, humidMin: 30, humidMax: 60 },
    telemetry: generateTelemetry(24, 5.1, 40),
    latestReading: { temperature: 5.3, humidity: 41.0 },
  },
  s003: {
    id: 's003', name: 'Ambient Monitor B1', type: 'EM320',
    status: 'warning', battery: 23, signal: -85,
    lastSeen: subMinutes(now, 18).toISOString(),
    location: 'Dispensary Floor',
    thresholds: { tempMin: 15, tempMax: 25, humidMin: 30, humidMax: 70 },
    telemetry: generateTelemetry(24, 21, 55, 5),
    latestReading: { temperature: 26.1, humidity: 58.4 },
  },
  // Warehouse
  s004: {
    id: 's004', name: 'Zone A — Rack 1', type: 'EM320',
    status: 'online', battery: 91, signal: -65,
    lastSeen: subMinutes(now, 2).toISOString(),
    location: 'Warehouse Zone A',
    thresholds: { tempMin: 10, tempMax: 35, humidMin: 20, humidMax: 80 },
    telemetry: generateTelemetry(24, 24, 62),
    latestReading: { temperature: 24.3, humidity: 61.5 },
  },
  s005: {
    id: 's005', name: 'Zone B — Rack 3', type: 'EM320',
    status: 'online', battery: 78, signal: -70,
    lastSeen: subMinutes(now, 5).toISOString(),
    location: 'Warehouse Zone B',
    thresholds: { tempMin: 10, tempMax: 35, humidMin: 20, humidMax: 80 },
    telemetry: generateTelemetry(24, 25, 64),
    latestReading: { temperature: 25.1, humidity: 63.8 },
  },
  s006: {
    id: 's006', name: 'Zone C — Rack 7', type: 'EM320',
    status: 'offline', battery: 11, signal: null,
    lastSeen: subHours(now, 6).toISOString(),
    location: 'Warehouse Zone C',
    thresholds: { tempMin: 10, tempMax: 35, humidMin: 20, humidMax: 80 },
    telemetry: generateTelemetry(18, 26, 65),
    latestReading: { temperature: null, humidity: null },
  },
  // Truck tracking
  s007: {
    id: 's007', name: 'Truck #TRK-004', type: 'EYE',
    status: 'online', battery: 82, signal: -68,
    lastSeen: subMinutes(now, 11).toISOString(),
    location: { lat: 1.3521, lng: 103.8198, label: 'PIE — near Toa Payoh' },
    thresholds: { tempMin: 2, tempMax: 8, humidMin: 30, humidMax: 70 },
    telemetry: generateTelemetry(24, 5.8, 45, 2),
    latestReading: { temperature: 5.9, humidity: 46.2 },
  },
  s008: {
    id: 's008', name: 'Truck #TRK-009', type: 'EYE',
    status: 'online', battery: 55, signal: -74,
    lastSeen: subMinutes(now, 3).toISOString(),
    location: { lat: 1.2897, lng: 103.8501, label: 'ECP — near Marina Bay' },
    thresholds: { tempMin: 2, tempMax: 8, humidMin: 30, humidMax: 70 },
    telemetry: generateTelemetry(24, 6.2, 48),
    latestReading: { temperature: 6.4, humidity: 49.1 },
  },
  // Temp mapping
  s009: {
    id: 's009', name: 'Mapping Point 1', type: 'EM320',
    status: 'online', battery: 95, signal: -60,
    lastSeen: subMinutes(now, 1).toISOString(),
    location: 'Lab Room 201',
    thresholds: { tempMin: 18, tempMax: 25, humidMin: 40, humidMax: 65 },
    telemetry: generateTelemetry(72, 21.5, 52),
    latestReading: { temperature: 21.6, humidity: 52.3 },
  },
  s010: {
    id: 's010', name: 'Mapping Point 2', type: 'EM320',
    status: 'online', battery: 93, signal: -62,
    lastSeen: subMinutes(now, 2).toISOString(),
    location: 'Lab Room 201',
    thresholds: { tempMin: 18, tempMax: 25, humidMin: 40, humidMax: 65 },
    telemetry: generateTelemetry(72, 22.1, 53),
    latestReading: { temperature: 22.0, humidity: 53.1 },
  },
  s011: {
    id: 's011', name: 'Mapping Point 3', type: 'EM320',
    status: 'online', battery: 90, signal: -63,
    lastSeen: subMinutes(now, 2).toISOString(),
    location: 'Lab Room 201',
    thresholds: { tempMin: 18, tempMax: 25, humidMin: 40, humidMax: 65 },
    telemetry: generateTelemetry(72, 21.8, 51.5),
    latestReading: { temperature: 21.9, humidity: 51.8 },
  },
}

// ─── Deployments ──────────────────────────────────────────────────────────────
export const deployments = {
  d001: {
    id: 'd001',
    name: 'Cold Chain Monitoring',
    customerId: 'c001',
    type: 'Pharma Monitoring',
    location: 'Haleon Singapore Pte Ltd — Toa Payoh',
    status: 'warning',
    sensorIds: ['s001', 's002', 's003'],
    startDate: '2024-01-15',
    description: 'Continuous temperature and humidity monitoring for pharmaceutical cold storage and dispensary environments.',
    thresholdProfile: 'Pharma Cold Chain — EU GDP',
    contactPerson: 'Dr. Priya Nair',
    contactEmail: 'p.nair@haleon.sg',
  },
  d002: {
    id: 'd002',
    name: 'Distribution Warehouse A',
    customerId: 'c002',
    type: 'Warehouse Monitoring',
    location: 'DHL Supply Chain — Jurong East Logistics Hub',
    status: 'critical',
    sensorIds: ['s004', 's005', 's006'],
    startDate: '2023-11-08',
    description: 'Multi-zone temperature and humidity monitoring across warehouse storage bays.',
    thresholdProfile: 'Ambient Warehouse — Standard',
    contactPerson: 'James Lim',
    contactEmail: 'j.lim@dhl.com',
  },
  d003: {
    id: 'd003',
    name: 'Cold Truck Fleet — Batch 2',
    customerId: 'c001',
    type: 'Truck Monitoring',
    location: 'Mobile — Singapore Island',
    status: 'online',
    sensorIds: ['s007', 's008'],
    startDate: '2024-03-01',
    description: 'Real-time cargo temperature tracking for refrigerated delivery trucks.',
    thresholdProfile: 'Pharma Transport — 2–8°C',
    contactPerson: 'Dr. Priya Nair',
    contactEmail: 'p.nair@haleon.sg',
  },
  d004: {
    id: 'd004',
    name: 'Annual Temperature Mapping — Lab 201',
    customerId: 'c003',
    type: 'Temperature Mapping',
    location: 'NovaBio Research — Biopolis, One-North',
    status: 'online',
    sensorIds: ['s009', 's010', 's011'],
    startDate: '2024-04-10',
    description: 'Regulatory temperature mapping study across 9 points in climate-controlled lab room 201.',
    thresholdProfile: 'Lab Mapping — WHO Annex 9',
    contactPerson: 'Chen Wei',
    contactEmail: 'c.wei@novabio.sg',
  },
}

// ─── Customers ────────────────────────────────────────────────────────────────
export const customers = [
  {
    id: 'c001',
    name: 'Haleon Singapore',
    industry: 'Pharmaceutical',
    logo: 'H',
    color: '#26a269',
    deploymentIds: ['d001', 'd003'],
    contactName: 'Dr. Priya Nair',
    contactEmail: 'p.nair@haleon.sg',
    contactPhone: '+65 9123 4567',
    since: '2024-01',
    status: 'warning',
    address: '8 Toa Payoh Lorong 8, Singapore 319231',
  },
  {
    id: 'c002',
    name: 'DHL Supply Chain',
    industry: 'Logistics & Warehousing',
    logo: 'D',
    color: '#d97706',
    deploymentIds: ['d002'],
    contactName: 'James Lim',
    contactEmail: 'j.lim@dhl.com',
    contactPhone: '+65 6234 5678',
    since: '2023-11',
    status: 'critical',
    address: '1 Jurong East Ave 1, Singapore 609703',
  },
  {
    id: 'c003',
    name: 'NovaBio Research',
    industry: 'Biotech / Research',
    logo: 'N',
    color: '#0ea5e9',
    deploymentIds: ['d004'],
    contactName: 'Chen Wei',
    contactEmail: 'c.wei@novabio.sg',
    contactPhone: '+65 6789 0123',
    since: '2024-04',
    status: 'online',
    address: '11 Biopolis Way, Singapore 138667',
  },
]

// ─── Alerts / Events ─────────────────────────────────────────────────────────
export const alerts = [
  {
    id: 'a001',
    type: 'threshold_breach',
    severity: 'warning',
    title: 'Temperature above upper limit',
    message: 'Ambient Monitor B1 recorded 26.1°C, exceeding the 25°C upper threshold.',
    sensorId: 's003',
    sensorName: 'Ambient Monitor B1',
    deploymentId: 'd001',
    customerId: 'c001',
    timestamp: subMinutes(now, 18).toISOString(),
    resolved: false,
  },
  {
    id: 'a002',
    type: 'low_battery',
    severity: 'warning',
    title: 'Low battery detected',
    message: 'Ambient Monitor B1 battery is at 23%. Replacement recommended.',
    sensorId: 's003',
    sensorName: 'Ambient Monitor B1',
    deploymentId: 'd001',
    customerId: 'c001',
    timestamp: subHours(now, 2).toISOString(),
    resolved: false,
  },
  {
    id: 'a003',
    type: 'sensor_offline',
    severity: 'critical',
    title: 'Sensor offline',
    message: 'Zone C — Rack 7 has not reported data for 6 hours. Possible power or connectivity failure.',
    sensorId: 's006',
    sensorName: 'Zone C — Rack 7',
    deploymentId: 'd002',
    customerId: 'c002',
    timestamp: subHours(now, 6).toISOString(),
    resolved: false,
  },
  {
    id: 'a004',
    type: 'low_battery',
    severity: 'critical',
    title: 'Critical battery level',
    message: 'Zone C — Rack 7 battery is at 11%. Sensor may shut down soon.',
    sensorId: 's006',
    sensorName: 'Zone C — Rack 7',
    deploymentId: 'd002',
    customerId: 'c002',
    timestamp: subHours(now, 8).toISOString(),
    resolved: false,
  },
  {
    id: 'a005',
    type: 'stale_data',
    severity: 'info',
    title: 'Delayed data transmission',
    message: 'Fridge Unit A2 last transmission was 7 minutes ago. Monitoring for pattern.',
    sensorId: 's002',
    sensorName: 'Fridge Unit A2',
    deploymentId: 'd001',
    customerId: 'c001',
    timestamp: subMinutes(now, 7).toISOString(),
    resolved: false,
  },
  {
    id: 'a006',
    type: 'threshold_breach',
    severity: 'info',
    title: 'Humidity approaching upper limit',
    message: 'Zone B — Rack 3 humidity reached 63.8%, approaching the 80% alert threshold.',
    sensorId: 's005',
    sensorName: 'Zone B — Rack 3',
    deploymentId: 'd002',
    customerId: 'c002',
    timestamp: subHours(now, 1).toISOString(),
    resolved: true,
  },
  {
    id: 'a007',
    type: 'threshold_breach',
    severity: 'warning',
    title: 'Truck cargo temperature rising',
    message: 'Truck #TRK-004 temperature drifted to 5.9°C. Approaching 6°C mid-point review threshold.',
    sensorId: 's007',
    sensorName: 'Truck #TRK-004',
    deploymentId: 'd003',
    customerId: 'c001',
    timestamp: subMinutes(now, 30).toISOString(),
    resolved: false,
  },
  {
    id: 'a008',
    type: 'missing_data',
    severity: 'warning',
    title: 'Missing data gap detected',
    message: 'Truck #TRK-009 had a 14-minute gap in transmissions earlier today.',
    sensorId: 's008',
    sensorName: 'Truck #TRK-009',
    deploymentId: 'd003',
    customerId: 'c001',
    timestamp: subHours(now, 3).toISOString(),
    resolved: true,
  },
]

// ─── Calibration Sessions ─────────────────────────────────────────────────────
export const calibrationSessions = [
  {
    id: 'cal001',
    name: 'Q1 2024 — Fridge Unit A1 Calibration',
    deploymentId: 'd001',
    customerId: 'c001',
    date: subDays(now, 45).toISOString(),
    referenceDevice: 'Fluke 1620A — Cal. ID #FLK-0042',
    sensors: ['s001'],
    status: 'pass',
    deviation: 0.12,
    tolerance: 0.5,
    result: 'All readings within tolerance. Sensor certified.',
  },
  {
    id: 'cal002',
    name: 'Lab 201 — Annual Temp Mapping',
    deploymentId: 'd004',
    customerId: 'c003',
    date: subDays(now, 5).toISOString(),
    referenceDevice: 'TESTO 176 T4 — Cal. ID #TST-0091',
    sensors: ['s009', 's010', 's011'],
    status: 'pass',
    deviation: 0.24,
    tolerance: 0.5,
    result: '3 of 3 mapping points within ±0.5°C tolerance. Report ready.',
  },
]

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function getDeploymentWithSensors(deploymentId) {
  const dep = deployments[deploymentId]
  if (!dep) return null
  return {
    ...dep,
    customer: customers.find(c => c.id === dep.customerId),
    sensors: dep.sensorIds.map(id => sensors[id]),
  }
}

export function getCustomerWithDeployments(customerId) {
  const cust = customers.find(c => c.id === customerId)
  if (!cust) return null
  return {
    ...cust,
    deployments: cust.deploymentIds.map(id => ({
      ...deployments[id],
      sensors: deployments[id].sensorIds.map(sid => sensors[sid]),
    })),
  }
}

export function getAlertsForDeployment(deploymentId) {
  return alerts.filter(a => a.deploymentId === deploymentId)
}

export function getSensorStatusCounts() {
  const all = Object.values(sensors)
  return {
    total:   all.length,
    online:  all.filter(s => s.status === 'online').length,
    warning: all.filter(s => s.status === 'warning').length,
    offline: all.filter(s => s.status === 'offline').length,
  }
}

export function getActiveAlertCount() {
  return alerts.filter(a => !a.resolved).length
}
