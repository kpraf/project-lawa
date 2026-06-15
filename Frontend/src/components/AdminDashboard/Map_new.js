import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gradingSystems } from './paramgrade';
import { initialPolygons } from '../Dashboard/MapCoordinates';

// Add custom CSS for tooltips
const style = document.createElement('style');
style.textContent = `
  .leaflet-tooltip {
    background: white !important;
    border: 2px solid #374151 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
    color: #374151 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    line-height: 1.5 !important;
    padding: 12px 16px !important;
    white-space: pre-line !important;
    min-width: 220px !important;
    max-width: 280px !important;
    z-index: 10000 !important;
  }
  .leaflet-tooltip::before {
    border-top-color: #374151 !important;
  }
  .leaflet-tooltip.leaflet-tooltip-right::before {
    border-right-color: #374151 !important;
    border-top-color: transparent !important;
  }
  .leaflet-tooltip.leaflet-tooltip-left::before {
    border-left-color: #374151 !important;
    border-top-color: transparent !important;
  }
  .leaflet-tooltip.leaflet-tooltip-bottom::before {
    border-bottom-color: #374151 !important;
    border-top-color: transparent !important;
  }
  .water-quality-grade {
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 6px;
    color: white !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  .status-indicator {
    font-size: 14px;
    font-weight: 600;
  }
  .status-good {
    color: #059669 !important;
  }
  .status-warning {
    color: #dc2626 !important;
  }
  .status-info {
    color: #2563eb !important;
  }
  .station-name {
    font-weight: 700;
    font-size: 14px;
    color: #1f2937 !important;
    margin-bottom: 4px;
  }
`;
document.head.appendChild(style);

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Laguna de Bay environmental guidelines for each parameter
const PARAM_GUIDELINES = {
  'Dissolved Oxygen': { type: 'min', value: 5 }, // mg/L, minimum
  'pH': { type: 'range', min: 6.5, max: 8.5 },   // acceptable range
  'Temperature': { type: 'max', value: 32 },     // Â°C, maximum
  'ORP': { type: 'min', value: 200 },            // mV, minimum (example)
  'Turbidity': { type: 'max', value: 25 },       // NTU, maximum (example)
  'TDS': { type: 'max', value: 1000 },           // mg/L, maximum (example)
  'Ammonia': { type: 'max', value: 0.5 },        // mg/L, maximum
  'Nitrate': { type: 'max', value: 10 },         // mg/L, maximum
  'Nitrite': { type: 'max', value: 1 },          // mg/L, maximum (example)
  'Phosphate': { type: 'max', value: 0.5 },      // mg/L, maximum (example)
  'BOD': { type: 'max', value: 7 },              // mg/L, maximum
  'Fecal Coliform': { type: 'max', value: 400 }, // MPN/100mL, maximum
};


const CCME_WQI_THRESHOLDS = [
  { min: 95, max: 100, grade: 'Excellent', color: '#4CBB17' }, // Dark Green
  { min: 80, max: 94, grade: 'Good', color: '#9ACD32' },       // Light Green  
  { min: 65, max: 79, grade: 'Fair', color: '#FDDA0D' },       // Yellow
  { min: 45, max: 64, grade: 'Marginal', color: '#FFA500' },   // Orange
  { min: 0, max: 44, grade: 'Poor', color: '#EA4228' },        // Red
]

// Short descriptions for each CCME WQI grade
const ccmeGradeDescriptions = {
  'Excellent': 'Water quality is protected with a virtual absence of threat or impairment; conditions are very close to natural or pristine levels.',
  'Good': 'Water quality is protected with only a minor degree of threat or impairment; conditions rarely depart from natural or desirable levels.',
  'Fair': 'Water quality is usually protected but occasionally threatened or impaired; conditions sometimes depart from natural or desirable levels.',
  'Marginal': 'Water quality is frequently threatened or impaired; conditions often depart from natural or desirable levels.',
  'Poor': 'Water quality is almost always threatened or impaired; conditions usually depart from natural or desirable levels.'
};

// Add short danger explanations for tooltips
const dangerExplanations = {
  'Dissolved Oxygen': 'Low dissolved oxygen can cause fish kills and harm aquatic life.',
  'pH': 'Extreme pH can be harmful to aquatic organisms.',
  'Temperature': 'High or low temperature can stress or kill aquatic life.',
  'ORP': 'Low ORP may indicate poor water quality and high pollution.',
  'Turbidity': 'High turbidity reduces light and can harm aquatic plants and animals.',
  'TDS': 'High TDS affects taste and usability of water.',
  'Ammonia': 'High ammonia is toxic to fish and aquatic life.',
  'Nitrate': 'High nitrate can cause algal blooms and harm health.',
  'Nitrite': 'High nitrite is toxic to fish and aquatic life.',
  'Phosphate': 'High phosphate can cause algal blooms.',
  'BOD': 'High BOD means low oxygen for aquatic life.',
  'Fecal Coliform': 'High levels indicate possible presence of pathogens.',
};

