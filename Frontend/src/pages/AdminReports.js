import React, { useEffect, useState, useRef, useMemo } from 'react';
import Sidebar from '../components/sidebar';
import Overlay from '../components/Modal';
import { fetchAllData } from '../components/Dashboard/helpers';

const AdminReports = (props) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [showParamDropdown, setShowParamDropdown] = useState(false);
  const paramDropdownRef = useRef(null);
  const [selectedStations, setSelectedStations] = useState([]);
  const [showStationDropdown, setShowStationDropdown] = useState(false);
  const stationDropdownRef = useRef(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [availableParameters, setAvailableParameters] = useState([]);
  const [availableStations, setAvailableStations] = useState([]);
  const [allData, setAllData] = useState(null);
  const api = 'process.env.REACT_APP_API_URL/sensors/download-csv/';

  const user = props.user;
  const email = props.email;
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('process.env.REACT_APP_API_URL/reports/list/');
        const data = await response.json();
        setReports(data.reports);
        console.log(reports);
      } catch (error) {
        // console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Fetch allData for stations/parameters dropdowns
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchAllData();
        setAllData(data);
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchData();
  }, []);

  const handleQuarterClick = (pdfUrl) => window.open(pdfUrl, '_blank');

  const groupedReports = useMemo(() => {
    // Build a map: { year: { Q1: pdf, Q2: pdf, ... } }
    const map = {};
    reports.forEach(({ title, pdf }) => {
      const [quarter, year] = title.split(' ');
      if (!map[year]) map[year] = {};
      map[year][quarter] = pdf;
    });
    // Ensure all years have Q1-Q4 (even if missing)
    Object.keys(map).forEach(year => {
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        if (!(q in map[year])) map[year][q] = null;
      });
    });
    return map;
  }, [reports]);

  // Sort years in descending order for display
  const sortedYears = Object.keys(groupedReports).sort((a, b) => b - a);

  // Static options for stations and parameters
  const stationsOptions = [
    { value: 'I', label: 'Station I' },
    { value: 'II', label: 'Station II' },
    { value: 'III', label: 'Station III' },
    { value: 'IV', label: 'Station IV' },
  ];

  const paramOptions = [
    { value: 'ORP', label: 'ORP' },
    { value: 'TDS', label: 'TDS' },
    { value: 'pH', label: 'pH' },
    { value: 'Temperature', label: 'Temperature' },
    { value: 'Dissolved Oxygen', label: 'Dissolved Oxygen' },
  ];

  const resetRadioButtons = () => {
    setSelectedStations([]);
    setDateRange({ from: '', to: '' });
    setSelectedParameters([]);
  }

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (paramDropdownRef.current && !paramDropdownRef.current.contains(event.target)) {
        setShowParamDropdown(false);
      }
    }
    if (showParamDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showParamDropdown]);

  // Close station dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (stationDropdownRef.current && !stationDropdownRef.current.contains(event.target)) {
        setShowStationDropdown(false);
      }
    }
    if (showStationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStationDropdown]);

  const handleStationToggle = (stationValue) => {
    setSelectedStations(prev =>
      prev.includes(stationValue)
        ? prev.filter(s => s !== stationValue)
        : [...prev, stationValue]
    );
  };

  const handleParamToggle = (paramValue) => {
    setSelectedParameters(prev =>
      prev.includes(paramValue)
        ? prev.filter(p => p !== paramValue)
        : [...prev, paramValue]
    );
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prepare JSON body
    const body = {
      "dateRange": {
        "from": dateRange.from,
        "to": dateRange.to,
      },
      "selectedParameters": selectedParameters,
      "selectedStations": selectedStations,
    };

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // If the API returns a file, trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Try to get filename from response headers, fallback to default
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'exported_data.csv';
        if (disposition && disposition.indexOf('filename=') !== -1) {
          filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export data.');
      }
    } catch (error) {
      alert('An error occurred while exporting data.');
    }

    setIsModalOpen(false);
    resetRadioButtons();
  };

  return (
    <div className="flex w-full bg-gradient-to-b from-blue-100 via-blue-50 to-white min-h-screen">
      {/* Sidebar - always present but responsive */}
      <div className="flex-shrink-0">
        <Sidebar userProps={user} emailProps={email}/>
      </div>
      
      {/* Main content area - responsive padding to account for sidebar */}
      <div className="flex-1 w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 mb-4 sm:mb-8 mt-4 sm:mt-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start items-center mb-6 sm:mb-8 gap-4">
          <div className="flex flex-col items-center flex-1 px-2 text-center lg:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-poppins text-blue-900 tracking-tight mb-2 drop-shadow-lg uppercase">
              Quarterly Reports
            </h1>
            <div className="h-1 w-16 sm:w-24 bg-blue-500 rounded-full mb-2 shadow"></div>
            <p className="text-gray-600 text-center max-w-xl mt-2 text-sm sm:text-base lg:text-lg">Browse and download quarterly reports by year. Click on a quarter to view the PDF report.</p>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-1 bg-mapua-red text-white py-2 px-3 sm:py-1.5 sm:px-4 rounded-lg font-semibold shadow hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 w-full sm:w-auto text-sm sm:text-base"
              onClick={() => setIsModalOpen(true)}>
              <i className="bi bi-download text-base sm:text-lg"></i>
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
        <div className="w-full bg-white/90 rounded-2xl sm:rounded-3xl shadow-2xl p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 border border-blue-200 max-w-full overflow-hidden">

          {isModalOpen && (
            <Overlay onClose={() => {
              setIsModalOpen(false);
            }}>
              <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg px-3 sm:px-6 pt-2 w-[85vw] sm:w-[90vw] max-w-[400px] text-left mx-2 sm:mx-4">
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-center">Export Data</h2>
                  <div className="flex flex-col gap-3 sm:gap-4 mt-3 sm:mt-4 lg:mt-6">
                    {/* Date Range */}
                    <div>
                      <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">Date Range</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="date"
                          name="from"
                          value={dateRange.from}
                          onChange={handleDateChange}
                          className="border rounded px-2 py-1 w-full sm:w-1/2 text-sm sm:text-base"
                          required
                        />
                        <span className="mx-1 my-auto text-center sm:text-left text-sm sm:text-base">to</span>
                        <input
                          type="date"
                          name="to"
                          value={dateRange.to}
                          onChange={handleDateChange}
                          className="border rounded px-2 py-1 w-full sm:w-1/2 text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>
                    {/* Station ComboBox */}
                    <div className="relative" ref={stationDropdownRef}>
                      <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">Stations</label>
                      <div
                        className="border border-gray-400 rounded-lg px-3 sm:px-4 py-2 bg-white cursor-pointer flex flex-wrap min-h-[40px] sm:min-h-[44px] items-center text-sm sm:text-base"
                        onClick={() => setShowStationDropdown((v) => !v)}
                        tabIndex={0}
                      >
                        {selectedStations.length === 0 ? (
                          <span className="text-gray-400">Select stations...</span>
                        ) : (
                          selectedStations.map(stationValue => {
                            const stationObj = stationsOptions.find(s => s.value === stationValue);
                            return (
                              <span
                                key={stationValue}
                                className="bg-mapua-red text-white rounded px-2 py-1 text-xs mr-2 mb-1"
                              >
                                {stationObj ? stationObj.label : stationValue}
                              </span>
                            );
                          })
                        )
                        }
                        <span className="ml-auto text-gray-500">
                          <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </div>
                      {showStationDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                          {stationsOptions.map(station => (
                            <label key={station.value} className="flex items-center px-3 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base">
                              <input
                                type="checkbox"
                                checked={selectedStations.includes(station.value)}
                                onChange={() => handleStationToggle(station.value)}
                                className="mr-2 accent-mapua-red"
                              />
                              <span>{station.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Parameter ComboBox */}
                    <div className="relative" ref={paramDropdownRef}>
                      <label className="block text-gray-700 font-medium mb-1 text-sm sm:text-base">Parameters</label>
                      <div
                        className="border border-gray-400 rounded-lg px-3 sm:px-4 py-2 bg-white cursor-pointer flex flex-wrap min-h-[40px] sm:min-h-[44px] items-center text-sm sm:text-base"
                        onClick={() => setShowParamDropdown((v) => !v)}
                        tabIndex={0}
                      >
                        {selectedParameters.length === 0 ? (
                          <span className="text-gray-400">Select parameters...</span>
                        ) : (
                          selectedParameters.map(paramValue => {
                            const paramObj = paramOptions.find(p => p.value === paramValue);
                            return (
                              <span
                                key={paramValue}
                                className="bg-mapua-red text-white rounded px-2 py-1 text-xs mr-2 mb-1"
                              >
                                {paramObj ? paramObj.label : paramValue}
                              </span>
                            );
                          })
                        )
                        }
                        <span className="ml-auto text-gray-500">
                          <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" fill="none" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      </div>
                      {showParamDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                          {paramOptions.map(param => (
                            <label key={param.value} className="flex items-center px-3 sm:px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm sm:text-base">
                              <input
                                type="checkbox"
                                checked={selectedParameters.includes(param.value)}
                                onChange={() => handleParamToggle(param.value)}
                                className="mr-2 accent-mapua-red"
                              />
                              <span>{param.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-1 bg-mapua-red text-white py-2 px-3 sm:py-1.5 sm:px-4 rounded-lg font-semibold shadow hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 mb-4 mt-4 sm:mt-6 w-full sm:w-auto text-sm sm:text-base"
                      onClick={handleSubmit}>
                      <i className="bi bi-download text-base sm:text-lg"></i>
                      Export Data
                    </button>
                  </div>
                </div>
              </form>
            </Overlay>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center h-[30vh] sm:h-[40vh] lg:h-[50vh]">
              <div className="wave-loader"><span className="wave"></span><span className="wave"></span><span className="wave"></span></div>
              <p className="mt-4 text-black text-lg sm:text-xl animate-pulse">Fetching data...</p>
            </div>
          ) : (
            <div className="w-full px-0 overflow-x-auto">
              <div className="min-w-[300px]">
                <table className="w-full bg-white border-collapse rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                  <thead className="bg-mapua-blue text-white">
                    <tr>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-200 text-center font-semibold text-xs sm:text-sm lg:text-base xl:text-lg">Year</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-200 text-center font-semibold text-xs sm:text-sm lg:text-base xl:text-lg">Quarters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedYears.map((year, idx) => (
                      <tr
                        key={year}
                        className={`${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100/70 transition-all duration-150`}
                      >
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-100 text-center text-blue-900 font-bold text-xs sm:text-sm lg:text-base xl:text-lg align-middle whitespace-nowrap">{year}</td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-100 text-center">
                          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                              const pdf = groupedReports[year][quarter];
                              return (
                                <button
                                  key={quarter + year}
                                  className={
                                    pdf
                                      ? "flex items-center gap-1 bg-mapua-red text-white py-1 sm:py-1.5 px-2 sm:px-3 lg:px-4 rounded-lg font-semibold shadow hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 text-xs sm:text-sm whitespace-nowrap"
                                      : "flex items-center gap-1 bg-gray-300 text-gray-400 py-1 sm:py-1.5 px-2 sm:px-3 lg:px-4 rounded-lg font-semibold cursor-not-allowed shadow text-xs sm:text-sm whitespace-nowrap"
                                  }
                                  onClick={pdf ? () => handleQuarterClick(pdf) : undefined}
                                  disabled={!pdf}
                                  title={pdf ? `Open ${quarter} ${year} report` : `No report for ${quarter} ${year}`}
                                >
                                  {quarter}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
