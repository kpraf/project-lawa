import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import LG_modal from './LG_modal';

// Color palette for station lines
const COLORS = [
  "#e9242a", "#28a745", "#172851", "#ff9800", "#6f42c1", "#00bcd4", "#f44336", "#795548", "#607d8b", "#ffc107",
  "#8bc34a", "#9c27b0", "#2196f3", "#ff5722", "#cddc39", "#3f51b5", "#009688", "#bdbdbd", "#ffeb3b", "#b71c1c"
];

// Safe range thresholds for each parameter
const dangerLevels = {
  pH: { min: 6.5, max: 8.5 }, 'Dissolved Oxygen': { min: 5, max: 14 }, Conductivity: { min: 0, max: 500 },
  'Fecal Coliform': { min: 0, max: 200 }, 'Inorganic Phosphate': { min: 0, max: 0.1 }, Nitrate: { min: 0, max: 10 },
  Ammonia: { min: 0, max: 0.5 }, BOD: { min: 0, max: 3 }
};

const LineGraph = ({
  allData,
  selectedParam,
  width = "100%",
  height = 400,
  selectedStation
}) => {
  // Modal state for data point details
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPoint, setModalPoint] = useState(null);

  // New: Modal state for station selection when multiple stations at a point
  const [stationSelectModal, setStationSelectModal] = useState({ open: false, stations: [], payload: null });

  // Group data by station for the selected parameter
  const stationSeries = useMemo(() => {
    if (!allData?.Parameters?.[selectedParam]) return {};
    // Group by station_id
    const grouped = {};
    allData.Parameters[selectedParam].forEach(entry => {
      if (!entry.station_id) return;
      if (!grouped[entry.station_id]) grouped[entry.station_id] = [];
      grouped[entry.station_id].push({
        ...entry,
        value: Number(entry.value),
        dateObj: new Date(entry.time),
        iso: new Date(entry.time).toISOString()
      });
    });
    // Sort by date
    Object.values(grouped).forEach(arr => arr.sort((a, b) => a.dateObj - b.dateObj));
    return grouped;
  }, [allData, selectedParam]);

  // All station IDs for this parameter
  const allStationIds = useMemo(() => Object.keys(stationSeries), [stationSeries]);

  // Pagination for station filter UI
  const [stationPage, setStationPage] = useState(0);
  const STATIONS_PER_PAGE = 5;
  const totalPages = Math.ceil(allStationIds.length / STATIONS_PER_PAGE);

  // State for which stations are highlighted (visible)
  const [highlightedStations, setHighlightedStations] = useState(allStationIds.slice(0, STATIONS_PER_PAGE));

  // Update highlighted stations when station list changes
  useEffect(() => {
    setStationPage(0);
    setHighlightedStations(allStationIds.slice(0, STATIONS_PER_PAGE));
  }, [allStationIds.join(',')]);

  useEffect(() => {
    setHighlightedStations(allStationIds.slice(stationPage * STATIONS_PER_PAGE, (stationPage + 1) * STATIONS_PER_PAGE));
  }, [stationPage, allStationIds.join(',')]);

  // Filtered station IDs for display
  const visibleStationIds = useMemo(() => {
    if (selectedStation && selectedStation !== '') return [selectedStation];
    return highlightedStations;
  }, [selectedStation, highlightedStations]);

  // Build chart data: merge all station series by date (for multi-station view)
  const chartData = useMemo(() => {
    if (!visibleStationIds.length) return [];
    // Collect all unique dates
    const allDates = new Set();
    visibleStationIds.forEach(stationId => {
      (stationSeries[stationId] || []).forEach(entry => allDates.add(entry.iso));
    });
    const sortedDates = Array.from(allDates).sort();
    // Build data points for each date
    return sortedDates.map(iso => {
      const point = { iso };
      visibleStationIds.forEach(stationId => {
        const entry = (stationSeries[stationId] || []).find(e => e.iso === iso);
        point[stationId] = entry ? entry.value : null;
        point[`meta_${stationId}`] = entry || null;
      });
      point.dateObj = new Date(iso);
      return point;
    });
  }, [stationSeries, visibleStationIds]);

  // Danger level for this parameter
  const dangerLevel = dangerLevels[selectedParam] || {};

  // --- INTERACTIVE DOTS AND MODAL LOGIC REWORKED ---
  // Track hovered point (index and station) for dot rendering
  const [hovered, setHovered] = useState({ index: null, station: null });

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
            // Open modal for this data point
            setModalPoint(payload[`meta_${dataKey}`]);
            setModalOpen(true);
          }}
        />
      );
    }
    return null;
  }, [hovered]);

  // Custom tooltip: concise, clear, responsive, and enables dot on hover
  const CustomTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const filtered = payload.filter(item => item && item.value != null && visibleStationIds.includes(item.dataKey));
    if (!filtered.length) return null;
    return (
      <div className="custom-tooltip bg-white p-2 border rounded shadow-sm min-w-[140px]">
        <div className="font-semibold mb-1">{label}</div>
        {filtered.map((item, idx) => {
          const value = item.value;
          const station = item.dataKey;
          const isDanger = (dangerLevel.min !== undefined && value < dangerLevel.min) || (dangerLevel.max !== undefined && value > dangerLevel.max);
          return (
            <div
              key={station}
              className="flex items-center gap-2"
              onMouseEnter={() => setHovered({ index: item.index, station })}
              onMouseLeave={() => setHovered({ index: null, station: null })}
              style={{ cursor: 'pointer' }}
              onClick={e => {
                e.stopPropagation();
                setModalPoint(item.payload[`meta_${station}`]);
                setModalOpen(true);
              }}
            >
              <span style={{ color: COLORS[idx % COLORS.length], fontWeight: 600 }}>S{station}:</span>
              <span>{Number(value).toFixed(2)}</span>
              {isDanger && <span className="text-red-500 text-xs font-semibold ml-1" title="Out of safe range">!</span>}
            </div>
          );
        })}
      </div>
    );
  }, [visibleStationIds, dangerLevel]);

  // Chart mouse move: set hovered index and station for dots
  const handleMouseMove = useCallback((state) => {
    if (state && state.activeTooltipIndex != null && state.activePayload?.length) {
      // Find the first station with a value at this index
      const first = state.activePayload.find(item => item && item.value != null);
      setHovered({
        index: state.activeTooltipIndex,
        station: first ? first.dataKey : null
      });
    } else {
      setHovered({ index: null, station: null });
    }
  }, []);

  // Chart click: open modal for the hovered point if only one, else prompt for station
  const handleChartClick = useCallback(state => {
    if (!state?.activePayload?.length) return;
    const candidates = state.activePayload
      .filter(item => item && item.value != null && visibleStationIds.includes(item.dataKey))
      .map(item => ({
        stationId: item.dataKey,
        meta: item.payload[`meta_${item.dataKey}`]
      }))
      .filter(item => item.meta);

    if (candidates.length === 0) return;

    if (candidates.length === 1 || (selectedStation && selectedStation !== '')) {
      setModalPoint(candidates[0].meta);
      setModalOpen(true);
      return;
    }

    setStationSelectModal({
      open: true,
      stations: candidates,
      payload: state
    });
  }, [visibleStationIds, selectedStation]);

  // Station filter UI (checkboxes, pagination, show/clear all)
  const stationFilterUI = (
    <div className="mb-2 flex flex-wrap gap-3 items-center">
      <span className="font-semibold text-sm mr-2">Show/Hide Stations:</span>
      <div className="flex items-center gap-1">
        <button className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300" onClick={() => setStationPage(p => Math.max(0, p - 1))} disabled={stationPage === 0} type="button">&lt;</button>
        <span className="text-xs mx-1">Page {stationPage + 1} / {totalPages}</span>
        <button className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300" onClick={() => setStationPage(p => Math.min(totalPages - 1, p + 1))} disabled={stationPage === totalPages - 1} type="button">&gt;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.25rem 0.5rem', alignItems: 'center', minWidth: 0, flex: 1, maxWidth: 420 }}>
        {allStationIds.slice(stationPage * STATIONS_PER_PAGE, (stationPage + 1) * STATIONS_PER_PAGE).map((stationId, idx) => {
          const colorIdx = stationPage * STATIONS_PER_PAGE + idx;
          const visible = highlightedStations.includes(stationId);
          return (
            <label key={stationId} className="flex items-center cursor-pointer px-1 py-0.5 rounded transition hover:bg-gray-100"
              style={{
                border: visible ? `1px solid ${COLORS[colorIdx % COLORS.length]}` : '1px solid transparent',
                background: visible ? `${COLORS[colorIdx % COLORS.length]}11` : 'transparent',
                fontSize: '11px', margin: 0, minHeight: 0
              }}>
              <input type="checkbox" value={stationId} checked={visible} onChange={e => {
                const { value, checked } = e.target;
                setHighlightedStations(prev =>
                  checked
                    ? [...prev, value].filter((id, idx, arr) => arr.indexOf(id) === idx)
                    : prev.filter(stationId => stationId !== value)
                );
              }}
                style={{ accentColor: COLORS[colorIdx % COLORS.length], marginRight: 3, width: 13, height: 13 }} />
              <span style={{ color: COLORS[colorIdx % COLORS.length], fontWeight: visible ? 'bold' : 'normal', fontSize: '11px', whiteSpace: 'nowrap' }}>S{stationId}</span>
            </label>
          );
        })}
      </div>
      <button className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300" onClick={() => setHighlightedStations(allStationIds.slice(stationPage * STATIONS_PER_PAGE, (stationPage + 1) * STATIONS_PER_PAGE))} type="button" style={{ fontSize: '11px', height: 24 }}>Show All</button>
      <button className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300" onClick={() => setHighlightedStations([])} type="button" style={{ fontSize: '11px', height: 24 }}>Clear</button>
    </div>
  );

  // Custom legend for visible stations
  const CustomLegend = props => {
    const { payload } = props;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 120, marginRight: 24 }}>
        {payload.filter(entry => visibleStationIds.includes(entry.dataKey)).map((entry, idx) => (
          <span key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: entry.color, fontWeight: 'bold', marginBottom: 6 }}>
            <svg width="18" height="12" style={{ marginRight: 6, flexShrink: 0 }}>
              <line x1="2" y1="6" x2="16" y2="6" stroke={entry.color} strokeWidth="3" strokeLinecap="round" />
              <circle cx="9" cy="6" r="3" fill={entry.color} stroke="#fff" strokeWidth="1" />
            </svg>
            {entry.dataKey}
          </span>
        ))}
      </div>
    );
  };

  // Early returns for unsupported or missing data
  if (["ORP", "Turbidity", "Temperature", "TDS"].includes(selectedParam)) return null;
  if (!allData?.Parameters?.[selectedParam]) return <p>No data available for this parameter.</p>;

  // Only show "No valid data points" if there is truly no data for this parameter at all,
  // not just because the user hid all lines (visibleStationIds is empty)
  const hasAnyData =
    Array.isArray(allData.Parameters[selectedParam]) &&
    allData.Parameters[selectedParam].length > 0;

  // If there is no data at all for this parameter, show the message
  if (!hasAnyData) {
    return <p className="text-center text-gray-500">— No valid data points available for {selectedParam} —</p>;
  }

  // Station selection modal for multi-station point click
  const StationSelectModal = ({ open, stations, onSelect, onClose }) => {
    if (!open) return null;
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
            borderRadius: 12,
            boxShadow: '0 4px 24px #0002',
            padding: 24,
            minWidth: 260,
            maxWidth: 340,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 12, textAlign: 'center' }}>
            Select Station for Analytics
          </div>
          <div style={{ marginBottom: 16, fontSize: 14, color: '#444', textAlign: 'center' }}>
            Multiple stations have data at this point. Please choose one:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {stations.map(({ stationId, meta }) => (
              <button
                key={stationId}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #3b82f6',
                  background: '#f3f8ff',
                  color: '#1e40af',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                  minWidth: 120
                }}
                onClick={() => {
                  onSelect(meta);
                }}
              >
                Station {stationId}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Pass all relevant data to LG_modal for analytics
  // Find all history for the selected station and parameter
  const getAllHistory = (point) => {
    if (!point || !point.station_id || !allData?.Parameters?.[selectedParam]) return [];
    return allData.Parameters[selectedParam]
      .filter(e => e.station_id === point.station_id)
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  return (
    <div className="mt-5 bg-white p-5 rounded-sm shadow-md w-full">
      {/* Parameter title and entry count */}
      <div className="mb-2 text-xl font-bold text-blue-900 text-left flex items-center gap-3">
        <span>{selectedParam}</span>
        <span className="text-base font-normal text-gray-500">({chartData.length} entries)</span>
      </div>
      {/* Station filter UI */}
      {allStationIds.length > 1 && stationFilterUI}
      {/* Main chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          onClick={handleChartClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered({ index: null, station: null })}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="iso"
            type="category"
            allowDuplicatedCategory={false}
            minTickGap={20}
            tickFormatter={tick => {
              const d = new Date(tick);
              return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }}
          />
          <YAxis domain={[
            dangerLevel.min !== undefined ? dangerLevel.min - 1 : 'auto',
            dangerLevel.max !== undefined ? dangerLevel.max + 1 : 'auto'
          ]} />
          <Tooltip content={CustomTooltip} cursor={{ stroke: '#8884d8', strokeWidth: 2, opacity: 0.7 }} />
          <Legend layout="vertical" align="right" verticalAlign="middle" content={CustomLegend} />
          {/* Reference lines for safe range */}
          {dangerLevel.min !== undefined && <ReferenceLine y={dangerLevel.min} stroke="#e9242a" />}
          {dangerLevel.max !== undefined && <ReferenceLine y={dangerLevel.max} stroke="#e9242a" />}
          {/* Station lines */}
          {visibleStationIds.map((stationId, idx) => (
            <Line
              key={stationId}
              dataKey={stationId}
              name={`Station ${stationId}`}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={CustomDot}
              activeDot={false}
              legendType="line"
              isAnimationActive={true}
              connectNulls={true}
              hide={false}
              xAxisId={0}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {/* Modal for data point details */}
      <LG_modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        point={modalPoint}
        param={selectedParam}
        dangerLevel={dangerLevel}
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
      {/* Note about missing/invalid data */}
      <div style={{ fontSize: '11px', color: '#888', textAlign: 'left', marginTop: 6, marginBottom: -2, opacity: 0.7 }}>
        Gaps or breaks in lines may reflect missing or invalid data for certain stations or dates.
      </div>
    </div>
  );
};

export default LineGraph;

// --- Sparkline component for mini-charts in cards ---
/**
 * Sparkline
 * @param {Object[]} data - Array of { time, value } objects (time: ISO string or Date, value: number)
 * @param {string} color - Line color
 * @param {number} width - Width in px (default 90)
 * @param {number} height - Height in px (default 32)
 * @param {string} param - Parameter name (for accessibility)
 * @param {string} period - 'hour' or 'day' (default 'day')
 */
export function Sparkline({ data, color = "#3b82f6", width = 90, height = 32, param = '', period = 'day' }) {
  // Filter data for last hour or day
  const now = new Date();
  let filtered = [];
  if (period === 'hour') {
    const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
    filtered = data.filter(d => new Date(d.time) >= cutoff);
  } else {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    filtered = data.filter(d => new Date(d.time) >= cutoff);
  }
  // Sort by time ascending
  filtered = filtered.slice().sort((a, b) => new Date(a.time) - new Date(b.time));
  // If not enough points, fallback to last 10 points
  if (filtered.length < 2 && data.length > 1) {
    filtered = data.slice(-10);
  }
  // Map to { x, y }
  const chartData = filtered.map(d => ({
    x: typeof d.time === 'string' ? new Date(d.time).getTime() : d.time.getTime(),
    y: Number(d.value)
  }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 6, bottom: 6, left: 0, right: 0 }}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <span className="sr-only">{param} trend sparkline</span>
    </div>
  );
}