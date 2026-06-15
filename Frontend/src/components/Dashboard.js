import { useEffect, useState, useMemo } from 'react';
import Map from './Dashboard/Map';
import SquaresContainer from './Dashboard/S_Container';
import OverallWaterQuality from './Dashboard/OverallWaterQuality';
import { fetchWaterData, fetchAllData } from './Dashboard/helpers';
import RT_Report from './Dashboard/RT_Report';
import Weather from './Dashboard/Weather';
import MapDetails from './Dashboard/MapDetails';
import HoverModal from './hoverModal';
import GradeDescription from './Dashboard/GradeDescription';
import { FaUsers } from 'react-icons/fa'; // Add this import for the icon

function Dashboard() {
  // State for selected marker/station
  const [selectedMarker, setSelectedMarker] = useState({ station: "I" });
  const [waterData, setWaterData] = useState(null);
  const [allData, setAllData] = useState(null);
  const [selectedParam, setSelectedParam] = useState('all');
  const [selectedStation, setSelectedStation] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Refresh page every hour
  function refreshPage() {
    window.location.reload();
  }

  // Fetch water data and all data when marker changes
  useEffect(() => {
    fetchWaterData(selectedMarker, setWaterData);
    fetchAllData(setAllData);
  }, [selectedMarker]);

  // Set up auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPage();
    }, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  // Update selected station when marker changes
  useEffect(() => {
    if (selectedMarker) {
      setSelectedStation(selectedMarker.station);
    }
  }, [selectedMarker]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Memoize water data for performance
  const memoizedWaterData = useMemo(() => waterData, [waterData]);

  // Convert Roman numerals to numbers for station display
  function romanToNumber(roman) {
    if (!roman) return '';
    const map = { 
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
      XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18,
      XIX: 19, XX: 20
    };
    return map[roman] || roman;
  }

  // Helper for analogue clock hand rotation
  function getClockHandAngles(date) {
    const hours = date.getHours() % 12;
    const minutes = date.getMinutes();
    const hourAngle = (360 / 12) * hours + (30 / 60) * minutes;
    const minuteAngle = (360 / 60) * minutes;
    return { hourAngle, minuteAngle };
  }

  // Split parameter cards for layout (top 6 and rest)
  const [firstSixParams, setFirstSixParams] = useState([]);
  const [restParams, setRestParams] = useState([]);

  useEffect(() => {
    if (waterData && waterData.Parameters) {
      // Parameter keys for sorting
      const parameterUnits = {
        BOD: 'mg/L',
        'Fecal Coliform': 'CFU/100mL',
        pH: '',
        'Inorganic Phosphate': 'mg/L',
        'Dissolved Oxygen': 'mg/L',
        Nitrate: 'mg/L',
        Temperature: '°C',
        Ammonia: 'mg/L',
        Turbidity: 'NTU',
        'Total Dissolved Solids': 'mg/L',
        ORP: 'mV',
      };
      const parameterDescriptions = {
        pH: 'pH measures the acidity or alkalinity of water. Extreme pH levels can be harmful to aquatic life.',
        'Dissolved Oxygen': 'Dissolved Oxygen is essential for aquatic life. Low levels can lead to fish kills.',
        Temperature: 'Water Temperature affects the metabolic rates of aquatic organisms and the solubility of oxygen.',
        ORP: "Oxidation-Reduction Potential (ORP) measures the water's ability to oxidize pollutants; higher values indicate better water quality.",
        Turbidity: 'Indicates water cloudiness caused by particles; high levels can harm aquatic ecosystems.',
        'Total Dissolved Solids': 'Represents dissolved substances in water; high levels affect taste, quality, and usability.',
      };
      // Union of all possible params
      const allParams = Array.from(
        new Set([
          ...Object.keys(parameterUnits),
          ...Object.keys(parameterDescriptions),
          ...Object.keys(waterData.Parameters)
        ])
      );
      // Sort: params with data first, then alphabetically
      const sortedParams = allParams.sort((a, b) => {
        const aHasData = waterData.Parameters[a] && waterData.Parameters[a].value !== undefined && waterData.Parameters[a].value !== null;
        const bHasData = waterData.Parameters[b] && waterData.Parameters[b].value !== undefined && waterData.Parameters[b].value !== null;
        if (aHasData === bHasData) return a.localeCompare(b);
        return aHasData ? -1 : 1;
      });
      setFirstSixParams(sortedParams.slice(0, 6));
      setRestParams(sortedParams.slice(6));
    }
  }, [waterData]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden p-1 sm:p-2">
      <div className="w-full flex flex-col h-full">
        {/* Responsive grid: 1 column on mobile, 60/40 split on large screens */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-1 sm:gap-2 w-full h-full min-h-0">
          {/* LEFT: Water Monitoring header and parameter cards - 60% */}
          <div className="flex flex-col space-y-1 order-1 xl:order-1 xl:col-span-3 h-full min-h-0 overflow-hidden">
            <div className="w-full p-1 sm:p-2 rounded-lg border border-blue-200 shadow-md bg-gradient-to-r from-blue-50 via-white to-blue-100 flex items-center flex-shrink-0">
              <span className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full">
                <span className="font-sans font-bold text-xs sm:text-sm md:text-base text-blue-900 tracking-wide">
                  Water Quality
                </span>
                <span className="hidden sm:inline text-xs md:text-sm text-blue-900 font-bold font-sans tracking-wide select-none">
                  |
                </span>
                <span className="font-sans font-bold text-xs sm:text-sm md:text-base text-blue-900 tracking-wide break-words">
                  {selectedMarker && selectedMarker.station
                    ? `Current Station: ${romanToNumber(selectedMarker.station)}`
                    : ""}
                </span>
              </span>
            </div>
            {/* Parameter cards grid: compact layout */}
            <div className="w-full flex-1 min-h-0 flex flex-col">
              <SquaresContainer
                selectedMarker={selectedMarker}
                waterData={memoizedWaterData}
                paramsToShow={firstSixParams}
                restParams={restParams}
                compact={true}
              />
            </div>
          </div>
          
          {/* RIGHT: Water Classification, GradeDescription, Map - 40% */}
          <div className="flex flex-col space-y-1 order-2 xl:order-2 xl:col-span-2">
            <div className="w-full p-1 sm:p-2 rounded-lg border border-green-200 shadow-md bg-gradient-to-r from-green-50 via-white to-green-100 flex items-center flex-shrink-0">
              <span className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 w-full">
                <span className="font-sans font-bold text-xs sm:text-sm md:text-base text-green-900 tracking-wide">
                  Water Classification
                </span>
                <span className="hidden sm:inline text-xs md:text-sm text-green-900 font-bold font-sans tracking-wide select-none">
                  |
                </span>
                <span className="flex-1 flex items-center justify-start sm:justify-end">
                  {/* Analogue clock style - responsive sizing */}
                  <span className="flex flex-row items-center gap-1 sm:gap-2">
                    <span className="relative flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white border-2 border-green-300 shadow mr-1">
                      {/* SVG Analogue Clock - responsive sizing */}
                      <svg width="100%" height="100%" viewBox="0 0 32 32" className="absolute left-0 top-0">
                        <circle cx="16" cy="16" r="14" fill="#fff" stroke="#4ade80" strokeWidth="2"/>
                        {/* Hour hand */}
                        <line
                          x1="16" y1="16"
                          x2={16 + 5.5 * Math.sin(Math.PI * getClockHandAngles(currentDateTime).hourAngle / 180)}
                          y2={16 - 5.5 * Math.cos(Math.PI * getClockHandAngles(currentDateTime).hourAngle / 180)}
                          stroke="#0f766e"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        {/* Minute hand */}
                        <line
                          x1="16" y1="16"
                          x2={16 + 8 * Math.sin(Math.PI * getClockHandAngles(currentDateTime).minuteAngle / 180)}
                          y2={16 - 8 * Math.cos(Math.PI * getClockHandAngles(currentDateTime).minuteAngle / 180)}
                          stroke="#22c55e"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                        <circle cx="16" cy="16" r="1.3" fill="#0f766e"/>
                      </svg>
                      {/* Fallback icon for accessibility */}
                      <span className="sr-only">Current time</span>
                    </span>
                    <span className="flex flex-col sm:flex-row sm:items-end gap-0 sm:gap-1">
                      <span className="text-green-900 font-bold text-xs sm:text-sm font-mono tracking-wide leading-none">
                        {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-green-900 text-xs font-mono tracking-wide leading-none">
                        {currentDateTime.toLocaleDateString()}
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </div>
            
            <div className="flex flex-col w-full space-y-1 flex-shrink-0">
              <div className="w-full flex-shrink-0">
                {selectedMarker && (
                  <OverallWaterQuality
                    waterData={memoizedWaterData}
                    className="text-center font-sans w-full"
                    selectedStation={selectedMarker.station}
                    selectedMarker={selectedMarker}
                  />
                )}
              </div>
              <div className="w-full flex-shrink-0">
                <GradeDescription />
              </div>
              <div className="w-full flex-shrink-0">
                <Map onMarkerSelect={setSelectedMarker} waterData={memoizedWaterData} selectedMarker={selectedMarker} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;