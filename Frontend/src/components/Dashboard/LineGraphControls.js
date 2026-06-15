import React, { useState, useMemo, useEffect, useRef } from 'react';
// Replace this import:

import LineGraph from '../../linegraph-dashboard/components/LineGraph';
import WQI_linechart from './WQI_linechart';

import Dropdown from './Dropdown';
import { fetchAllData, fetchDateMetadata, fetchAllDataWithForecast } from './helpers';
import { getGrade } from './paramgrade';

const Chip = ({ label, selected, onClick, disabled }) => (
  <button
    type="button"
    className={`px-3 py-1 rounded-full border transition-all duration-200 mx-1 mb-1
      ${selected ? 'bg-blue-600 text-white border-blue-700 shadow' : 'bg-white text-blue-700 border-blue-300'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50 hover:border-blue-500'}
    `}
    onClick={onClick}
    disabled={disabled}
    style={{ fontWeight: selected ? 600 : 400, fontSize: 14, minWidth: 44 }}
  >
    {label}
  </button>
);

function formatDate(date) {
  if (!date) return '';
  return date.toISOString().slice(0, 10);
}
function parseDate(str) {
  if (!str) return null;
  return new Date(str);
}
function formatRangeLabel(start, end, status) {
  // If a quick range is selected, show its label
  if (status && status !== '' && status !== 'Custom Range') return status;
  // Otherwise, show the custom range
  if (!start && !end) return 'All Time';
  if (start && end && start.toDateString() === end.toDateString()) return start.toLocaleDateString();
  if (start && end) return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  if (start) return `From ${start.toLocaleDateString()}`;
  if (end) return `Until ${end.toLocaleDateString()}`;
  return 'Custom Range';
}

// Helper to get start/end of today, yesterday, etc.
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
function getYesterday() {
  const today = getToday();
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function getLastNDays(n) {
  const today = getToday();
  return {
    start: addDays(today, -n + 1),
    end: today
  };
}
function getMonthsAgo(n) {
  const today = getToday();
  const start = new Date(today.getFullYear(), today.getMonth() - n + 1, 1);
  return {
    start,
    end: today
  };
}
function getLastYear() {
  const today = getToday();
  const start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);
  return {
    start,
    end: today
  };
}
function getNextNMonths(n) {
  const today = getToday();
  const end = new Date(today);
  end.setMonth(end.getMonth() + n);
  return { start: today, end };
}

// Helper to check if a quick range is available
function isQuickRangeAvailable(qr, minAvailableDate, maxAvailableDate) {
  const { start, end } = qr.get();
  if (qr.label === 'All Time') return true;
  if (!start || !end) return false;
  if (minAvailableDate && end < minAvailableDate) return false;
  if (maxAvailableDate && start > maxAvailableDate) return false;
  return true;
}

// Quick ranges for historical data
const QUICK_RANGES = [
  { label: 'Today', get: () => {
      const today = getToday();
      return { start: today, end: today };
    }
  },
  { label: 'Yesterday', get: () => {
      const yest = getYesterday();
      return { start: yest, end: yest };
    }
  },
  { label: 'Last 7 Days', get: () => getLastNDays(7) },
  { label: 'Last 30 Days', get: () => getLastNDays(30) },
  { label: 'Last 6 Months', get: () => getMonthsAgo(6) },
  { label: 'Last 1 Year', get: () => getLastYear() },
  { label: 'All Time', get: () => ({ start: null, end: null }) }
];

// Quick ranges for forecast data
const FORECAST_QUICK_RANGES = [
  { label: 'Next Month', get: () => getNextNMonths(1) },
  { label: 'Next 3 Months', get: () => getNextNMonths(3) },
  { label: 'Next 6 Months', get: () => getNextNMonths(6) },
  { label: 'Next Year', get: () => getNextNMonths(12) },
  { label: 'All Forecast', get: () => ({ start: null, end: null }) }
];

