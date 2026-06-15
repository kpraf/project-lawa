// Color palette for station lines
export const COLORS = [
  "#e9242a", "#28a745", "#172851", "#ff9800", "#6f42c1", "#00bcd4", "#f44336", "#795548", "#607d8b", "#ffc107",
  "#8bc34a", "#9c27b0", "#2196f3", "#ff5722", "#cddc39", "#3f51b5", "#009688", "#bdbdbd", "#ffeb3b", "#b71c1c"
];

// Safe range thresholds for each parameter
export const DANGER_LEVELS = {
  pH: { min: 6.5, max: 8.5 },
  DO: { min: 5, max: 14 },
  Conductivity: { min: 0, max: 500 },
  'Fecal Coliform': { min: 0, max: 200 },
  'Inorganic Phosphate': { min: 0, max: 0.1 },
  Nitrate: { min: 0, max: 10 },
  Ammonia: { min: 0, max: 0.5 },
  BOD: { min: 0, max: 10 }
};

// Quick range options for date filtering
export const QUICK_RANGES = [
  { label: 'Today', get: () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return { start: new Date(today), end: new Date(today) };
  }},
  { label: 'Yesterday', get: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0,0,0,0);
    return { start: new Date(d), end: new Date(d) };
  }},
  { label: 'Last 7 Days', get: () => {
    const end = new Date(); end.setHours(0,0,0,0);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    return { start, end };
  }},
  { label: 'Last 30 Days', get: () => {
    const end = new Date(); end.setHours(0,0,0,0);
    const start = new Date(end); start.setDate(end.getDate() - 29);
    return { start, end };
  }},
  { label: 'This Month', get: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }},
  { label: 'Last Month', get: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start, end };
  }},
];

// Helper function to format date for API
export const formatDate = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

// Helper function to parse date from input
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// Helper function to format date range label
export const formatRangeLabel = (start, end) => {
  if (!start && !end) return 'Select Date Range';
  if (!start) return 'Start Date Required';
  if (!end) return 'End Date Required';
  return `${formatDate(start)} to ${formatDate(end)}`;
};

// Helper function to get water quality class color
// Updated to reflect that Class C is optimal for Laguna de Bay (LLDA guidelines)
export const getWaterQualityColor = (qualityClass) => {
  const colorMap = {
    'Class AA': '#9ACD32', // Light Green - good but not optimal for Laguna de Bay
    'Class A': '#FDDA0D',  // Yellow - acceptable
    'Class B': '#4CBB17',  // Green - very good
    'Class C': '#4CBB17',  // Green - optimal for Laguna de Bay
    'Class D': '#FFA500',  // Orange - poor
    'Failed': '#FF0000',   // Red
    'No Data': '#000000',  // Black
    'Error': '#808080'     // Gray
  };
  return colorMap[qualityClass] || '#000000';
};

// Helper function to get parameter units
export const getParameterUnit = (parameter) => {
  const unitMap = {
    'pH': 'pH',
    'Dissolved Oxygen': 'mg/L',
    'Conductivity': 'µS/cm',
    'Fecal Coliform': 'MPN/100mL',
    'Inorganic Phosphate': 'mg/L',
    'Nitrate': 'mg/L',
    'Ammonia': 'mg/L',
    'BOD': 'mg/L',
    'Temperature': '°C',
    'TDS': 'ppm',
    'Turbidity': 'NTU',
    'ORP': 'mV'
  };
  return unitMap[parameter] || '';
};

// Danger thresholds for each parameter (Class D or Failed)
export const BAD_THRESHOLDS = {
  BOD: 10, // Class D starts at 10
  DO: 5, // <2 is Failed, 2-5 is D (danger starts at 2)
  pH: [6.0, 9.0], // <6.0 or >9.0 is D or worse
  Turbidity: 10, // >10 is D or worse
  TDS: 1000, // >1000 is D or worse
  ORP: 200, // <200 is D or worse
  Temperature: [25, 31], // <25 or >31 is D or worse
  'Inorganic Phosphate': 0.025, // >0.025 is D or worse
  Ammonia: 0.06, // >0.06 is D or worse
  Nitrate: 7, // >7 is D or worse
  'Fecal Coliform': 200, // >200 is D or worse
}; 