// Helper to check if a value exceeds the guideline
function isExceedance(param, value) {
  const g = PARAM_GUIDELINES[param];
  if (!g || value == null || value === '' || value === undefined) return false;
  if (g.type === 'max') return value > g.value;
  if (g.type === 'min') return value < g.value;
  if (g.type === 'range') return value < g.min || value > g.max;
  return false;
}

// Helper to calculate excursion for a value
function getExcursion(param, value) {
  const g = PARAM_GUIDELINES[param];
  if (!g || value == null || value === '' || value === undefined) return 0;
  if (g.type === 'max' && value > g.value) return (value / g.value) - 1;
  if (g.type === 'min' && value < g.value) return (g.value / value) - 1;
  if (g.type === 'range') {
    if (value < g.min) return (g.min / value) - 1;
    if (value > g.max) return (value / g.max) - 1;
    return 0;
  }
  return 0;
}

// CCME WQI calculation
function calculateCCMEWQI(parameters) {
  const paramEntries = Object.entries(parameters || {});
  const totalTests = paramEntries.length;
  if (totalTests === 0) return 0;

  // F1: % of parameters that exceed at least once
  const numParamsExceed = paramEntries.filter(([param, obj]) => isExceedance(param, obj?.value)).length;
  const F1 = (numParamsExceed / totalTests) * 100;

  // F2: % of individual tests that exceed
  const numTestsExceed = numParamsExceed;
  const F2 = (numTestsExceed / totalTests) * 100;

  // F3: Amplitude (normalized sum of excursions)
  let excursions = 0;
  paramEntries.forEach(([param, obj]) => {
    excursions += getExcursion(param, obj?.value);
  });
  const nse = excursions / totalTests;
  const F3 = (nse / (0.01 * nse + 0.01));

  // CCME WQI formula
  const ccmeWQI = 100 - Math.sqrt((F1 * F1 + F2 * F2 + F3 * F3) / 1.732);
  return Math.max(0, Math.min(100, ccmeWQI));
}

// Get overall grade and color based on CCME WQI
function getCCMEWQIGrade(wqi) {
  // Handle edge cases
  if (isNaN(wqi) || wqi === null || wqi === undefined) {
    wqi = 0; // Default to 0 if invalid
  }
  
  // Ensure WQI is within valid range
  wqi = Math.max(0, Math.min(100, wqi));
  
  for (const threshold of CCME_WQI_THRESHOLDS) {
    if (wqi >= threshold.min && wqi <= threshold.max) {
      return { grade: threshold.grade, color: threshold.color };
    }
  }
    // Fallback
  return { grade: 'Poor', color: '#EA4228' }; // Red
}

// Generate enhanced tooltip content with colored elements
function generateTooltipContent(stationName, stationLetter, parameters, wqi, overall) {
  if (!parameters) {
    return `<div class="station-name">${stationName}</div><div class="status-info">No data available</div>`;
  }

  // Get measured parameters (excluding 0s, null, undefined, and empty values)
  const measuredParams = Object.keys(parameters).filter(param => {
    const value = parameters[param]?.value;
    return value !== null && value !== undefined && value !== 0 && 
           !(typeof value === "string" && (value.trim() === "" || value.trim().toLowerCase() === "no data"));
  });

  // Get dangerous parameters
  const dangerousParams = measuredParams.filter(param => 
    isExceedance(param, parameters[param]?.value)
  );

  const hasExceedances = dangerousParams.length > 0;
  const statusIcon = hasExceedances ? 'âš ï¸' : measuredParams.length > 0 ? 'âœ…' : 'â„¹ï¸';
  const statusClass = hasExceedances ? 'status-warning' : measuredParams.length > 0 ? 'status-good' : 'status-info';
  
  const statusText = hasExceedances 
    ? `${dangerousParams.length} parameter${dangerousParams.length > 1 ? 's' : ''} exceed guidelines`
    : measuredParams.length > 0 
      ? 'All parameters within guidelines'
      : 'Limited data available';

  return `<div class="station-name">${stationName}</div>Water Quality: <span class="water-quality-grade" style="background-color: ${overall.color};">${overall.grade}</span> (${wqi.toFixed(1)})
<div class="status-indicator ${statusClass}">${statusIcon} ${statusText}</div>`;
}

// Polygon data with names - all stations are now active and will fetch data
const allStationNames = ['I', 'II', 'IV', 'V', 'VIII', 'XIII', 'XV', 'XVIII'];
const polygonData = allStationNames.map((stationName, index) => ({
  id: `station${index + 1}`,
  name: `Station ${stationName} Area`,
  coordinates: initialPolygons[index], // Corresponding polygon from MapCoordinates.js
  station: stationName,
  isActive: true,
}));

// No more disabled polygons - all stations are now active

