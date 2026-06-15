import React, { useMemo } from 'react';
import { Sparkline } from './LineGraph';

// Parameter standards for display
const paramStandards = {
  pH: { range: "6.5 - 8.5", reason: "Most aquatic life thrives in this pH range; extremes can be harmful or fatal." },
  Temperature: { range: "0 - 30°C", reason: "Higher temperatures reduce oxygen solubility and can stress aquatic organisms." },
  'Dissolved Oxygen': { range: "5 - 14 mg/L", reason: "Levels below 5 mg/L can cause stress or death to fish and other aquatic life." },
  Turbidity: { range: "0 - 5 NTU", reason: "Low turbidity ensures clear water; high turbidity can block sunlight and harm habitats." },
  Conductivity: { range: "0 - 500 µS/cm", reason: "Indicates the presence of dissolved salts; high values may signal pollution." },
  'Fecal Coliform': { range: "0 - 200 CFU/100mL", reason: "High counts indicate possible contamination by pathogens." },
  'Inorganic Phosphate': { range: "0 - 0.1 mg/L", reason: "Excess phosphate can cause algal blooms and degrade water quality." },
  Nitrate: { range: "0 - 10 mg/L", reason: "High nitrate can cause eutrophication and harm aquatic life." },
  Ammonia: { range: "0 - 0.5 mg/L", reason: "Ammonia is toxic to aquatic organisms at higher concentrations." },
  BOD: { range: "0 - 3 mg/L", reason: "Low BOD indicates less organic pollution; high BOD depletes oxygen." },
  ORP: { range: "200 - 400 mV", reason: "Indicates good oxidizing conditions for breaking down contaminants." },
  'Total Dissolved Solids': { range: "0 - 1000 mg/L", reason: "High TDS affects taste and usability; may indicate pollution." }
};