function getMinMaxDatesFromMeta(dateMeta) {
  // Find the earliest and latest dates from the API metadata
  if (!dateMeta || !dateMeta.year || !dateMeta.month || !dateMeta.day) return { min: null, max: null };
  const years = dateMeta.year.data?.map(Number) || [];
  if (!years.length) return { min: null, max: null };
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Find min month/day for minYear, and max month/day for maxYear
  const minMonths = (dateMeta.month[minYear] || []).map(Number);
  const maxMonths = (dateMeta.month[maxYear] || []).map(Number);
  const minMonth = minMonths.length ? Math.min(...minMonths) : 1;
  const maxMonth = maxMonths.length ? Math.max(...maxMonths) : 12;

  const minDayArr = dateMeta.day[`${minYear}-${minMonth}`] || [];
  const maxDayArr = dateMeta.day[`${maxYear}-${maxMonth}`] || [];
  const minDay = minDayArr.length ? Math.min(...minDayArr.map(Number)) : 1;
  const maxDay = maxDayArr.length ? Math.max(...maxDayArr.map(Number)) : 31;

  const min = new Date(minYear, minMonth - 1, minDay);
  const max = new Date(maxYear, maxMonth - 1, maxDay);
  return { min, max };
}

// Transform Parameters data to the format expected by the dashboard LineGraph
function transformParametersToDashboardFormat(parameters, selectedStations) {
  // parameters: { param: [ { time, value, station_id, ... } ] }
  // returns: { param: [ { date, [station]: value, ... } ] }
  if (!parameters) return {};
  const result = {};
  Object.entries(parameters).forEach(([param, entries]) => {
    // Only include selected stations
    const filtered = entries.filter(e => !selectedStations.length || selectedStations.includes(e.station_id));
    // Group by time
    const byTime = {};
    filtered.forEach(e => {
      if (!byTime[e.time]) byTime[e.time] = { date: e.time };
      byTime[e.time][e.station_id] = e.value;
      // Always add quality info - compute it if not available
      let qualityInfo = null;
      if (e.Class || e.grade || e.is_forecast) {
        const rawClass = e.Class || e.grade?.grade || 'Unknown';
        const formattedClass = rawClass && rawClass !== 'Unknown' 
          ? (rawClass.startsWith('Class') ? rawClass : `Class ${rawClass}`)
          : rawClass;
        qualityInfo = {
          Class: formattedClass,
          Range: e.Range || e.grade?.range,
          is_forecast: e.is_forecast || false
        };
      } else if (e.value !== null && e.value !== undefined) {
        // Compute grade if not provided
        const gradeResult = getGrade(param, Number(e.value));
        if (gradeResult && gradeResult.grade) {
          const rawClass = gradeResult.grade;
          const formattedClass = rawClass && rawClass !== 'Unknown' 
            ? (rawClass.startsWith('Class') ? rawClass : `Class ${rawClass}`)
            : rawClass;
          qualityInfo = {
            Class: formattedClass,
            Range: gradeResult.range,
            is_forecast: false
          };
        }
      }
      
      if (qualityInfo) {
        byTime[e.time][`${e.station_id}_quality`] = qualityInfo;
      }
    });
    // Sort by date
    result[param] = Object.values(byTime).sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  return result;
}

const LineGraphControls = ({
  allData: initialAllData,
  selectedStation,
  setSelectedStation,
  initialParameter,
  fromDashboard
}) => {
  const [allData, setAllData] = useState(initialAllData);
  const [selectedParams, setSelectedParams] = useState(initialParameter ? [initialParameter] : ['all']);
  // Set default date range - use "All Time" when coming from dashboard, otherwise "Today"
  const today = getToday();
  const initialDateRange = fromDashboard 
    ? { start: null, end: null, label: 'All Time' }
    : { start: today, end: today, label: 'Today' };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const datePopoverRef = useRef(null);

  // Add forecast mode state
  const [forecastMode, setForecastMode] = useState(false);

  // Add loading state
  const [loading, setLoading] = useState(false);

  // Validation state
  const [validationMsg, setValidationMsg] = useState('');
  const [fadeAnim, setFadeAnim] = useState(false);

  // Date metadata state
  const [dateMeta, setDateMeta] = useState(null);

  // Parameter dropdown checklist state
  const [paramDropdownOpen, setParamDropdownOpen] = useState(false);
  const paramDropdownRef = useRef(null);

  // Add support for multi-station selection
  const [selectedStations, setSelectedStations] = useState(selectedStation ? [selectedStation] : []);

  // Sync selectedStations with selectedStation changes
  useEffect(() => {
    if (selectedStation && selectedStation !== '') {
      setSelectedStations([selectedStation]);
    } else {
      setSelectedStations([]);
    }
  }, [selectedStation]);

  // Fetch date metadata on mount
  useEffect(() => {
    fetchDateMetadata().then(setDateMeta);
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    // Validate date range
    let validDateRange = true;
    if (dateRange.start && dateRange.end) {
      const s = dateRange.start, e = dateRange.end;
      if (!(s instanceof Date && !isNaN(s)) || !(e instanceof Date && !isNaN(e)) || s > e) {
        validDateRange = false;
      }
    }
    if (!validDateRange) {
      setValidationMsg('Invalid date range selected.');
      setAllData({ Parameters: {}, metadata: {} });
      return;
    }
    // Build params for fetchAllData
    const params = {};
    // Always fetch data for ALL stations to populate dropdown options
    // We'll filter the display data on the frontend instead
    params.station = [];

    // If a quick range is selected, use status only; if custom, use start/end
    const quickRanges = [
      'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Last 6 Months', 'Last 1 Year', 'Last Year', 'All Time'
    ];
    if (dateRange.label && quickRanges.includes(dateRange.label) && dateRange.label !== 'All Time' && dateRange.label !== 'Custom Range') {
      params.status = dateRange.label;
      params.startDate = '';
      params.endDate = '';
    } else if (dateRange.start && dateRange.end) {
      params.startDate = formatDate(dateRange.start);
      params.endDate = formatDate(dateRange.end);
      params.status = '';
    } else {
      params.status = 'All Time';
      params.startDate = '';
      params.endDate = '';
    }

    // Log the params and a sample URL for debugging
    const query = new URLSearchParams();
    if (params.station && params.station.length) query.append('station', params.station.join(','));
    if (params.status) query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    const url = `/api/data?${query.toString()}`;
    console.log('Fetching data with params:', params, 'URL:', url, 'Forecast mode:', forecastMode);

    setLoading(true);
    // Use enhanced fetch function that supports forecast mode
    const enhancedParams = {
      ...params,
      selectedParams,
      forecastMode
    };
    
    fetchAllDataWithForecast((data) => {
      setAllData(data);
      setLoading(false);
    }, enhancedParams);
  }, [selectedStations, dateRange.start, dateRange.end, dateRange.label, forecastMode, selectedParams]);

  // Get all unique station IDs
  const stations = useMemo(() => {
    if (!allData || !allData.Parameters) return [];
    return [...new Set(Object.values(allData.Parameters).flat().map(entry => entry.station_id))]
      .sort()
      .map(station => ({ value: station, label: station }));
  }, [allData]);

  // Ensure selectedStation is always a string (never null)
  useEffect(() => {
    if (stations.length > 0 && (selectedStation === null || selectedStation === undefined)) {
      setSelectedStation('');
    }
  }, [stations, selectedStation, setSelectedStation]);

  // Parameter options
  const parameterOptions = useMemo(() => {
    if (!allData || !allData.Parameters) return [];
    return Object.keys(allData.Parameters)
      .filter(param => !["ORP", "Turbidity", "Temperature", "Total Dissolved Solids"].includes(param))
      .map(param => ({ value: param, label: param }));
  }, [allData]);

  // Years, months, days from metadata
  const years = useMemo(() => dateMeta?.year?.data || [], [dateMeta]);
  const months = useMemo(() => {
    if (!dateRange.start?.getFullYear() || !dateMeta?.month) return [];
    return dateMeta.month[dateRange.start.getFullYear()] || [];
  }, [dateMeta, dateRange.start]);
  const days = useMemo(() => {
    if (!dateRange.start?.getFullYear() || !dateRange.start?.getMonth() || !dateMeta?.day) return [];
    const key = `${dateRange.start.getFullYear()}-${dateRange.start.getMonth() + 1}`;
    return dateMeta.day[key] || [];
  }, [dateMeta, dateRange.start]);

  // Filtered data - no longer filter here, let transformParametersToDashboardFormat handle it
  const filteredData = useMemo(() => {
    if (!allData || !allData.Parameters) return { Parameters: {} };
    // Return all data without filtering by station - filtering will happen in dashboard transform
    return allData;
  }, [allData]);

  // Reset lower filters when higher changes
  useEffect(() => { setDateRange(r => ({ ...r, month: null, day: null })); }, [dateRange.start]);
  useEffect(() => { setDateRange(r => ({ ...r, day: null })); }, [dateRange.month]);

  // Validation for filters
  useEffect(() => {
    let msg = '';
    if (!allData || !allData.Parameters || Object.keys(allData.Parameters).length === 0) {
      msg = 'No parameter data available.';
    } else if (
      selectedParams.length === 0 ||
      (selectedParams.length === 1 && selectedParams[0] === '')
    ) {
      msg = 'Please select at least one parameter.';
    } else if (
      selectedParams.some(param => !allData.Parameters[param] || allData.Parameters[param].length === 0)
    ) {
      msg = 'Some selected parameters have no data.';
    } else if (
      dateRange.start && dateRange.end && dateRange.start > dateRange.end
    ) {
      msg = 'Invalid date range selected.';
    } else if (
      // Remove this check: selectedStation && selectedStation !== '' && !Object.values(allData.Parameters).flat().some(e => e.station_id === selectedStation)
      false
    ) {
      // msg = 'No data available for the selected station.';
    }
    setValidationMsg(msg);
    setFadeAnim(true);
    if (msg) {
      const timeout = setTimeout(() => setFadeAnim(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [
    allData,
    selectedParams,
    dateRange,
    selectedStation
  ]);

  // Parameter multi-select (checklist)
  const handleParamToggle = (param) => {
    setSelectedParams(prev => {
      if (param === 'all') return ['all'];
      if (prev.includes('all')) return [param];
      if (prev.includes(param)) return prev.filter(p => p !== param);
      return [...prev, param];
    });
  };

  // Date popover outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePopoverRef.current && !datePopoverRef.current.contains(event.target)) {
        setDatePopoverOpen(false);
      }
    }
    if (datePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [datePopoverOpen]);

  // Close parameter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (paramDropdownRef.current && !paramDropdownRef.current.contains(event.target)) {
        setParamDropdownOpen(false);
      }
    }
    if (paramDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [paramDropdownOpen]);

  // Get min/max available dates from API metadata
  const { min: minAvailableDate, max: maxAvailableDate } = useMemo(
    () => getMinMaxDatesFromMeta(dateMeta),
    [dateMeta]
  );

  // Set default date range based on context and metadata (only once)
  const dateRangeInitializedRef = useRef(false);
  useEffect(() => {
    if (!dateMeta || dateRangeInitializedRef.current) return;
    
    if (fromDashboard) {
      // When coming from dashboard, default to All Time
      setDateRange({ start: null, end: null, label: 'All Time' });
    } else {
      // Otherwise, default to Today if available
      const qr = QUICK_RANGES.find(q => q.label === 'Today');
      if (qr) {
        const { start, end } = qr.get();
        setDateRange({ start, end, label: 'Today' });
      }
    }
    dateRangeInitializedRef.current = true;
  }, [dateMeta, fromDashboard]);

  // Adjust date range when switching between historical and forecast modes
  useEffect(() => {
    if (forecastMode) {
      // For forecast mode, default to next 6 months
      const today = getToday();
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + 6);
      setDateRange({ 
        start: today, 
        end: futureDate, 
        label: 'Next 6 Months' 
      });
    } else {
      // For historical mode, respect fromDashboard setting
      if (fromDashboard) {
        setDateRange({ 
          start: null, 
          end: null, 
          label: 'All Time' 
        });
      } else {
        // Default to today for normal navigation
        const today = getToday();
        setDateRange({ 
          start: today, 
          end: today, 
          label: 'Today' 
        });
      }
    }
  }, [forecastMode, fromDashboard]);

  // Clamp a date to available range
  function clampDateToAvailable(date) {
    if (!date) return null;
    if (minAvailableDate && date < minAvailableDate) return minAvailableDate;
    if (maxAvailableDate && date > maxAvailableDate) return maxAvailableDate;
    return date;
  }

  // When user picks a date, clamp it to available range
  const setDateRangeClamped = updater => {
    setDateRange(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return {
        start: clampDateToAvailable(next.start),
        end: clampDateToAvailable(next.end)
      };
    });
  };

  // When user picks a quick range, set dateRange with label and start/end
  const handleQuickRange = qr => {
    const { start, end } = qr.get();
    setDateRange({ start, end, label: qr.label });
    setDatePopoverOpen(false);
  };

  // When user picks a custom date range, set label to "Custom Range" 
  const handleCustomDateRange = updater => {
    setDateRange(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return {
        start: clampDateToAvailable(next.start),
        end: clampDateToAvailable(next.end),
        label: 'Custom Range'
      };
    });
  };

  // Compute dashboardDataByParameter for use in rendering
  const dashboardDataByParameter = useMemo(() => {
    return transformParametersToDashboardFormat(filteredData.Parameters, selectedStations);
  }, [filteredData.Parameters, selectedStations]);

  // UI
  return (
    <div className="mt-5 items-start w-full flex flex-col">
      {/* Filters */}
      <div className="flex flex-row flex-wrap gap-4 mb-3 w-full">
        {/* Parameter dropdown checklist */}
        <div className="flex flex-col min-w-[160px] max-w-[200px]" ref={paramDropdownRef}>
          <label className="mb-1 font-medium text-sm">Parameters</label>
          <div
            className="relative"
            tabIndex={0}
            onClick={e => {
              if (e.target === e.currentTarget || e.target.classList.contains('param-dropdown-toggle')) {
                setParamDropdownOpen(open => !open);
              }
            }}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="p-2 border rounded-md bg-white shadow flex justify-between items-center param-dropdown-toggle hover:border-blue-400 transition text-sm">
              <span className="truncate max-w-[100px]">
                {selectedParams.includes('all')
                  ? 'All Parameters'
                  : selectedParams.length === 0
                    ? <span className="text-gray-400">Select Parameter</span>
                    : selectedParams.join(', ')
                }
              </span>
              <span className="ml-2 text-blue-700">&#9662;</span>
            </div>
            {paramDropdownOpen && (
              <div
                className="absolute z-20 bg-white border border-blue-200 rounded-xl shadow-2xl mt-2 w-full animate-fadeIn"
                style={{ maxHeight: 220, overflowY: 'auto', minWidth: 140, fontSize: 13 }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b bg-blue-50 rounded-t-xl">
                  <label className="flex items-center font-semibold text-blue-700 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedParams.includes('all')}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedParams(['all']);
                        } else {
                          setSelectedParams([]);
                        }
                      }}
                      className="accent-blue-600"
                    />
                    <span className="ml-2">All Parameters</span>
                  </label>
                </div>
                {parameterOptions.map(opt => (
                  <div key={opt.value} className="px-3 py-1.5 hover:bg-blue-50 transition">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={
                          selectedParams.includes('all')
                            ? true
                            : selectedParams.includes(opt.value)
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedParams(prev =>
                              prev.includes('all')
                                ? [opt.value]
                                : [...prev, opt.value]
                            );
                          } else {
                            setSelectedParams(prev =>
                              prev.filter(p => p !== opt.value && p !== 'all')
                            );
                          }
                        }}
                        disabled={selectedParams.includes('all')}
                        className="accent-blue-600"
                      />
                      <span className="ml-2">{opt.label}</span>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Station dropdown */}
        <div className="flex flex-col min-w-[160px] max-w-[200px]">
          <label className="mb-1 font-medium text-sm">Station</label>
          <div className="relative">
            <Dropdown
              id="station-select"
              value={selectedStation == null ? '' : selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              options={[{ value: '', label: 'All Stations' }, ...stations]}
              defaultOption="All Stations"
              style={{
                maxHeight: 180,
                overflowY: 'auto',
                borderRadius: '0.5rem',
                borderColor: '#3b82f6',
                boxShadow: '0 2px 8px 0 #0001',
                appearance: 'none',
                paddingRight: 24,
                fontSize: 13,
                padding: '6px 10px'
              }}
            />
          </div>
        </div>
        {/* Forecast Mode Toggle */}
        <div className="flex flex-col min-w-[140px] max-w-[180px]">
          <label className="mb-1 font-medium text-sm">Data Type</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setForecastMode(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                !forecastMode 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              Historical
            </button>
            <button
              onClick={() => setForecastMode(true)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                forecastMode 
                  ? 'bg-green-600 text-white shadow' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              Forecast
            </button>
          </div>
        </div>
        {/* Date Range Filter */}
        <div className="flex flex-col min-w-[220px] max-w-[320px] relative">
          <label className="mb-1 font-medium text-sm">Date Range</label>
          <button
            className="w-full px-3 py-2 border rounded-md bg-white shadow flex justify-between items-center text-left hover:border-blue-400 transition text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={() => setDatePopoverOpen(open => !open)}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={datePopoverOpen}
          >
            <span className="truncate">{formatRangeLabel(dateRange.start, dateRange.end, dateRange.label)}</span>
            <span className="ml-2 text-blue-700 transition-transform duration-200" style={{ transform: datePopoverOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>&#9662;</span>
          </button>
          {/* Dropdown-style popover, anchored below the filter, wider and styled for clarity */}
          <div
            className={`absolute left-0 top-full mt-2 z-50 w-[320px] transition-all duration-200 ${datePopoverOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          >
            {datePopoverOpen && (
              <div
                ref={datePopoverRef}
                className="bg-white border border-blue-200 rounded-xl shadow-2xl p-4 animate-fadeIn"
                style={{
                  minWidth: 300,
                  maxWidth: 400,
                  width: '100%',
                  transition: 'transform 0.2s cubic-bezier(.4,2,.6,1), opacity 0.2s',
                  transform: datePopoverOpen ? 'scale(1)' : 'scale(0.97)',
                  opacity: datePopoverOpen ? 1 : 0
                }}
                onClick={e => e.stopPropagation()}
                tabIndex={-1}
              >
                <div className="flex flex-col gap-1">
                  {(forecastMode ? FORECAST_QUICK_RANGES : QUICK_RANGES).map(qr => {
                    const { start, end } = qr.get();
                    const isAllTime = qr.label === 'All Time';
                    const isDisabled = !isAllTime && (
                      (minAvailableDate && end && end < minAvailableDate) ||
                      (maxAvailableDate && start && start > maxAvailableDate)
                    );
                    return (
                      <button
                        key={qr.label}
                        className={`w-full text-left px-3 py-2 rounded-lg transition font-medium text-sm ${
                          isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50'
                        } ${dateRange.label === qr.label ? 'bg-blue-100 text-blue-800' : ''}`}
                        onClick={() => {
                          if (isDisabled) return;
                          handleQuickRange(qr);
                        }}
                        disabled={isDisabled}
                        tabIndex={0}
                        type="button"
                      >
                        {qr.label}
                      </button>
                    );
                  })}
                  <div className="border-t my-2" />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500 font-semibold">Custom Range</label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start ? formatDate(dateRange.start) : ''}
                        min={minAvailableDate ? formatDate(minAvailableDate) : undefined}
                        max={maxAvailableDate ? formatDate(maxAvailableDate) : undefined}
                        onChange={e => handleCustomDateRange(r => ({ ...r, start: parseDate(e.target.value) }))}
                        className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 text-xs transition-all duration-200"
                        style={{ fontSize: 12, width: '130px' }}
                        tabIndex={0}
                      />
                      <span className="self-center text-xs">to</span>
                      <input
                        type="date"
                        value={dateRange.end ? formatDate(dateRange.end) : ''}
                        min={minAvailableDate ? formatDate(minAvailableDate) : undefined}
                        max={maxAvailableDate ? formatDate(maxAvailableDate) : undefined}
                        onChange={e => handleCustomDateRange(r => ({ ...r, end: parseDate(e.target.value) }))}
                        className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-400 text-xs transition-all duration-200"
                        style={{ fontSize: 12, width: '130px' }}
                        tabIndex={0}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-xs"
                        onClick={() => setDatePopoverOpen(false)}
                        tabIndex={0}
                        type="button"
                      >Apply</button>
                      <button
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-xs"
                        onClick={() => { setDateRange({ start: null, end: null, label: 'All Time' }); setDatePopoverOpen(false); }}
                        tabIndex={0}
                        type="button"
                      >Clear</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overall CCME WQI Line Chart (All Parameters) - Only show when 4+ parameters selected */}
      {(() => {
        const actualSelectedParams = selectedParams.includes('all') 
          ? parameterOptions.map(opt => opt.value)
          : selectedParams;
        return actualSelectedParams.length >= 4;
      })() && (
        <WQI_linechart dashboardDataByParameter={dashboardDataByParameter} selectedStations={selectedStations} />
      )}
      {/* Use a fixed 2-column grid for the graphs */}
      <div
        className={
          "w-full grid grid-cols-2 gap-6"
        }
        style={{ alignItems: 'stretch' }}
      >
        {(selectedParams.includes('all')
          ? parameterOptions.map(opt => opt.value)
          : selectedParams
        ).map(param => {
          // Use dashboardDataByParameter for the new LineGraph
          const paramData = dashboardDataByParameter[param] || [];
          return (
            <div key={param} className="w-full animate-fadeIn">
              <LineGraph
                data={paramData}
                parameter={param}
                selectedStations={selectedStations.length ? selectedStations : paramData.length ? Object.keys(paramData[0]).filter(k => k !== 'date' && !k.endsWith('_quality')) : []}
                dataType={allData?.metadata?.data_type || ''}
                loading={loading}
              />
            </div>
          );
        })}
      </div>
      {/* Animations for fade-in */}
      <style>
        {`
        .animate-fadeIn {
          animation: fadeIn 0.7s cubic-bezier(.4,2,.6,1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.97);}
          to { opacity: 1; transform: translateY(0) scale(1);}
        }
        `}
      </style>
    </div>
  );
};

export default LineGraphControls;