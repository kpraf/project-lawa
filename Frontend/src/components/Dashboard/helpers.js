import { getGrade } from './paramgrade';
// Import forecast data
import forecastData from '../../data/water_forecast.json';

// Helper to generate future dates for forecast data
const generateForecastDates = (startMonth = 1, count = 12) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const dates = [];
  
  for (let i = 0; i < count; i++) {
    const month = startMonth + i;
    const year = currentYear + Math.floor((month - 1) / 12);
    const adjustedMonth = ((month - 1) % 12) + 1;
    
    // Create date for the 15th of each month (middle of month for forecast)
    const forecastDate = new Date(year, adjustedMonth - 1, 15, 12, 0, 0);
    dates.push(forecastDate.toISOString().split('T')[0] + ':12');
  }
  
  return dates;
};

// Transform forecast JSON to match API data format
export const transformForecastData = (selectedStations = [], selectedParams = [], dateRange = null) => {
  const result = { Parameters: {}, metadata: { type: 'forecast' } };
  
  // Generate forecast dates (next 12 months starting from August 2025)
  const forecastDates = generateForecastDates(8, 12); // Starting from August 2025
  
  // Station name mapping (forecast uses full names, API uses codes)
  const stationMapping = {
    'Stn. I (Central West Bay)': 'I',
    'Stn. II (East Bay)': 'II', 
    'Stn. IV (Central Bay)': 'IV',
    'Stn. V (Northern West Bay)': 'V',
    'Stn. VIII (South Bay)': 'VIII',
    'Stn. XV (San Pedro)': 'XV',
    'Stn. XVI (Sta. Rosa)': 'XVI',
    'Stn. XVII (Sanctuary)': 'XVII',
    'Stn. XVIII (Pagsanjan)': 'XVIII',
    'Stn. XIII (Taytay)': 'XIII',
    'Stn. XIX (Muntinlupa)': 'XIX',
    'Stn. XX (GEMS)': 'XX',
    'Stn. XXI (Cardona)': 'XXI',
    'Stn. XXII (Jala-jala)': 'XXII',
    'Stn. XXIII (Lumban)': 'XXIII'
  };
  
  // Parameter name mapping (clean up parameter names)
  const paramMapping = {
    'Ammonia (mg/L)': 'Ammonia',
    'BOD (mg/L)': 'BOD',
    'Dissolved Oxygen (mg/L)': 'Dissolved Oxygen',
    'Fecal Coliform, MPN/100ml (Geomean)': 'Fecal Coliform',
    'Inorganic Phospate (mg/L)': 'Inorganic Phosphate',
    'Nitrate (mg/L)': 'Nitrate',
    'pH (units)': 'pH',
    'TDS (mg/L)': 'TDS',
    'Total Dissolved Solids (mg/L)': 'TDS',
    'DO': 'Dissolved Oxygen',
    'DO (mg/L)': 'Dissolved Oxygen'
  };
  
  // Filter by date range if provided
  const filterByDateRange = (date) => {
    if (!dateRange || (!dateRange.start && !dateRange.end)) return true;
    const dateObj = new Date(date.split(':')[0]);
    
    if (dateRange.start && dateObj < dateRange.start) return false;
    if (dateRange.end && dateObj > dateRange.end) return false;
    return true;
  };
  
  // Transform forecast data
  Object.entries(forecastData).forEach(([stationFullName, parameters]) => {
    const stationCode = stationMapping[stationFullName];
    if (!stationCode) return;
    
    // Filter by selected stations
    if (selectedStations.length > 0 && !selectedStations.includes(stationCode)) return;
    
    Object.entries(parameters).forEach(([paramFullName, values]) => {
      const paramName = paramMapping[paramFullName] || paramFullName;
      
      // Filter by selected parameters
      if (selectedParams.length > 0 && selectedParams[0] !== 'all' && !selectedParams.includes(paramName)) return;
      
      if (!result.Parameters[paramName]) {
        result.Parameters[paramName] = [];
      }
      
      // Add forecast values with dates
      values.forEach((value, index) => {
        if (index < forecastDates.length && value !== null && value !== undefined) {
          const date = forecastDates[index];
          
          // Apply date range filter
          if (filterByDateRange(date)) {
            const gradeResult = getGrade(paramName, Number(value));
            const rawClass = gradeResult?.grade || 'Unknown';
            const formattedClass = rawClass && rawClass !== 'Unknown' 
              ? (rawClass.startsWith('Class') ? rawClass : `Class ${rawClass}`)
              : rawClass;
            result.Parameters[paramName].push({
              time: date,
              value: Number(value),
              station_id: stationCode,
              is_forecast: true,
              grade: gradeResult?.grade || 'Unknown',
              Class: formattedClass
            });
          }
        }
      });
    });
  });
  
  return result;
};