function Map({ onMarkerSelect, selectedMarker }) {
  const [stationData, setStationData] = useState({});
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch latest data for all stations
  useEffect(() => {
    async function fetchAllStations() {
      const data = {};
      for (const polygon of polygonData) {
        try {
          const res = await fetch(`process.env.REACT_APP_API_URL/sensors/recent-data/${polygon.station}`);
          const json = await res.json();
          data[polygon.station] = json;
        } catch (e) {
          data[polygon.station] = null;
        }
      }
        setStationData(data);
      }
      fetchAllStations();
      // eslint-disable-next-line
    }, []);

  // Helper: get overall class and color using CCME WQI
  function getOverallClass(parameters) {
    if (!parameters) return { grade: 'No Data', color: '#6b7280' };
    
    // Check for parameter exceedances (for alerts only)
    const allParams = Object.keys(parameters);
    const dangerousParams = allParams.filter(param => 
      isExceedance(param, parameters[param]?.value)
    );
    
    // Calculate CCME WQI based on available parameters
    const wqi = calculateCCMEWQI(parameters);
    const result = getCCMEWQIGrade(wqi);
    
    // Always use CCME WQI for classification - exceedances only affect alerts
    // Ensure we return consistent format with hex color
    return {
      grade: result.grade,
      color: result.color,
      wqi: Math.round(wqi),
      hasExceedances: dangerousParams.length > 0,
      exceedanceCount: dangerousParams.length
    };
  }

  // Handle polygon selection
  const handlePolygonClick = (polygon, fromModal = false) => {
    setSelectedPolygon(polygon.id);
    // Create a marker-like object for compatibility with existing code
    const markerData = {
      id: polygon.id,
      position: null,
      label: polygon.station,
      station: polygon.station,
      name: polygon.name
    };
    if (onMarkerSelect) {
      onMarkerSelect(markerData);
    }
    // Auto-close modal if selection was made from modal view
    if (fromModal && isModalOpen) {
      setIsModalOpen(false);
    }
  };

  // Render map content (used in both normal and modal view)
  const renderMapContent = (height = '335px', isModal = false) => (
    <MapContainer 
      center={[14.291862250440422, 121.13988167124575]} 
      zoom={isModal ? 12 : 10}
      style={{ 
        height, 
        width: '100%', 
        borderBottomLeftRadius: isModal ? '0' : '1rem', 
        borderBottomRightRadius: isModal ? '0' : '1rem' 
      }}
      className={isModal ? '' : 'rounded-b-2xl'}
      key={isModal ? 'modal' : 'normal'} // Force re-render when switching
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Render active polygons with water quality coloring */}
      {polygonData.map((polygon) => {
        const data = stationData[polygon.station];
        const parameters = data && data.Parameters;
        const overall = getOverallClass(parameters);
        const isSelected = selectedPolygon === polygon.id;
        const polygonColor = isSelected ? '#374151' : overall.color;
        return (
          <Polygon
            key={polygon.id}
            positions={polygon.coordinates.map(coord => [coord[1], coord[0]])}
            pathOptions={{
              color: polygonColor,
              weight: isSelected ? 4 : 3,
              opacity: 1,
              fillOpacity: isSelected ? 0.8 : 0.7,
              fillColor: polygonColor,
            }}
            eventHandlers={{
              click: () => {
                if (!isSelected) {
                  handlePolygonClick(polygon, isModal);
                }
              },
            }}
          >
            <Tooltip
              permanent={false}
              direction="auto"
              offset={[0, -10]}
              opacity={0.95}
              className="custom-tooltip"
            >
              <div dangerouslySetInnerHTML={{
                __html: generateTooltipContent(
                  polygon.name,
                  polygon.station,
                  parameters,
                  Math.round(calculateCCMEWQI(parameters)),
                  overall
                )
              }} />
            </Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );

  return (
    <>
      <div className="map-contain flex flex-col items-center justify-center w-full">
        <div className="relative w-full rounded-b-2xl shadow-2xl border border-gray-200 bg-white bg-opacity-80 pb-0" style={{ height: '335px' }}>

          {/* Expand Map Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-2 right-2 z-[1000] bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg shadow-lg transition-colors duration-200 border border-gray-200"
            title="Expand map view"
          >
            {/* Icon only, airplane icons and extra lines removed for clarity */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-5 h-5"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" 
              />
            </svg>
          </button>

          {renderMapContent()}
        </div>
      </div>

      {/* Modal for expanded map view */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-2xl w-[95vw] h-[90vh] max-w-none relative">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Water Quality Map - Expanded View</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Close expanded view"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Map Content */}            
            <div className="w-full h-[calc(80vh-80px)]">
              {renderMapContent('100%', true)}
            </div>
            
            {/* Modal Legend */}
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 border border-gray-200">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Water Quality Index (CCME WQI)</h3>
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4CBB17' }}></div>
                  <span>Excellent (95-100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9ACD32' }}></div>
                  <span>Good (80-94)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FDDA0D' }}></div>
                  <span>Fair (65-79)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFA500' }}></div>
                  <span>Marginal (45-64)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EA4228' }}></div>
                  <span>Poor (0-44)</span>
                </div>
                <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-200">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#374151' }}></div>
                  <span>Selected Area</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Map;

