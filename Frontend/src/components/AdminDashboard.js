import { useEffect, useState, useMemo, useCallback } from 'react';
import Map from './AdminDashboard/Map';
import SquaresContainer from './AdminDashboard/S_ContainerAdmin';
import GDAdmin from './AdminDashboard/GDAdmin';
import { fetchWaterData, fetchAllData } from './Dashboard/helpers';
import RT_Report from './AdminDashboard/RT_Report';

function Dashboard() {
  const [selectedMarker, setSelectedMarker] = useState({ "station": "I" });
  const [tempo, setTempo] = useState([]);
  const [waterData, setWaterData] = useState(null);
  const [allData, setAllData] = useState(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Add effect to update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getLatestTime = useCallback(async () => {
    const response = await fetch(
      `process.env.REACT_APP_API_URL/sensors/recent-data`
    );
    const data = await response.json();
    const dataArray = Array.isArray(data) ? data : [data];
    setTempo(dataArray);

    tempo.map(items => {

    })
  });

  useEffect(() => {
    fetchWaterData(
      selectedMarker,
      setWaterData
    );
    fetchAllData(
      setAllData
    );
  }, [selectedMarker]);

  useEffect(() => {
    if (selectedMarker) {
      setSelectedStation(
        selectedMarker.station
      );
    }
  }, [selectedMarker]);

  const memoizedWaterData = useMemo(
    () => waterData,
    [waterData]
  );
  // const overallGrade = getOverallGrade(memoizedWaterData);
  // const bestGrade = getBestGrade(overallGrade);

  // Helper to convert Roman numerals to numbers for station display
  function romanToNumber(roman) {
    if (!roman) return '';
    const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
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

  return (
    <div className="flex flex-col items-start p-2 sm:p-4 pr-4 sm:pr-6 flex-grow min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden relative z-10">
      {/* MAIN LAYOUT - Responsive 2 COLUMNS (60/40 split) */}
      <div className="flex flex-col lg:flex-row w-full h-full space-y-3 lg:space-y-0 lg:space-x-4 min-h-0 relative z-10 max-w-full">
        {/* LEFT COLUMN - Water Quality Parameters (60%) */}
        <div className="w-full lg:w-[60%] h-full flex flex-col min-h-0 flex-shrink-0">
          <div className="w-full flex flex-row h-full">
            <div className="flex flex-col space-y-2 w-full h-full">
              {/* Compact header for Water Quality */}
              <div className="w-full p-2 rounded-lg border border-blue-200 shadow-md bg-gradient-to-r from-blue-50 via-white to-blue-100 flex items-center">
                <span className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 w-full">
                  <span className="font-sans font-bold text-base sm:text-lg text-blue-900 tracking-wide">
                    Water Quality Parameters
                  </span>
                  <span className="font-sans font-semibold text-sm text-blue-700">
                    {selectedMarker && selectedMarker.station
                      ? `Station ${romanToNumber(selectedMarker.station)}`
                      : ""}
                  </span>
                </span>
              </div>
              <SquaresContainer
                selectedMarker={selectedMarker}
                waterData={memoizedWaterData || { Parameters: [] }}
                compact={true}
                zoom={0.95}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Stacked Components (40%) */}
        <div className="w-full lg:w-[40%] flex flex-col space-y-2 min-h-0 flex-shrink-0">
          {/* Real-time Report Header with Clock */}
          <div className="w-full p-2 rounded-lg border border-green-200 shadow-md bg-gradient-to-r from-green-50 via-white to-green-100 flex items-center">
            <span className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 w-full">
              <span className="font-sans font-bold text-base sm:text-lg text-green-900 tracking-wide">
                Real-time Monitoring
              </span>
              <span className="flex-1 flex items-center justify-end">
                {/* Smaller responsive clock */}
                <span className="flex flex-row items-center gap-1 sm:gap-2">
                  <span className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border-2 border-green-300 shadow">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="absolute left-0 top-0 sm:w-6 sm:h-6">
                      <circle cx="12" cy="12" r="10" fill="#fff" stroke="#4ade80" strokeWidth="1.5"/>
                      {/* Hour hand */}
                      <line
                        x1="12" y1="12"
                        x2={12 + 4 * Math.sin(Math.PI * getClockHandAngles(currentDateTime).hourAngle / 180)}
                        y2={12 - 4 * Math.cos(Math.PI * getClockHandAngles(currentDateTime).hourAngle / 180)}
                        stroke="#0f766e"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      {/* Minute hand */}
                      <line
                        x1="12" y1="12"
                        x2={12 + 6 * Math.sin(Math.PI * getClockHandAngles(currentDateTime).minuteAngle / 180)}
                        y2={12 - 6 * Math.cos(Math.PI * getClockHandAngles(currentDateTime).minuteAngle / 180)}
                        stroke="#22c55e"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="12" r="1" fill="#0f766e"/>
                    </svg>
                  </span>
                  <span className="flex flex-col sm:flex-row sm:items-end sm:gap-1">
                    <span className="text-green-900 font-bold text-sm sm:text-lg font-mono">
                      {currentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-green-900 text-xs sm:text-sm font-mono hidden sm:block">
                      {currentDateTime.toLocaleDateString()}
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </div>

          {/* 1. Real-time Report Table - Expanded to fill more space */}
          <div className="w-full max-h-[320px] sm:max-h-[380px] overflow-hidden">
            <RT_Report />
          </div>

          {/* 2. Grade Description - Moved up before Map */}
          <div className="w-full">
            <GDAdmin />
          </div>

          {/* 3. Map Section - Moved down and Responsive */}
          <div className="w-full shadow-md rounded-lg overflow-hidden max-h-[400px] sm:max-h-[320px] relative z-10">
            <Map
              onMarkerSelect={setSelectedMarker}
              waterData={memoizedWaterData}
              selectedMarker={selectedMarker}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;


