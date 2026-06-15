


import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

import { calculateWQI, getCCMEWQIGrade } from './OverallWaterQuality';
import { COLORS } from '../../linegraph-dashboard/utils/constants';

// Helper: get all unique stations from dashboardDataByParameter
function getAllStations(parameterData) {
  const stations = new Set();
  Object.values(parameterData || {}).forEach(paramArr => {
    paramArr.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k !== 'date' && !k.endsWith('_quality')) stations.add(k);
      });
    });
  });
  return Array.from(stations).sort();
}

// Helper: get all unique dates from dashboardDataByParameter
function getAllDates(parameterData) {
  return Array.from(new Set(
    Object.values(parameterData || {})
      .flat()
      .map(row => row.date)
  )).sort();
}

// For a given station, build a time series of {date, WQI}
function buildWQITimeSeries(parameterData, station) {
  const allDates = getAllDates(parameterData);
  return allDates.map(date => {
    // For each parameter, get the value for this station at this date
    const parameters = {};
    Object.entries(parameterData || {}).forEach(([param, paramArr]) => {
      const row = paramArr.find(r => r.date === date);
      if (row && row[station] !== undefined && row[station] !== null) {
        parameters[param] = { value: row[station] };
      }
    });
    return { date, WQI: calculateWQI(parameters) };
  });
}

// For "overall" (all stations), aggregate all values for each parameter at each date
function buildOverallWQITimeSeries(parameterData) {
  const allDates = getAllDates(parameterData);
  return allDates.map(date => {
    const parameters = {};
    Object.entries(parameterData || {}).forEach(([param, paramArr]) => {
      // For this date, collect all station values for this parameter
      const row = paramArr.find(r => r.date === date);
      if (row) {
        // Average all station values for this parameter at this date
        const values = Object.entries(row)
          .filter(([k, v]) => k !== 'date' && !k.endsWith('_quality') && typeof v === 'number')
          .map(([k, v]) => v);
        if (values.length) {
          // Use mean value for WQI calculation
          parameters[param] = { value: values.reduce((a, b) => a + b, 0) / values.length };
        }
      }
    });
    return { date, WQI: calculateWQI(parameters) };
  });
}




// Accept selectedStations as prop (array of station ids, or empty for all/overall)

