import React, { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { COLORS, BAD_THRESHOLDS } from '../utils/constants';
import LG_modal from '../../components/Dashboard/LG_modal';
import LineGraphModal from './LineGraphModal';
import { getGrade } from '../../components/Dashboard/paramgrade';

// Helper to determine if a class is bad
const isBadClass = (cls) => cls && (cls === 'Class D' || cls === 'D' || cls === 'Failed');

// Parse backend date string (YYYY-MM-DD:HH) to JS Date and label
function parseBackendDate(str, dataType) {
  if (!str) return { date: null, label: '' };
  const match = str.match(/^(\d{4}-\d{2}-\d{2}):(\d{2})$/);
  if (match) {
    const dateObj = new Date(`${match[1]}T${match[2]}:00:00`);
    const label = dataType && dataType.includes('averaged')
      ? dateObj.toLocaleDateString()
      : `${dateObj.toLocaleDateString()} ${match[2]}:00`;
    return { date: dateObj, label };
  }
  const dateObj = new Date(str);
  return { date: dateObj, label: dateObj.toLocaleDateString() };
}

// Ensure y-axis always includes the danger line(s)
function getYAxisDomain(data, danger) {
  const values = [];
  data.forEach(row => {
    Object.values(row).forEach(val => {
      if (typeof val === 'number' && !isNaN(val)) values.push(val);
    });
  });
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (Array.isArray(danger)) {
    danger.forEach(d => {
      if (d < min) min = d;
      if (d > max) max = d;
    });
  } else if (danger !== undefined) {
    if (danger < min) min = danger;
    if (danger > max) max = danger;
  }
  return [Math.floor(min - 1), Math.ceil(max + 1)];
}

// Custom dot renderer
const CustomDot = ({ cx, cy, payload, station }) => {
  const quality = payload[`${station}_quality`];
  if (isBadClass(quality?.Class)) {
    return <circle cx={cx} cy={cy} r={6} fill="red" stroke="black" strokeWidth={1.5} />;
  }
  return <circle cx={cx} cy={cy} r={4} fill="white" stroke="#8884d8" strokeWidth={1} />;
};

// Improved CustomTooltip
const CustomTooltip = ({ active, payload, label, selectedStations, parameter }) => {
  if (!active || !payload || !payload.length) return null;

  // Find unit for the parameter
  const PARAM_UNITS = {
    'pH': '',
    'Dissolved Oxygen': 'mg/L',
    'DO': 'mg/L',
    'Conductivity': 'µS/cm',
    'Fecal Coliform': 'CFU/100mL',
    'Inorganic Phosphate': 'mg/L',
    'Nitrate': 'mg/L',
    'Ammonia': 'mg/L',
    'BOD': 'mg/L',
    'Turbidity': 'NTU',
    'Temperature': '°C',
    'TDS': 'mg/L',
    'ORP': 'mV'
  };
  const unit = PARAM_UNITS[parameter] || '';

  return (
    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-base font-semibold text-blue-900">{label}</div>
      </div>
      {selectedStations.map((station, idx) => {
        const entry = payload.find(p => p.dataKey === station);
        if (!entry) return null;
        const value = entry.value;
        const quality = entry.payload[`${station}_quality`];
        const isBad = isBadClass(quality?.Class);
        return (
          <div
            key={station}
            className={`flex items-center gap-2 mb-1 px-2 py-1 rounded ${isBad ? 'bg-red-50' : 'hover:bg-blue-50'}`}
            style={{ transition: 'background 0.15s' }}
          >
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            <span className="font-medium text-gray-800">{station}:</span>
            <span className="font-mono text-gray-900">
              {value !== undefined && value !== null ? 
                (typeof value === 'number' ? value.toFixed(2) : value) : 
                <span className="text-gray-400">N/A</span>
              }
              {unit && <span className="ml-1 text-xs text-gray-500">{unit}</span>}
            </span>
            {quality && quality.Class && (
              <span
                className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded ${isBad ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-800'}`}
                title={quality.Range ? `Range: ${quality.Range}` : ''}
              >
                {quality.Class.startsWith('Class') ? quality.Class : `Class ${quality.Class}`}
              </span>
            )}
            {isBad && (
              <span title="Bad water quality" className="ml-1 text-red-500 text-lg">⚠️</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const LineGraph = ({ data, parameter, selectedStations, dataType, loading, error }) => {
  // --- Only show dots on hover ---
  const [hovered, setHovered] = useState({ index: null, station: null });

  // --- Modal analysis state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPoint, setModalPoint] = useState(null);
  const [stationSelectModal, setStationSelectModal] = useState({ open: false, stations: [], payload: null });
  
  // --- Line Graph Modal state ---
  const [lineGraphModalOpen, setLineGraphModalOpen] = useState(false);

  // --- Only show 5 lines at a time, paginate the rest ---
  const [stationPage, setStationPage] = useState(0);
  const LINES_PER_PAGE = 5;
  const totalPages = Math.ceil(selectedStations.length / LINES_PER_PAGE);

  // Sorted stations for consistent order
  const sortedStations = [...selectedStations].sort((a, b) => (a || '').localeCompare(b || ''));

  // Stations to show on current page
  const pagedStations = sortedStations.slice(
    stationPage * LINES_PER_PAGE,
    (stationPage + 1) * LINES_PER_PAGE
  );

  // --- Parameter grading system (AA, A, B, C, D) ---
  // Using imported getGrade function from paramgrade.js for consistency

  // Compute latest value per station in current data range
  const latestStationGrades = useMemo(() => {
    const result = {};
    if (!data || !data.length) return result;
    pagedStations.forEach(station => {
      let last = null;
      for (let i = data.length - 1; i >= 0; i--) {
        const row = data[i];
        if (row[station] !== undefined && row[station] !== null) {
          last = row[station];
          break;
        }
      }
      if (last !== null) {
        result[station] = getGrade(parameter, last);
      }
    });
    return result;
  }, [data, pagedStations, parameter]);

  // --- Station pagination controls with class legend next to legend color ---
  const stationPaginationUI = (
    <div className="flex items-center gap-2 mb-2 flex-wrap">
      <button
        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300" 
        onClick={() => setStationPage(p => Math.max(0, p - 1))}
        disabled={stationPage === 0}
        type="button"
      >
        &lt;
      </button>
      <span className="text-xs mx-1">
        Page {stationPage + 1} / {totalPages}
      </span>
      <button
        className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
        onClick={() => setStationPage(p => Math.min(totalPages - 1, p + 1))}
        disabled={stationPage === totalPages - 1}
        type="button"
      >
        &gt;
      </button>
      <span className="text-xs text-gray-500 ml-2">
        Showing stations {stationPage * LINES_PER_PAGE + 1}
        -
        {Math.min((stationPage + 1) * LINES_PER_PAGE, sortedStations.length)}
        {" "}of {sortedStations.length}
      </span>
      {/* Station legends removed; handled by the side legend */}
    </div>
  );

  // Custom dot: only show when hovered, and clickable for modal
  const CustomDot = useCallback((props) => {
    const { cx, cy, index, dataKey, payload } = props;
    if (hovered.index === index && hovered.station === dataKey) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={7}
          fill="#fff"
          stroke="#3b82f6"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          onClick={e => {
            e.stopPropagation();
            setModalPoint({
              ...payload,
              station_id: dataKey,
              value: payload[dataKey],
              time: payload.date
            });
            setModalOpen(true);
          }}
        />
      );
    }
    return null;
  }, [hovered]);

  // Custom tooltip: concise, clear, responsive, and enables dot on hover and modal on click
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    
    // Check if any data point is from forecast
    const hasForecast = payload.some(p => p.payload[`${p.dataKey}_quality`]?.is_forecast);
    
    return (
      <div className="bg-white p-3 rounded shadow text-sm border border-gray-200">
        <div className="font-semibold mb-1 flex items-center gap-2">
          {label}
          {hasForecast && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              Forecast
            </span>
          )}
        </div>
        {selectedStations.map((station, idx) => {
          const entry = payload.find(p => p.dataKey === station);
          if (!entry) return null;
          const value = entry.value;
          const quality = entry.payload[`${station}_quality`];
          const isBad = isBadClass(quality?.Class);
          const isForecast = quality?.is_forecast;
          return (
            <div
              key={station}
              className="flex items-center gap-2"
              onMouseEnter={() => setHovered({ index: entry.index, station })}
              onMouseLeave={() => setHovered({ index: null, station: null })}
              style={{ cursor: 'pointer' }}
              onClick={e => {
                e.stopPropagation();
                setModalPoint({
                  ...entry.payload,
                  station_id: station,
                  value: entry.value,
                  time: entry.payload.date
                });
                setModalOpen(true);
              }}
            >
              <span style={{ color: COLORS[idx % COLORS.length], fontWeight: 600 }}>
                {station}:
                {isForecast && (
                  <span className="ml-1 text-xs text-green-600">📈</span>
                )}
              </span>
              <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
              {quality && quality.Class && (
                <span className="ml-2 text-xs" style={{ color: isBad ? 'red' : '#666' }}>
                  {quality.Class.startsWith('Class') ? quality.Class : `Class ${quality.Class}`} {quality.Range && <span>({quality.Range})</span>}
                  {isBad && <span title="Bad water quality" className="ml-1">⚠️</span>}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [selectedStations, hovered]);

  // --- Modal station selection logic ---
  const handleChartClick = useCallback((state) => {
    if (!state?.activePayload?.length) return;
    // Find all stations with data at this point
    const candidates = state.activePayload
      .filter(item => item && item.value != null && selectedStations.includes(item.dataKey))
      .map(item => ({
        stationId: item.dataKey,
        meta: {
          ...item.payload,
          station_id: item.dataKey,
          value: item.value,
          time: item.payload.date
        }
      }))
      .filter(item => item.meta);

    if (candidates.length === 0) return;

    if (candidates.length === 1) {
      setModalPoint(candidates[0].meta);
      setModalOpen(true);
      return;
    }

    setStationSelectModal({
      open: true,
      stations: candidates,
      payload: state
    });
  }, [selectedStations]);

  // Helper to get all history for modal
  const getAllHistory = useCallback((point) => {
    if (!point || !point.station_id || !data) return [];
    return data
      .filter(row => row[point.station_id] !== undefined && row[point.station_id] !== null)
      .map(row => ({
        time: row.date,
        value: row[point.station_id],
        station_id: point.station_id
      }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [data]);

  // --- Station selection modal ---
  const StationSelectModal = ({ open, stations, onSelect, onClose }) => {
    if (!open) return null;
    // Sort stations by id or name for consistent order
    const sortedStations = [...stations].sort((a, b) =>
      (a.stationId || '').localeCompare(b.stationId || '')
    );
    // Chunk into rows of 6
    const chunkArray = (arr, size) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
      }
      return result;
    };
    const rows = chunkArray(sortedStations, 6);

    return (
      <div
        style={{
          position: 'fixed',
          zIndex: 1000,
          left: 0, top: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px #0003',
            padding: 32,
            minWidth: 0,
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto',
            boxSizing: 'border-box'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 10, textAlign: 'center', color: '#1e3a8a' }}>
            Select Station for Analytics
          </div>
          <div style={{ marginBottom: 20, fontSize: 15, color: '#444', textAlign: 'center' }}>
            Multiple stations have data at this point. Please choose one:
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
            width: '100%'
          }}>
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  display: 'flex',
                  gap: 12,
                  width: '100%',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              >
                {row.map(({ stationId, meta }, idx) => (
                  <button
                    key={stationId}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '2px solid #3b82f6',
                      background: '#f0f7ff',
                      color: '#1e40af',
                      fontWeight: 600,
                      fontSize: 16,
                      cursor: 'pointer',
                      textAlign: 'center',
                      minWidth: 110,
                      margin: 0,
                      boxShadow: '0 1px 4px #0001',
                      transition: 'background 0.15s, border 0.15s'
                    }}
                    onClick={() => {
                      onSelect(meta);
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#dbeafe'}
                    onMouseOut={e => e.currentTarget.style.background = '#f0f7ff'}
                  >
                    Station {stationId}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Parameter descriptions (add/adjust as needed)
  const PARAMETER_DESCRIPTIONS = {
    'pH': 'A measure of how acidic/basic water is.',
    'Dissolved Oxygen': 'Amount of oxygen available in water for aquatic life.',
    'DO': 'Amount of oxygen available in water for aquatic life.',
    'Conductivity': 'Water’s ability to conduct electricity, related to ion concentration.',
    'Fecal Coliform': 'Bacteria indicating possible contamination by fecal matter.',
    'Inorganic Phosphate': 'Level of inorganic phosphate, a nutrient that can cause algal blooms.',
    'Nitrate': 'A nutrient that can cause water quality issues at high levels.',
    'Ammonia': 'A toxic form of nitrogen for aquatic organisms.',
    'BOD': 'Biochemical Oxygen Demand, indicating organic pollution.',
    'Turbidity': 'Clarity of water, affected by suspended particles.',
    'Temperature': 'Water temperature, affects dissolved oxygen and aquatic life.',
    'TDS': 'Total Dissolved Solids, sum of all minerals, salts, and metals in water.',
    'ORP': 'Oxidation-Reduction Potential, indicates water’s ability to break down contaminants.'
    // ...add more as needed
  };

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-white rounded-lg shadow-lg p-4 pb-20 relative flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-800 mb-4"></div>
          <div className="font-semibold text-lg" style={{ color: '#0047AB' }}>
            Fetching <span style={{ color: '#e9242a' }}>{parameter}</span> Data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[500px] bg-white rounded-lg shadow-lg p-4 pb-20 flex flex-col items-center justify-center relative">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="mb-3">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#fee2e2"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
            </svg>
          </div>
          <div className="text-red-700 font-semibold text-lg mb-2">Error Loading Data</div>
          <div className="text-gray-700 text-base text-center">{error}</div>
        </div>
      </div>
    );
  }

  if (!data || !data.length) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px] animate-fadeIn">
        <div className="text-gray-400 text-center text-lg font-semibold">
          No data available for parameter: <span className="font-bold">{parameter}</span>
        </div>
      </div>
    );
  }

  // Show message if only 1 data entry
  if (data.length === 1) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px] animate-fadeIn">
        <div className="text-gray-400 text-center text-lg font-semibold">
          Not enough data to display a line graph for <span className="font-bold">{parameter}</span>.
        </div>
      </div>
    );
  }

  // Format date and hour for x-axis
  const formattedData = data?.map(row => {
    const { date, label } = parseBackendDate(row.date, dataType);
    return { ...row, dateHourLabel: label };
  }) || [];

  // Get danger threshold(s) for this parameter
  const danger = BAD_THRESHOLDS[parameter] || 
                 BAD_THRESHOLDS[parameter?.replace('Dissolved Oxygen', 'DO')] ||
                 BAD_THRESHOLDS[parameter?.replace('Inorganic Phosphate', 'Inorganic Phosphate')];

  // Map of units for each parameter (add or adjust as needed)
  const PARAM_UNITS = {
    'pH': '', // pH is unitless
    'Dissolved Oxygen': 'mg/L',
    'Conductivity': 'µS/cm',
    'Fecal Coliform': 'CFU/100mL',
    'Inorganic Phosphate': 'mg/L',
    'Nitrate': 'mg/L',
    'Ammonia': 'mg/L',
    'BOD': 'mg/L',
    'Turbidity': 'NTU',
    'Temperature': '°C',
    'TDS': 'mg/L',
    'ORP': 'mV'
    // ...add more as needed
  };

  // Get y-axis label: show unit if available, otherwise parameter name
  const paramUnit =
    (BAD_THRESHOLDS[parameter] && BAD_THRESHOLDS[parameter].unit) ||
    PARAM_UNITS[parameter] ||
    '';
  const yAxisLabel =
    paramUnit
      ? paramUnit
      : parameter || 'Value';

  // X-axis label
  const xAxisLabel = dataType && dataType.includes('averaged')
    ? 'Date'
    : 'Date & Hour';

  // Check if this is forecast data
  const isForecastData = data?.some(row => 
    Object.keys(row).some(key => 
      key.endsWith('_quality') && row[key]?.is_forecast
    )
  );

  return (
    <div
      className="w-full max-w-full rounded-lg shadow-lg p-2 sm:p-4 pb-20 relative bg-white border-0"
      style={{
        boxShadow: '0 6px 32px 0 #2563eb22, 0 1.5px 8px 0 #0001',
        minHeight: 320,
        height: '60vh',
        maxHeight: 600,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Parameter label inside the container */}
      <div className="mb-2 text-lg sm:text-xl font-bold text-blue-900 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span
          className="flex items-center gap-2"
          title={PARAMETER_DESCRIPTIONS[parameter] || ''}
          style={{ cursor: PARAMETER_DESCRIPTIONS[parameter] ? 'help' : 'default' }}
        >
          {parameter}
          {isForecastData && (
            <span className="text-sm bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              📈 Forecast
            </span>
          )}
          {PARAMETER_DESCRIPTIONS[parameter] && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline-block h-5 w-5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              title={PARAMETER_DESCRIPTIONS[parameter]}
              style={{ verticalAlign: 'middle' }}
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white"/>
              <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor" fontFamily="Arial" dy="0.3em">i</text>
            </svg>
          )}
        </span>
        <span className="text-sm sm:text-base text-gray-500 font-semibold ml-0 sm:ml-2">
          {data ? data.length : 0} Data Entries
        </span>
      </div>
      {/* Station pagination controls */}
      {sortedStations.length > LINES_PER_PAGE && (
        <div className="w-full flex flex-wrap items-center gap-2 mb-2 overflow-x-auto">
          {stationPaginationUI}
        </div>
      )}
      
      <div className="flex-1 min-h-[200px] w-full relative">
        <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={200}>
          <LineChart
            data={formattedData}
            margin={{ top: 20, right: 10, left: 10, bottom: 50 }}
            onMouseLeave={() => setHovered({ index: null, station: null })}
            onClick={handleChartClick}
          >
            <XAxis
              dataKey="dateHourLabel"
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
              minTickGap={10}
              label={{
                value: xAxisLabel,
                position: 'insideBottom',
                offset: -45,
                fontSize: 13,
                fontWeight: 700,
                fill: '#333',
                style: { wordBreak: 'break-word', whiteSpace: 'pre-line' }
              }}
            />
            <YAxis
              allowDecimals
              domain={getYAxisDomain(formattedData, danger)}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fontSize: 13,
                fontWeight: 700,
                fill: '#333',
                style: { wordBreak: 'break-word', whiteSpace: 'pre-line' }
              }}
            />
            <Tooltip content={<CustomTooltip selectedStations={pagedStations} parameter={parameter} />} />
            {/* Stations label above the legend */}
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              wrapperStyle={{
                right: 0,
                top: 60,
                width: '100%',
                maxWidth: 160,
                paddingLeft: 8,
                fontSize: 13
              }}
              content={props => {
                // Use the same logic as latestStationGrades, but for all visible stations
                const legendGrades = {};
                if (data && data.length && props.payload) {
                  props.payload.forEach((entry) => {
                    let last = null;
                    for (let i = data.length - 1; i >= 0; i--) {
                      const row = data[i];
                      if (row[entry.dataKey] !== undefined && row[entry.dataKey] !== null) {
                        last = row[entry.dataKey];
                        break;
                      }
                    }
                    if (last !== null) {
                      legendGrades[entry.dataKey] = getGrade(parameter, last);
                    }
                  });
                }
                
                // Color mapping from CSS classes to hex colors
                const colorMap = {
                  'bg-green-300': '#86efac',
                  'bg-green-200': '#bbf7d0', 
                  'bg-green-100': '#dcfce7',
                  'bg-green-500': '#22c55e',
                  'bg-red-300': '#fca5a5',
                  'bg-black': '#000000',
                  'bg-gray-500': '#6b7280'
                };
                
                return (
                  <div style={{ minWidth: 80 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#1e3a8a',
                      marginBottom: 8,
                      marginLeft: 8
                    }}>
                      Stations
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {props.payload && props.payload.map((entry) => {
                        // Use the same color for a station everywhere, based on its index in sortedStations
                        const stationIdx = sortedStations.indexOf(entry.dataKey);
                        const color = COLORS[stationIdx % COLORS.length];
                        const gradeObj = legendGrades[entry.dataKey];
                        const gradeColor = gradeObj?.color ? colorMap[gradeObj.color] || gradeObj.color : '#6b7280';
                        return (
                          <li key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{
                              display: 'inline-block',
                              width: 14,
                              height: 4,
                              background: color,
                              marginRight: 8,
                              borderRadius: 2
                            }} />
                            <span style={{ color, fontWeight: 600, fontSize: 12 }}>{entry.dataKey}</span>
                            {gradeObj && gradeObj.grade && (
                              <span
                                style={{
                                  backgroundColor: gradeColor,
                                  color: ['#FDDA0D', '#FFA500', '#EA4228', '#fca5a5'].includes(gradeColor) ? '#222' : '#fff',
                                  borderRadius: 4,
                                  padding: '0 6px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  marginLeft: 6,
                                  minWidth: 18,
                                  display: 'inline-block',
                                }}
                                title={`Latest: ${gradeObj.grade.includes('Class') ? gradeObj.grade : `Class ${gradeObj.grade}`}`}
                              >
                                {gradeObj.grade.includes('Class') ? gradeObj.grade : `Class ${gradeObj.grade}`}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }}
            />
            {pagedStations.map((station, idx) => {
              const color = COLORS[idx % COLORS.length];
              
              return (
                <Line
                  key={station}
                  type="monotone"
                  dataKey={station}
                  stroke={color}
                  dot={false}
                  activeDot={CustomDot}
                  strokeWidth={2}
                  isAnimationActive={false}
                  connectNulls
                />
              );
            })}
            {/* Draw red danger line(s) */}
            {Array.isArray(danger)
              ? danger.map((val, i) => (
                  <ReferenceLine
                    key={val}
                    y={val}
                    stroke="red"
                    strokeDasharray="6 6"
                    label={{ value: 'Danger', position: 'left', fill: 'red', fontSize: 12 }}
                  />
                ))
              : danger !== undefined && (
                  <ReferenceLine
                    y={danger}
                    stroke="red"
                    strokeDasharray="6 6"
                    label={{ value: 'Danger', position: 'left', fill: 'red', fontSize: 12 }}
                  />
                )}
          </LineChart>
        </ResponsiveContainer>
        
        {/* Modal View Button - positioned at bottom right */}
        <button
          onClick={() => setLineGraphModalOpen(true)}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200 z-10"
          title="Open enlarged view"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" 
            />
          </svg>
        </button>
      </div>
      {/* Modal for data point details */}
      <LG_modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        point={modalPoint}
        param={parameter}
        dangerLevel={danger || {}}
        allHistory={getAllHistory(modalPoint)}
        sparklineMode={true}
      />
      {/* Modal for station selection */}
      <StationSelectModal
        open={stationSelectModal.open}
        stations={stationSelectModal.stations}
        onSelect={meta => {
          setStationSelectModal({ open: false, stations: [], payload: null });
          setModalPoint(meta);
          setModalOpen(true);
        }}
        onClose={() => setStationSelectModal({ open: false, stations: [], payload: null })}
      />
      
      {/* Line Graph Modal for enlarged view */}
      <LineGraphModal
        open={lineGraphModalOpen}
        onClose={() => setLineGraphModalOpen(false)}
        data={data}
        parameter={parameter}
        selectedStations={sortedStations}
        dataType={dataType}
      />
    </div>
  );
};

export default LineGraph;