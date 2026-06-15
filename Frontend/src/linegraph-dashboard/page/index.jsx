import React, { useState, useEffect, useRef } from 'react';
import DateRangeSelector from '../components/DateRangeSelector';
import LineGraph from '../components/LineGraph';
import Navbar from '../../components/navbar';
import Sidebar from '../../components/sidebar';
import { DANGER_LEVELS } from '../utils/constants';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = 'process.env.REACT_APP_API_URL';

const LineGraphDashboard = ({ showSidebar = false, userProps = null, emailProps = null }) => {
  const [searchParams] = useSearchParams();
  const [dataByParameter, setDataByParameter] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [selectedStations, setSelectedStations] = useState([]); // for graph
  // Only stations with data for the selected parameter
  const [availableStations, setAvailableStations] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    status: null // No default mode
  });
  const [parametersMeta, setParametersMeta] = useState({});
  const [rangesByParameter, setRangesByParameter] = useState({});
  const [selectedParam, setSelectedParam] = useState('all');
  const [dataType, setDataType] = useState('');

  // Add a key to force remount on mode change (parameter or station)
  const [dashboardKey, setDashboardKey] = useState(0);

  // Initialize state from URL parameters
  useEffect(() => {
    const urlStation = searchParams.get('station');
    const urlParameter = searchParams.get('parameter');
    
    if (urlStation) {
      setSelectedStation(urlStation);
    }
    if (urlParameter) {
      setSelectedParam(urlParameter);
    }
  }, [searchParams]);

  // When selectedParam or selectedStation changes, force a remount to reload data
  useEffect(() => {
    setDashboardKey(prev => prev + 1);
  }, [selectedParam, selectedStation]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [dateRange, dashboardKey]);

  // Update availableStations when parameter or data changes
  useEffect(() => {
    if (selectedParam === 'all') {
      setAvailableStations(stations);
      return;
    }
    // Find stations with data for selectedParam
    const paramData = dataByParameter[selectedParam] || [];
    const stationSet = new Set();
    paramData.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (key !== 'date' && !key.endsWith('_quality') && value !== null && value !== undefined) {
          stationSet.add(key);
        }
      });
    });
    const filtered = stations.filter(s => stationSet.has(s.id));
    setAvailableStations(filtered);
  }, [selectedParam, dataByParameter, stations]);

  // Update selectedStations for graph when selectedStation or availableStations changes
  useEffect(() => {
    if (selectedStation === '' && availableStations.length > 0) {
      setSelectedStations(availableStations.map(s => s.id));
    } else if (selectedStation && availableStations.some(s => s.id === selectedStation)) {
      setSelectedStations([selectedStation]);
    } else {
      setSelectedStations([]);
    }
  }, [selectedStation, availableStations]);

  // If selectedStation is not in availableStations, reset to ''
  useEffect(() => {
    if (
      selectedStation &&
      !availableStations.some(s => s.id === selectedStation)
    ) {
      setSelectedStation('');
    }
  }, [selectedParam, availableStations, selectedStation]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();

      if (dateRange.status) {
        params.append('status', dateRange.status);
      } else if (dateRange.startDate && dateRange.endDate) {
        params.append('startDate', dateRange.startDate.toISOString().split('T')[0]);
        params.append('endDate', dateRange.endDate.toISOString().split('T')[0]);
      }

      const url = `${API_BASE_URL}/sensors/get-all-data/?${params}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      // Extract stations from the metadata
      if (result?.metadata?.stations) {
        const stationList = Object.entries(result.metadata.stations).map(([code, info]) => ({
          id: code,
          name: info.location
        }));
        setStations(stationList);
        // Set default selected station to '' (All Stations)
        if (selectedStation === '' && stationList.length > 0) {
          setSelectedStations(stationList.map(s => s.id));
        }
      } else {
        setStations([]);
        setSelectedStations([]);
      }

      // Process all parameters
      if (!result.series || !Array.isArray(result.series)) {
        setDataByParameter({});
        setParametersMeta(result?.metadata?.parameters || {});
        setRangesByParameter({});
        setDataType(result?.metadata?.data_type || '');
        return;
      }

      // Get all parameters from metadata (show all, even if no data)
      const allParameters = result?.metadata?.parameters ? Object.entries(result.metadata.parameters) : [];
      setParametersMeta(result?.metadata?.parameters || {});
      const dataByParam = {};
      const rangesByParam = {};

      allParameters.forEach(([parameter, paramInfo]) => {
        const parameterSeries = result.series.filter(s => s.parameter === parameter);
        if (parameterSeries.length === 0) {
          dataByParam[parameter] = [];
        } else {
          // Get all unique timestamps
          const allTimes = new Set();
          parameterSeries.forEach(series => {
            series.data.forEach(dp => allTimes.add(dp.time));
          });
          const sortedTimes = Array.from(allTimes).sort();
          const processedData = sortedTimes.map(time => {
            const row = { date: time };
            parameterSeries.forEach(series => {
              const dataPoint = series.data.find(dp => dp.time === time);
              if (dataPoint) {
                row[series.station] = dataPoint.value;
                if (dataPoint.Class) {
                  row[`${series.station}_quality`] = {
                    Class: dataPoint.Class,
                    Range: dataPoint.Range
                  };
                }
              } else {
                row[series.station] = null;
              }
            });
            return row;
          });
          dataByParam[parameter] = processedData;
        }
        // Extract range from paramInfo or fallback to DANGER_LEVELS
        if (paramInfo && paramInfo.range) {
          rangesByParam[parameter] = paramInfo.range;
        } else if (DANGER_LEVELS[parameter]) {
          rangesByParam[parameter] = DANGER_LEVELS[parameter];
        } else {
          rangesByParam[parameter] = null;
        }
      });
      setDataByParameter(dataByParam);
      setRangesByParameter(rangesByParam);
      setDataType(result?.metadata?.data_type || '');
      // Set default selected parameter if not set
      if (!selectedParam) {
        setSelectedParam('all');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      setDataByParameter({});
      setRangesByParameter({});
    } finally {
      setLoading(false);
    }
  };

  // Parameter options
  const parameterOptions = [
    { value: 'all', label: 'All Parameters' },
    ...Object.keys(parametersMeta).map(param => ({ value: param, label: param }))
  ];

  if (loading) {
    return (
      <div className={`flex ${showSidebar ? 'w-full' : 'flex-col w-full'} bg-gradient-to-b from-blue-100 via-blue-50 to-white min-h-screen`}>
        {showSidebar && (
          <div className="flex-shrink-0">
            <Sidebar userProps={userProps} emailProps={emailProps}/>
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {!showSidebar && (
            <header className="w-full content-center object-top sticky top-0 z-50">
              <Navbar />
            </header>
          )}
          <div className="flex items-center justify-center flex-1 px-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 animate-pulse">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${showSidebar ? 'w-full' : 'flex-col w-full'} bg-gradient-to-b from-blue-100 via-blue-50 to-white min-h-screen`}>
      {showSidebar && (
        <div className="flex-shrink-0">
          <Sidebar userProps={userProps} emailProps={emailProps}/>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!showSidebar && (
          <header className="w-full content-center object-top sticky top-0 z-50">
            <Navbar />
          </header>
        )}

        <div className="flex-1 px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-full overflow-hidden">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-6 max-w-full overflow-hidden">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center lg:text-left">Water Quality Historical Data</h1>
            {error && (
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded-r-lg">
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            )}
            {/* Parameter and Station Dropdowns */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 w-full">
            <div className="flex flex-col min-w-0 flex-1 sm:min-w-[180px] md:min-w-[220px]">
              <label className="mb-1 font-medium text-sm sm:text-base">Parameter</label>
              <div className="relative">
                <select
                  id="parameter-select"
                  value={selectedParam}
                  onChange={e => setSelectedParam(e.target.value)}
                  className="w-full p-2 sm:p-3 border rounded-lg bg-white shadow-md focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm sm:text-base"
                  style={{ 
                    maxHeight: 240, 
                    overflowY: 'auto', 
                    borderRadius: '0.5rem', 
                    borderColor: '#3b82f6', 
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)', 
                    paddingRight: 28 
                  }}
                >
                  {parameterOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700 text-sm sm:text-base">&#9662;</span>
              </div>
            </div>
            {/* Station Dropdown */}
            <div className="flex flex-col min-w-0 flex-1 sm:min-w-[180px] md:min-w-[220px]">
              <label className="mb-1 font-medium text-sm sm:text-base">Station</label>
              <div className="relative">
                <select
                  id="station-select"
                  value={selectedStation == null ? '' : selectedStation}
                  onChange={e => setSelectedStation(e.target.value)}
                  className="w-full p-2 sm:p-3 border rounded-lg bg-white shadow-md focus:ring-blue-500 focus:border-blue-500 appearance-none text-sm sm:text-base"
                  style={{ 
                    maxHeight: 240, 
                    overflowY: 'auto', 
                    borderRadius: '0.5rem', 
                    borderColor: '#3b82f6', 
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.1)', 
                    paddingRight: 28 
                  }}
                >
                  <option value="">All Stations</option>
                  {availableStations.map(station => (
                    <option key={station.id} value={station.id}>{station.name}</option>
                  ))}
                </select>
                <span className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700 text-sm sm:text-base">&#9662;</span>
              </div>
            </div>
          </div>
          <DateRangeSelector
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-6 sm:gap-8 md:gap-12 w-full overflow-hidden" key={dashboardKey}>
            {selectedParam === 'all'
              ? parameterOptions.filter(opt => opt.value !== 'all').map(opt => (
                  <div key={opt.value} className="w-full overflow-hidden">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-center lg:text-left">
                      {opt.value} {parametersMeta[opt.value]?.unit ? <span className="text-gray-500 text-sm sm:text-base">({parametersMeta[opt.value].unit})</span> : null}
                    </h2>
                    <div className="w-full overflow-hidden">
                      <LineGraph
                        data={dataByParameter[opt.value] || []}
                        parameter={opt.value}
                        selectedStations={selectedStations}
                        dataType={dataType}
                      />
                    </div>
                  </div>
                ))
              : selectedParam && (
                  <div key={selectedParam} className="w-full overflow-hidden">
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 text-center lg:text-left">
                      {selectedParam} {parametersMeta[selectedParam]?.unit ? <span className="text-gray-500 text-sm sm:text-base">({parametersMeta[selectedParam].unit})</span> : null}
                    </h2>
                    <div className="w-full overflow-hidden">
                      <LineGraph
                        data={dataByParameter[selectedParam] || []}
                        parameter={selectedParam}
                        selectedStations={selectedStations}
                        dataType={dataType}
                      />
                    </div>
                  </div>
                )}
            {Object.keys(dataByParameter).length === 0 && (
              <div className="w-full flex items-center justify-center min-h-[150px] sm:min-h-[200px] animate-fadeIn">
                <div className="text-gray-400 text-center text-base sm:text-lg font-semibold">
                  No data available for any parameter.
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineGraphDashboard;