// Add this helper to resolve quick range labels to dates
const resolveQuickRange = (label) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (label) {
    case 'Today':
      return { startDate: new Date(today), endDate: new Date(today) };
    case 'Yesterday': {
      const yest = new Date(today);
      yest.setDate(today.getDate() - 1);
      return { startDate: yest, endDate: yest };
    }
    case 'Last 7 Days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { startDate: start, endDate: today };
    }
    case 'Last 30 Days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { startDate: start, endDate: today };
    }
    case 'Last 6 Months': {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 5);
      start.setDate(1);
      return { startDate: start, endDate: today };
    }
    case 'Last 1 Year':
    case 'Last Year': {
      const start = new Date(today);
      start.setFullYear(today.getFullYear() - 1);
      start.setDate(start.getDate() + 1);
      return { startDate: start, endDate: today };
    }
    case 'All Time':
      return { startDate: null, endDate: null };
    default:
      return { startDate: null, endDate: null };
  }
};

export const fetchWaterData = async (selectedMarker, setWaterData) => {
  if (selectedMarker) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/sensors/recent-data/${selectedMarker.station}`);
      const data = await response.json();
      console.log('fetchWaterData API response:', data); // <-- print API data
      setWaterData(data);
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  }
};

// Monitoring data is served as a static file (built by "Data Preprocessing/build_static_dataset.py")
// because there is no live sensor feed; date filtering happens here instead of in the API.
let historicalPromise = null;
export const loadHistorical = () => {
  if (!historicalPromise) {
    historicalPromise = fetch('/data/historical.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} loading historical data`);
        return r.json();
      })
      .catch(err => {
        historicalPromise = null;
        throw err;
      });
  }
  return historicalPromise;
};

