import React, { useState, useRef, useCallback, useMemo } from 'react';
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

const LineGraphModal = ({ open, onClose, data, parameter, selectedStations, dataType }) => {
  const chartRef = useRef(null);
  
  // Analytics modal state
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsModalPoint, setAnalyticsModalPoint] = useState(null);
  
  // Station selection modal state
  const [stationSelectModal, setStationSelectModal] = useState({ open: false, stations: [], payload: null });
  
  // Station pagination state
  const [stationPage, setStationPage] = useState(0);
  const LINES_PER_PAGE = 5; // Same as main LineGraph component
  const totalPages = Math.ceil(selectedStations.length / LINES_PER_PAGE);
  
  // Paginated stations for display
  const pagedStations = useMemo(() => {
    return selectedStations.slice(
      stationPage * LINES_PER_PAGE,
      (stationPage + 1) * LINES_PER_PAGE
    );
  }, [selectedStations, stationPage]);

  // Handle chart click for analytics modal
  const handleChartClick = useCallback((state) => {
    if (!state?.activePayload?.length) return;
    
    // Find all stations with data at this point (use selectedStations, not pagedStations for click detection)
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
      setAnalyticsModalPoint(candidates[0].meta);
      setAnalyticsModalOpen(true);
      return;
    }

    // Multiple stations - show selection modal
    setStationSelectModal({
      open: true,
      stations: candidates,
      payload: state
    });
  }, [selectedStations]);

  // Helper to get all history for analytics modal
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

  // Station selection modal component
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
          zIndex: 2000, // Higher than LineGraphModal
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

  if (!open) return null;

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

  // Check if this is forecast data
  const isForecastData = data?.some(row => 
    Object.keys(row).some(key => 
      key.endsWith('_quality') && row[key]?.is_forecast
    )
  );

  // Format date and hour for x-axis
  const formattedData = data?.map(row => {
    const { date, label } = parseBackendDate(row.date, dataType);
    return { ...row, dateHourLabel: label };
  }) || [];

  // Get danger threshold(s) for this parameter
  const danger = BAD_THRESHOLDS[parameter] || 
                 BAD_THRESHOLDS[parameter?.replace('Dissolved Oxygen', 'DO')] ||
                 BAD_THRESHOLDS[parameter?.replace('Inorganic Phosphate', 'Inorganic Phosphate')];

  // Map of units for each parameter
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

  const paramUnit = (BAD_THRESHOLDS[parameter] && BAD_THRESHOLDS[parameter].unit) ||
    PARAM_UNITS[parameter] || '';
  const yAxisLabel = paramUnit ? paramUnit : parameter || 'Value';
  const xAxisLabel = dataType && dataType.includes('averaged') ? 'Date' : 'Date & Hour';

  // Custom tooltip for modal
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    const hasForecast = payload.some(p => p.payload[`${p.dataKey}_quality`]?.is_forecast);
    
    return (
      <div className="bg-white p-3 rounded shadow text-sm border border-gray-200">
        <div className="font-semibold mb-1 flex items-center gap-2">
          {label}
          {hasForecast && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
              📈 Forecast
            </span>
          )}
        </div>
        {pagedStations.map((station, idx) => {
          const entry = payload.find(p => p.dataKey === station);
          if (!entry) return null;
          const value = entry.value;
          const quality = entry.payload[`${station}_quality`];
          const isBad = isBadClass(quality?.Class);
          const isForecast = quality?.is_forecast;
          return (
            <div key={station} className="flex items-center gap-2">
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
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
          💡 Click on any data point for detailed analytics
          {selectedStations.length > 1 && (
            <div className="mt-1">
              🎯 Multiple stations? You'll be able to choose which one to analyze
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-7xl w-full h-5/6 mx-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-blue-900">
              {parameter}
              {isForecastData && (
                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  📈 Forecast
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Station pagination - only show if more than LINES_PER_PAGE stations */}
            {selectedStations.length > LINES_PER_PAGE && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={() => setStationPage(p => Math.max(0, p - 1))}
                  disabled={stationPage === 0}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-xs">
                  Page {stationPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setStationPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={stationPage === totalPages - 1}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  →
                </button>
                <span className="text-xs text-gray-500 ml-2">
                  ({stationPage * LINES_PER_PAGE + 1}-{Math.min((stationPage + 1) * LINES_PER_PAGE, selectedStations.length)} of {selectedStations.length})
                </span>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Chart container */}
        <div className="flex-1 p-4" ref={chartRef}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={formattedData}
              onClick={handleChartClick}
            >
              <XAxis
                dataKey="dateHourLabel"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                label={{
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -5,
                  fontSize: 14,
                  fontWeight: 700,
                  fill: '#333'
                }}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  fill: '#333'
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ paddingBottom: '20px' }}
              />
              
              {pagedStations.map((station, idx) => {
                const color = COLORS[idx % COLORS.length];
                return (
                  <Line
                    key={station}
                    type="monotone"
                    dataKey={station}
                    stroke={color}
                    strokeWidth={3}
                    dot={false}
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
        </div>

        {/* Analytics Modal */}
        <LG_modal
          open={analyticsModalOpen}
          onClose={() => setAnalyticsModalOpen(false)}
          point={analyticsModalPoint}
          param={parameter}
          dangerLevel={danger || {}}
          allHistory={getAllHistory(analyticsModalPoint)}
          sparklineMode={true}
        />

        {/* Station Selection Modal */}
        <StationSelectModal
          open={stationSelectModal.open}
          stations={stationSelectModal.stations}
          onSelect={meta => {
            setStationSelectModal({ open: false, stations: [], payload: null });
            setAnalyticsModalPoint(meta);
            setAnalyticsModalOpen(true);
          }}
          onClose={() => setStationSelectModal({ open: false, stations: [], payload: null })}
        />
      </div>
    </div>
  );
};

export default LineGraphModal;