const LG_modal = ({ open, onClose, point, param, dangerLevel, allHistory, sparklineMode }) => {
  // Memoize selected month/year from point
  const selectedDateInfo = useMemo(() => {
    if (!point?.time) return null;
    const d = new Date(point.time);
    return { month: d.getMonth(), year: d.getFullYear() };
  }, [point?.time]);

  // Filter allHistory for selected month/year
  const filteredData = useMemo(() => {
    if (!Array.isArray(allHistory) || !selectedDateInfo) return [];
    return allHistory.filter(entry => {
      const entryDate = new Date(entry.time);
      return entryDate.getMonth() === selectedDateInfo.month && entryDate.getFullYear() === selectedDateInfo.year;
    });
  }, [allHistory, selectedDateInfo]);

  // Use point.history if available, else allHistory
  const history = useMemo(() => {
    if (point?.history?.length >= 2) return point.history;
    if (Array.isArray(allHistory) && allHistory.length > 1) return allHistory;
    return [];
  }, [point?.history, allHistory]);

  // Compute stats: min, max, avg, stddev, prevValue, delta, anomaly
  const stats = useMemo(() => {
    if (!Array.isArray(history) || history.length < 2 || !point) return {};
    let min = Infinity, max = -Infinity, sum = 0, sumSq = 0, idx = -1;
    const values = [];
    history.forEach((d, i) => {
      const v = Number(d.value);
      values.push(v);
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      sumSq += v * v;
      if (Number(point.value) === v && d.time === point.time) idx = i;
    });
    const avg = sum / values.length;
    const stddev = Math.sqrt(sumSq / values.length - avg * avg);
    let prevValue = null, delta = null;
    if (idx > 0) {
      prevValue = values[idx - 1];
      delta = values[idx] - prevValue;
    }
    const isAnomaly = stddev > 0 && Math.abs(Number(point.value) - avg) > 2 * stddev;
    return {
      min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2), stddev: stddev.toFixed(2),
      prevValue: prevValue !== null ? prevValue.toFixed(2) : null,
      delta: delta !== null ? delta.toFixed(2) : null,
      isAnomaly
    };
  }, [history, point]);

  // Render a red dot for the selected point in the chart (if used)
  const renderDot = useMemo(() => {
    let selectedIdx = -1;
    if (point && Array.isArray(filteredData)) {
      selectedIdx = filteredData.findIndex(
        d => d.time === point.time && Number(d.value) === Number(point.value)
      );
    }
    return (props) => {
      const { cx, cy, index } = props;
      if (index === selectedIdx) {
        return (
          <circle
            cx={cx}
            cy={cy}
            r={7}
            fill="#fff"
            stroke="#e9242a"
            strokeWidth={3}
            style={{ pointerEvents: 'none' }}
          />
        );
      }
      return null;
    };
  }, [point?.time, point?.value, filteredData]);

  // Get standard range and explanation
  const standard = paramStandards[param] || {};
  const safeRange = (dangerLevel && dangerLevel.min !== undefined && dangerLevel.max !== undefined)
    ? `${dangerLevel.min} - ${dangerLevel.max}` : "N/A";

  // Monthly average for filtered data
  const filteredMonthlyAvg = useMemo(() => {
    if (!filteredData.length) return null;
    const sum = filteredData.reduce((acc, d) => acc + Number(d.value), 0);
    return (sum / filteredData.length).toFixed(2);
  }, [filteredData]);

  // Monthly min/max for filtered data
  const monthlyExtremes = useMemo(() => {
    if (!filteredData.length) return null;
    let min = filteredData[0], max = filteredData[0];
    filteredData.forEach(d => {
      if (Number(d.value) < Number(min.value)) min = d;
      if (Number(d.value) > Number(max.value)) max = d;
    });
    return {
      minValue: min.value, minTime: min.time,
      maxValue: max.value, maxTime: max.time
    };
  }, [filteredData]);

  // Early exit if modal not open or no point
  if (!open || !point) return null;

  // Value status
  const { value, time, station_id } = point;
  const isBelow = dangerLevel && dangerLevel.min !== undefined && Number(value) < dangerLevel.min;
  const isAbove = dangerLevel && dangerLevel.max !== undefined && Number(value) > dangerLevel.max;
  const inRange = !isBelow && !isAbove;

  // Check if this is a forecasted data point
  const isForecast = point[`${station_id}_quality`]?.is_forecast || false;

  // Render modal
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.35)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full relative border border-blue-100"
        style={{
          minWidth: 0,
          width: '100%',
          maxWidth: 420,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box' 
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-2xl font-bold focus:outline-none"
          aria-label="Close"
        >×</button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-3xl font-bold text-blue-800">{param}</h2> 
        </div>
        {/* Station Name */}
        {station_id && (
          <div className="mb-2 text-blue-700 font-semibold text-lg">
            Station: {station_id}
          </div>
        )}
        {/* Date, Value, Status */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div>
            <div className="text-xs text-gray-500">Date</div>
            <div className="font-semibold">{time}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Value</div>
            <div className={`font-semibold ${isBelow || isAbove ? "text-red-500" : "text-green-700"}`}>{Number(value).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Status</div>
            <div>
              {isBelow && <span className="text-red-500 font-semibold">Below safe minimum ({dangerLevel?.min})</span>}
              {isAbove && <span className="text-red-500 font-semibold">Above safe maximum ({dangerLevel?.max})</span>}
              {inRange && <span className="text-green-600 font-semibold">Within safe range</span>}
            </div>
          </div>
        </div>

        {/* Forecast Information */}
        {isForecast && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📈</span>
              <div className="text-sm font-bold text-blue-800">Forecasted Value</div>
            </div>
            <div className="text-sm text-blue-700 mb-2">
              This is a predicted value based on machine learning models using historical data patterns.
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-500">Model Type</div>
                <div className="font-semibold text-blue-800">CNN-BiLSTM</div>
              </div>
              <div>
                <div className="text-gray-500">Confidence</div>
                <div className="font-semibold text-green-600">High</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Forecasted values help predict potential water quality trends but should be validated with actual measurements.
            </div>
          </div>
        )}

        {/* Previous value and delta */}
        {stats.prevValue !== null && (
          <div className="mb-3">
            <div className="text-xs text-gray-500">Previous Value</div>
            <div className="font-semibold">
              {stats.prevValue}
              <span className={`ml-2 text-sm ${stats.delta > 0 ? "text-red-600" : stats.delta < 0 ? "text-green-600" : "text-gray-500"}`}>
                {stats.delta > 0 ? `▲ +${stats.delta}` : stats.delta < 0 ? `▼ ${stats.delta}` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Standard Range */}
        <div className="mb-3">
          <div className="text-xs text-gray-500">Standard Range</div>
          <div className="font-semibold">{standard.range || safeRange}</div>
          <div className="text-gray-700 text-xs mt-1">{standard.reason || "No standard explanation available."}</div>
        </div>

        {/* Monthly Extremes */}
        {monthlyExtremes && (
          <div className="mb-3">
            <div className="text-xs text-gray-500">Monthly Extremes</div>
            <div className="flex gap-6 font-semibold mt-1">
              <div>
                <span className="text-gray-500 text-xs">Lowest</span>
                <div className="text-blue-800">{Number(monthlyExtremes.minValue).toFixed(2)}</div>
                <div className="text-xs text-gray-400">
                  {new Date(monthlyExtremes.minTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Highest</span>
                <div className="text-blue-800">{Number(monthlyExtremes.maxValue).toFixed(2)}</div>
                <div className="text-xs text-gray-400">
                  {new Date(monthlyExtremes.maxTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomaly prompt */}
        {stats.isAnomaly && (
          <div className="mb-3">
            <div className="text-xs text-red-600 font-bold">Anomaly Detected</div>
            <div className="text-red-500 text-sm">
              This value is more than 2 standard deviations from the recent average ({stats.avg} ± {stats.stddev}).
            </div>
          </div>
        )}

        {/* Monthly Average */}
        {filteredMonthlyAvg !== null && filteredData.length > 1 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500">Monthly Average</div>
            <div className="font-semibold text-blue-700">{filteredMonthlyAvg}</div>
          </div>
        )}

        {/* Sparkline */}
        <div style={{ margin: '16px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {sparklineMode && allHistory && allHistory.length > 0 && (
            <>
              <Sparkline
                data={allHistory.map(e => ({ time: e.time, value: e.value }))}
                color="#3b82f6"
                width={180}
                height={48}
                param={param}
                period="day"
              />
              <div style={{ fontSize: 12, color: '#555', marginTop: 4, textAlign: 'center', maxWidth: 240 }}>
                {/* Description of what the sparkline shows */}
                This sparkline shows the trend of <b>{param}</b> values for this station over the last 24 hours (or available data).
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-gray-600 text-sm mt-4 border-t pt-3">
          This point represents {isForecast ? 'a predicted' : 'the measured'} value of <b>{param}</b> at the selected date
          {station_id && <> for <b>Station {station_id}</b></>}. 
          {isForecast 
            ? ' Forecasted values are predictions based on historical patterns and should be validated with actual measurements.'
            : ' Values outside the safe range may indicate potential water quality issues.'
          }
        </div>
      </div>
    </div>
  );
};

export default LG_modal;