export const toLocalYMD = (date) => {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const resolveDateBounds = ({ status, startDate, endDate }) => {
  if (startDate && endDate) return { from: startDate, to: endDate };
  if (status && status !== 'All Time' && status !== 'Custom Range') {
    const { startDate: s, endDate: e } = resolveQuickRange(status);
    if (s && e) return { from: toLocalYMD(s), to: toLocalYMD(e) };
  }
  return { from: null, to: null };
};

export const getAvailableYears = (historical) =>
  [...new Set(historical.series.flatMap(s => s.data.map(p => Number(p.time.slice(0, 4)))))].sort((a, b) => b - a);

const geometricMean = values => Math.exp(values.reduce((sum, v) => sum + Math.log(Math.max(v, 1)), 0) / values.length);

// Annual summary per parameter for one station, in the shape the dashboard cards expect.
// Fecal Coliform uses the geometric mean, as in DENR/LLDA reporting; the rest use the arithmetic mean.
export const getStationYearSummary = (historical, station, year) => {
  const Parameters = {};
  historical.series
    .filter(s => s.station === station)
    .forEach(s => {
      const points = s.data.filter(p => p.value !== null && p.time.startsWith(String(year)));
      if (!points.length) return;
      const values = points.map(p => Number(p.value));
      const mean = s.parameter === 'Fecal Coliform'
        ? geometricMean(values)
        : values.reduce((a, b) => a + b, 0) / values.length;
      const lastTime = points.map(p => p.time).sort().pop();
      Parameters[s.parameter] = {
        value: Number(mean.toFixed(3)),
        time: `${lastTime}T00:00:00`,
        samples: points.length
      };
    });
  return { Parameters };
};

export const fetchAllData = async (setAllData, { station = [], status = '', startDate = '', endDate = '' } = {}) => {
  try {
    const historical = await loadHistorical();
    const { from, to } = resolveDateBounds({ status, startDate, endDate });
    const stationFilter = (station || []).filter(Boolean);

    const data = {
      metadata: historical.metadata,
      series: historical.series
        .filter(s => !stationFilter.length || stationFilter.includes(s.station))
        .map(s => ({
          ...s,
          data: s.data.filter(p => (!from || p.time >= from) && (!to || p.time <= to))
        }))
        .filter(s => s.data.length)
    };

    if (!data.series.length) {
      setAllData({ Parameters: {}, metadata: data.metadata || {} });
      return;
    }

    // Build Parameters: { param: [ { ...entry, station_id: ... } ] }
    const Parameters = {};
    
    // Parameter name mapping for API data
    const apiParamMapping = {
      'Ammonia (mg/L)': 'Ammonia',
      'BOD (mg/L)': 'BOD',
      'Dissolved Oxygen (mg/L)': 'Dissolved Oxygen',
      'Fecal Coliform, MPN/100ml (Geomean)': 'Fecal Coliform',
      'Inorganic Phospate (mg/L)': 'Inorganic Phosphate',
      'Nitrate (mg/L)': 'Nitrate',
      'pH (units)': 'pH',
      'TDS (mg/L)': 'TDS',
      'Total Dissolved Solids (mg/L)': 'TDS',
      'DO': 'Dissolved Oxygen',
      'DO (mg/L)': 'Dissolved Oxygen'
    };
    
    data.series.forEach(seriesItem => {
      const rawParam = seriesItem.parameter;
      const param = apiParamMapping[rawParam] || rawParam;
      if (!Parameters[param]) Parameters[param] = [];
      seriesItem.data.forEach(entry => {
        // Apply grading and format class labels for API data
        let qualityInfo = {};
        if (entry.value !== null && entry.value !== undefined) {
          const gradeResult = getGrade(param, Number(entry.value));
          if (gradeResult && gradeResult.grade) {
            const rawClass = gradeResult.grade;
            const formattedClass = rawClass && rawClass !== 'Unknown' 
              ? (rawClass.startsWith('Class') ? rawClass : `Class ${rawClass}`)
              : rawClass;
            qualityInfo = {
              Class: formattedClass,
              Range: gradeResult.range,
              color: gradeResult.color
            };
          }
        }
        
        Parameters[param].push({
          ...entry,
          station_id: seriesItem.station, // Use station code (e.g., "I", "II")
          Class: qualityInfo.Class,
          Range: qualityInfo.Range,
          grade: qualityInfo
        });
      });
    });

    setAllData({ Parameters, metadata: data.metadata });
  } catch (error) {
    console.error('Error fetching all data:', error);
    setAllData({ Parameters: {}, metadata: {} });
  }
};

export const fetchDateMetadata = async () => {
  try {
    const historical = await loadHistorical();
    const meta = { year: { data: [] }, month: {}, day: {} };
    historical.series.forEach(s => s.data.forEach(p => {
      const [y, m, d] = p.time.slice(0, 10).split('-').map(Number);
      if (!meta.year.data.includes(y)) meta.year.data.push(y);
      if (!meta.month[y]) meta.month[y] = [];
      if (!meta.month[y].includes(m)) meta.month[y].push(m);
      const key = `${y}-${m}`;
      if (!meta.day[key]) meta.day[key] = [];
      if (!meta.day[key].includes(d)) meta.day[key].push(d);
    }));
    meta.year.data.sort((a, b) => a - b);
    Object.values(meta.month).forEach(arr => arr.sort((a, b) => a - b));
    Object.values(meta.day).forEach(arr => arr.sort((a, b) => a - b));
    return meta;
  } catch (error) {
    console.error('Error fetching date metadata:', error);
    return null;
  }
};

export const fetchForecastData = async (setAllData, { station = [], status = '', startDate = '', endDate = '', selectedParams = ['all'] } = {}) => {
  try {
    console.log('Fetching forecast data with params:', { station, status, startDate, endDate, selectedParams });
    
    // Convert status to date range if needed
    let dateRange = null;
    if (status && status !== 'All Time' && status !== 'Custom Range') {
      const resolved = resolveQuickRange(status);
      dateRange = resolved;
    } else if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }
    
    // Transform forecast data
    const transformedData = transformForecastData(station, selectedParams, dateRange);
    
    console.log('Forecast data transformed:', transformedData);
    setAllData(transformedData);
    
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    setAllData({ Parameters: {}, metadata: {} });
  }
};

// Enhanced fetchAllData with forecast mode support
export const fetchAllDataWithForecast = async (setAllData, { station = [], status = '', startDate = '', endDate = '', selectedParams = ['all'], forecastMode = false } = {}) => {
  if (forecastMode) {
    return fetchForecastData(setAllData, { station, status, startDate, endDate, selectedParams });
  } else {
    return fetchAllData(setAllData, { station, status, startDate, endDate });
  }
};

export const getOverallGrade = (memoizedWaterData) => {
  return memoizedWaterData && memoizedWaterData.Parameters ? Object.keys(memoizedWaterData.Parameters).map(param => {
    const value = memoizedWaterData.Parameters[param].value;
    const { grade } = getGrade(param, value);
    return grade;
  }).reduce((acc, grade) => {
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {}) : 'Unknown';
};

export const getBestGrade = (overallGrade) => {
  return overallGrade !== 'Unknown' ? Object.keys(overallGrade).reduce((bestGrade, grade) => {
    if (!bestGrade || overallGrade[grade] > overallGrade[bestGrade]) {
      return grade;
    }
    return bestGrade;
  }, null) : 'Unknown';
};
