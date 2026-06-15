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
      const response = await fetch(`process.env.REACT_APP_API_URL/sensors/recent-data/${selectedMarker.station}`);
      const data = await response.json();
      console.log('fetchWaterData API response:', data); // <-- print API data
      setWaterData(data);
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  }
};

export const fetchAllData = async (setAllData, { station = [], status = '', startDate = '', endDate = '' } = {}) => {
  try {
    // If status is a quick range (not "All Time" or "Custom Range"), use status param only
    let _status = status, _startDate = startDate, _endDate = endDate;
    const quickRanges = [
      'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Last 6 Months', 'Last 1 Year', 'Last Year', 'All Time'
    ];
    let useStatusOnly = false;
    if (_status && quickRanges.includes(_status) && _status !== 'All Time' && _status !== 'Custom Range') {
      useStatusOnly = true;
      _startDate = '';
      _endDate = '';
    }
    // Build query string
    const params = [];
    if (station && Array.isArray(station) && station.length > 0) {
      station.filter(s => !!s).forEach(s => params.push(`station=${encodeURIComponent(s)}`));
    }
    if (!useStatusOnly && _startDate && _endDate) {
      params.push(`startDate=${encodeURIComponent(_startDate)}`);
      params.push(`endDate=${encodeURIComponent(_endDate)}`);
    }
    // Only add status if present and not using custom date range
    if (_status && (useStatusOnly || !(_startDate && _endDate))) {
      params.push(`status=${encodeURIComponent(_status)}`);
    }
    const query = params.length ? `?${params.join('&')}` : '';
    const baseUrl = 'process.env.REACT_APP_API_URL/sensors/get-all-data/';
    const url = `${baseUrl}${query}`;

    const response = await fetch(url);
    const data = await response.json();
    console.log('fetchAllData API response:', data); // <-- print API data

    // Handle "No Data Found" (404 or 200)
    if (
      (data && typeof data === 'object' && data.data === "No Data Found") ||
      !data || typeof data !== 'object' ||
      (data.series && !Array.isArray(data.series))
    ) {
      setAllData({ Parameters: {}, metadata: data.metadata || {} });
      return;
    }

    // If series is empty or missing, treat as no data
    if (!data.series || !data.series.length) {
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
    // Always fetch with Status=Today by default
    const response = await fetch('process.env.REACT_APP_API_URL/sensors/getDate/?Status=Today');
    const data = await response.json();
    return data;
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