const WQI_linechart = ({ dashboardDataByParameter, selectedStations }) => {
  // Get all stations in the data
  const allStations = React.useMemo(() => getAllStations(dashboardDataByParameter), [dashboardDataByParameter]);

  // Only show selected stations (or all if none selected)
  const stationsToShow = (!selectedStations || selectedStations.length === 0 || selectedStations.includes(''))
    ? allStations
    : selectedStations;

  // Pagination state
  const LINES_PER_PAGE = 5;
  const [stationPage, setStationPage] = React.useState(0);
  const totalPages = Math.ceil(stationsToShow.length / LINES_PER_PAGE);
  const pagedStations = React.useMemo(() => stationsToShow.slice(stationPage * LINES_PER_PAGE, (stationPage + 1) * LINES_PER_PAGE), [stationsToShow, stationPage]);

  // Modal state for analysis
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPoint, setModalPoint] = useState(null);
  // Station selection modal state (must be before any early return)
  const [stationSelectModal, setStationSelectModal] = useState({ open: false, stations: [], payload: null });

  // --- Loading state ---
  const [loading, setLoading] = useState(true);
  // Set loading true on data change
  React.useEffect(() => {
    setLoading(true);
    // Simulate async calculation (or use a timeout to allow spinner to show)
    const t = setTimeout(() => setLoading(false), 350); // 350ms for smoothness
    return () => clearTimeout(t);
  }, [dashboardDataByParameter, selectedStations, stationPage]);

  // Build data series for each station, filter out stations with no WQI data
  // Treat 0 and null/NaN as missing (for line breaks)
  const series = useMemo(() => {
    return pagedStations.map((station, i) => ({
      name: station,
      color: COLORS[i % COLORS.length],
      data: buildWQITimeSeries(dashboardDataByParameter, station).map(d => {
        // Treat 0, null, undefined, NaN as missing for line breaks
        return (d.WQI === null || d.WQI === undefined || isNaN(d.WQI) || d.WQI === 0)
          ? { ...d, WQI: null }
          : d;
      })
    }))
    .filter(s => s.data.some(d => typeof d.WQI === 'number' && !isNaN(d.WQI) && d.WQI !== 0));
  }, [dashboardDataByParameter, pagedStations]);

  // Build chart data: merge by date, each line as a key, use null for missing WQI (for line breaks)
  const chartData = useMemo(() => {
    if (!series.length) return [];
    const allDates = getAllDates(dashboardDataByParameter);
    return allDates.map(date => {
      const row = { date };
      series.forEach(s => {
        const point = s.data.find(d => d.date === date);
        // If WQI is null, keep as null for line break
        row[s.name] = (point && typeof point.WQI === 'number' && !isNaN(point.WQI) && point.WQI !== 0) ? point.WQI : null;
      });
      // Only include row if at least one station has WQI for this date
      const hasData = Object.keys(row).some(k => k !== 'date' && typeof row[k] === 'number' && !isNaN(row[k]) && row[k] !== 0);
      return hasData ? row : null;
    }).filter(Boolean);
  }, [series, dashboardDataByParameter]);

  if (loading) {
    return (
      <div className="w-full h-[320px] bg-white rounded-lg shadow-lg p-4 pb-20 relative flex items-center justify-center">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-800 mb-4"></div>
          <div className="font-semibold text-lg" style={{ color: '#0047AB' }}>
            Fetching <span style={{ color: '#2563eb' }}>WQI</span> Data...
          </div>
        </div>
      </div>
    );
  }

  if (!series.length || !chartData.length) {
    return null;
  }

  // --- Enhanced Modal for WQI analysis ---
  function WQIModal({ open, onClose, point, station, parameterData }) {
    if (!open || !point) return null;
    const wqi = point.WQI;
    const gradeObj = getCCMEWQIGrade(wqi);
    const grade = gradeObj.grade;
    const color = gradeObj.hex;
    const gradeDescriptions = { 
      'Excellent': 'Water quality is protected with a virtual absence of threat or impairment; conditions are very close to natural or pristine levels.',
      'Good': 'Water quality is protected with only a minor degree of threat or impairment; conditions rarely depart from natural or desirable levels.',
      'Fair': 'Water quality is usually protected but occasionally threatened or impaired; conditions sometimes depart from natural or desirable levels.',
      'Marginal': 'Water quality is frequently threatened or impaired; conditions often depart from natural or desirable levels.',
      'Poor': 'Water quality is almost always threatened or impaired; conditions usually depart from natural or desirable levels.'
    };

    // Find parameter values and grades for this station/date
    const paramDetails = [];
    Object.entries(parameterData || {}).forEach(([param, paramArr]) => {
      const row = paramArr.find(r => r.date === point.date);
      if (row && row[station] !== undefined && row[station] !== null) {
        const value = row[station];
        const paramGradeObj = row[station + '_quality'] || {};
        const rawGrade = paramGradeObj.Class || paramGradeObj.grade || '';
        const formattedGrade = rawGrade && rawGrade !== '' 
          ? (rawGrade.startsWith('Class') ? rawGrade : `Class ${rawGrade}`)
          : rawGrade;
        paramDetails.push({
          param,
          value,
          grade: formattedGrade,
          color: paramGradeObj.hex || '',
        });
      }
    });
    // Find lowest and dangerous parameters (grade D, Failed, or Poor)
    const dangerParams = paramDetails.filter(p => {
      const g = (p.grade || '').toLowerCase();
      return g === 'd' || g === 'failed' || g === 'poor';
    });
    // Find lowest value parameter(s)
    let minValue = null;
    paramDetails.forEach(p => {
      if (typeof p.value === 'number' && (minValue === null || p.value < minValue)) minValue = p.value;
    });
    const lowestParams = paramDetails.filter(p => p.value === minValue);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative animate-fade-in" onClick={e => e.stopPropagation()}>
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={onClose}>&times;</button>
          <div className="mb-2 text-lg font-bold text-blue-900">CCME WQI Analysis</div>
          <div className="mb-1 text-base font-semibold">Station: <span className="text-blue-700">{station}</span></div>
          <div className="mb-1 text-base">Date: <span className="text-blue-700">{point.date}</span></div>
          <div className="mb-2 text-base">WQI Value: <span className="font-bold text-blue-700">{wqi != null ? wqi.toFixed(2) : 'N/A'}</span></div>
          <div className="mb-2 text-base">Classification: <span className="font-bold" style={{ color }}>{grade}</span></div>
          <div className="mb-3 text-gray-700 text-sm">{gradeDescriptions[grade] || ''}</div>
          <div className="mb-2 text-gray-600 text-xs">
            <b>What this means:</b> <br/>
            {grade === 'Excellent' && 'The water is of the highest quality and is suitable for all uses with minimal treatment.'}
            {grade === 'Good' && 'The water is generally safe and suitable for most uses, with only rare exceedances of guidelines.'}
            {grade === 'Fair' && 'The water is usually acceptable, but there may be occasional exceedances of guidelines. Some uses may require caution.'}
            {grade === 'Marginal' && 'The water is often impaired. Exceedances of guidelines are frequent, and treatment or restrictions may be needed.'}
            {grade === 'Poor' && 'The water is almost always impaired. It is generally unsuitable for most uses without significant treatment.'}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <b>Insight:</b> <br/>
            {wqi >= 80 ? 'This station is performing well overall. Continue regular monitoring to maintain high water quality.' :
              wqi >= 65 ? 'There are occasional issues at this station. Investigate possible sources of impairment and consider targeted management.' :
              wqi >= 45 ? 'Frequent water quality issues detected. Prioritize this station for further investigation and remediation.' :
              'Persistent water quality problems. Immediate action and detailed source tracking are recommended.'}
          </div>
          {dangerParams.length > 0 && (
            <div className="mt-4 p-3 rounded bg-red-50 border border-red-200">
              <div className="font-semibold text-red-700 mb-1">Parameters at Dangerous Levels:</div>
              <ul className="list-disc pl-5 text-sm">
                {dangerParams.map(p => (
                  <li key={p.param}><b>{p.param}</b>: <span className="text-red-700 font-bold">{p.value}</span> <span className="ml-1" style={{ color: p.color }}>{p.grade}</span></li>
                ))}
              </ul>
            </div>
          )}
          {lowestParams.length > 0 && (
            <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200">
              <div className="font-semibold text-yellow-700 mb-1">Lowest Parameter(s):</div>
              <ul className="list-disc pl-5 text-sm">
                {lowestParams.map(p => (
                  <li key={p.param}><b>{p.param}</b>: <span className="text-yellow-700 font-bold">{p.value}</span> <span className="ml-1" style={{ color: p.color }}>{p.grade}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Custom tooltip for WQI chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white p-3 rounded shadow text-sm border border-gray-200">
        <div className="font-semibold mb-1">{label}</div>
        {series.map((s, idx) => {
          const entry = payload.find(p => p.dataKey === s.name);
          if (!entry || entry.value == null) return null;
          const gradeObj = getCCMEWQIGrade(entry.value);
          return (
            <div
              key={s.name}
              className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
              style={{ transition: 'background 0.15s' }}
              onClick={() => setModalOpen(true) || setModalPoint({ ...entry.payload, WQI: entry.value, station: s.name })}
            >
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-medium text-gray-800">{s.name}:</span>
              <span className="font-mono text-gray-900">{entry.value != null ? entry.value.toFixed(2) : <span className="text-gray-400">N/A</span>}</span>
              <span style={{ background: gradeObj.hex, color: '#fff', borderRadius: 4, padding: '0 6px', fontSize: 11, fontWeight: 700, marginLeft: 2, minWidth: 18, display: 'inline-block' }}>{gradeObj.grade}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // --- Station selection modal ---
  const handleChartClick = (state) => {
    if (!state?.activePayload?.length) return;
    // Find all stations with data at this point
    const candidates = state.activePayload
      .filter(item => item && item.value != null)
      .map(item => ({
        station: item.dataKey,
        point: { ...item.payload, WQI: item.value, station: item.dataKey }
      }));
    if (candidates.length === 1) {
      setModalPoint(candidates[0].point);
      setModalOpen(true);
      return;
    }
    if (candidates.length > 1) {
      setStationSelectModal({ open: true, stations: candidates, payload: state });
    }
  };

  // Station selection modal component
  function StationSelectModal({ open, stations, onSelect, onClose }) {
    if (!open || !stations || stations.length === 0) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-lg max-w-xs w-full p-6 relative animate-fade-in" onClick={e => e.stopPropagation()}>
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={onClose}>&times;</button>
          <div className="mb-2 text-lg font-bold text-blue-900">Select Station</div>
          <div className="mb-3 text-gray-700 text-sm">Multiple stations have data at this point. Please select one to view analysis.</div>
          <ul className="space-y-2">
            {stations.map(s => (
              <li key={s.station}>
                <button
                  className="w-full px-4 py-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold text-base text-left"
                  onClick={() => { setModalPoint(s.point); setModalOpen(true); onClose(); }}
                >{s.station}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <div className="mb-2 text-lg font-bold text-blue-900 flex items-center gap-4">
        <span>CCME WQI (All Parameters)</span>
        {totalPages > 1 && (
          <span className="flex items-center gap-2 text-sm">
            <button
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setStationPage(p => Math.max(0, p - 1))}
              disabled={stationPage === 0}
              type="button"
            >&lt;</button>
            <span>Page {stationPage + 1} / {totalPages}</span>
            <button
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setStationPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={stationPage === totalPages - 1}
              type="button"
            >&gt;</button>
            <span className="text-gray-500 ml-2">Showing stations {stationPage * LINES_PER_PAGE + 1} - {Math.min((stationPage + 1) * LINES_PER_PAGE, stationsToShow.length)} of {stationsToShow.length}</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }} onClick={handleChartClick}>
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} minTickGap={10} label={{ value: 'Date', position: 'insideBottom', offset: -35, fontSize: 13, fontWeight: 700, fill: '#333' }} />
          <YAxis domain={[0, 100]} label={{ value: 'CCME WQI', angle: -90, position: 'insideLeft', offset: 10, fontSize: 13, fontWeight: 700, fill: '#333' }} />
          <Tooltip content={<CustomTooltip />} />
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
              // Use the same color logic as the other line graphs
              const legendStations = pagedStations;
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
                    {legendStations.map((station, idx) => (
                      <li key={station} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{
                          display: 'inline-block',
                          width: 14,
                          height: 4,
                          background: COLORS[idx % COLORS.length],
                          marginRight: 8,
                          borderRadius: 2
                        }} />
                        <span style={{ color: COLORS[idx % COLORS.length], fontWeight: 600, fontSize: 12 }}>{station}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }}
          />
          {/* Reference lines for Marginal and Poor classes (CCME standard) */}
          <ReferenceLine
            y={65}
            stroke="#fbbf24"
            strokeDasharray="6 6"
            ifOverflow="extendDomain"
            label={{
              value: 'Marginal (65)',
              position: 'left',
              fill: '#fbbf24',
              fontWeight: 600,
              fontSize: 11
            }}
          />
          <ReferenceLine
            y={45}
            stroke="#ef4444"
            strokeDasharray="6 6"
            ifOverflow="extendDomain"
            label={{
              value: 'Poor (45)',
              position: 'left',
              fill: '#ef4444',
              fontWeight: 600,
              fontSize: 11
            }}
          />
          {pagedStations.map((station, idx) => (
            <Line
              key={station}
              type="monotone"
              dataKey={station}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={3}
              dot={false}
              name={station}
              connectNulls={false} // break line on nulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <WQIModal open={modalOpen} onClose={() => setModalOpen(false)} point={modalPoint} station={modalPoint?.station} parameterData={dashboardDataByParameter} />
      <StationSelectModal
        open={stationSelectModal.open}
        stations={stationSelectModal.stations}
        onSelect={() => {}}
        onClose={() => setStationSelectModal({ open: false, stations: [], payload: null })}
      />
    </div>
  );
};

export default WQI_linechart;
