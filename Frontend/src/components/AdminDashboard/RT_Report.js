import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { parameterUnits } from './ParameterDetails';
import { calculateWQI } from './OWQAdmin'; 
import StationRanking from './StationRanking'; 
import HoverModal from '../hoverModal'; // import HoverModal
import { parameterRanges } from '../Dashboard/GradeDescription'; // import parameterRanges

// Parameter descriptions (copy from S_Container)
// const parameterDescriptions = {
//   pH: 'pH measures the acidity or alkalinity of water. Extreme pH levels can be harmful to aquatic life.',
//   DO: 'Dissolved Oxygen is essential for aquatic life. Low levels can lead to fish kills.',
//   Temperature: 'Water Temperature affects the metabolic rates of aquatic organisms and the solubility of oxygen.',
//   ORP: "Oxidation-Reduction Potential (ORP) measures the water's ability to oxidize pollutants; higher values indicate better water quality.",
//   Turbidity: 'Indicates water cloudiness caused by particles; high levels can harm aquatic ecosystems.',
//   TDS: 'Represents dissolved substances in water; high levels affect taste, quality, and usability.',
// };

const classColors = {
  AA: 'bg-new-yellow-green',     // Good but not optimal for Laguna de Bay
  A: 'bg-new-orange',            // Acceptable  
  B: 'bg-new-green',             // Very good (light green)
  C: 'bg-new-green',             // OPTIMAL for Laguna de Bay (green)
  D: 'bg-new-red bg-opacity-90'  // Poor
};

// Use more distinct background colors for table cells
const cellBgColors = {
  Orange: "bg-[#ffb84d]", // vivid orange for Class C
  Red: "bg-[#ff4d4f]",    // vivid red for Class D
  Default: "bg-white"
};

const RT_Report = () => {
  const [waterData, setWaterData] = useState([]);

  // Helper to rename "temperature" key to "Temp" in station data
  const renameTemperatureKey = (dataArray) => {
    return dataArray.map(items => {
      const newItems = {};
      Object.keys(items).forEach(station => {
        const stationParams = items[station];
        if (stationParams && typeof stationParams === 'object') {
          const newParams = {};
          Object.keys(stationParams).forEach(param => {
            if (param === 'Temperature') {
              newParams['Temp'] = stationParams[param];
            } else {
              newParams[param] = stationParams[param];
            }
          });
          newItems[station] = newParams;
        } else {
          newItems[station] = stationParams;
        }
      });
      return newItems;
    });
  };

  // Example usage inside fetchWaterData
  const fetchWaterData = useCallback(async () => {
    try {
      const response = await fetch(`process.env.REACT_APP_API_URL/sensors/recent-data`);
      const data = await response.json();
      const dataArray = Array.isArray(data) ? data : [data];
      // Rename "temperature" to "Temp" in the fetched data
      setWaterData(renameTemperatureKey(dataArray));
      console.log(waterData);
    } catch (error) {
      console.error('Error fetching water data:', error);
    }
  }, []);

  useEffect(() => {
      fetchWaterData();
    }, []);

  const getTrendIndicator = (currentValue, previousValue) => {
    if (currentValue > previousValue) {
      return <i class="bi bi-caret-up-fill ml-2"></i>;
    } else if (currentValue < previousValue) {
      return <i class="bi bi-caret-down-fill ml-2"></i>;
    }
  };

  const isDangerous = (color) => {
    if (color === "Orange") {
      return `${cellBgColors.Orange} text-white font-semibold border border-gray-300`;
    } else if (color === "Red") {
      return `${cellBgColors.Red} text-white font-semibold border border-gray-300`;
    } else {
      return "bg-white font-medium border border-gray-200";
    }
  };

  const calculateStationWQI = (stationId) => {
    const stationValues = waterData.values[stationId];
    if (!stationValues) return 100; // Default to worst score if no data

    const parameters = Object.keys(stationValues).reduce((acc, param) => {
      acc[param] = { value: stationValues[param] };
      return acc;
    }, {});

    return calculateWQI(parameters);
  };

  const rankedStations = Array.isArray(waterData.stations) ? waterData.stations.map(station => ({
    ...station,
    wqi: calculateStationWQI(station.id)
  })).sort((a, b) => a.wqi - b.wqi) : [];

  // Helper to get hover content for a parameter
  const getHoverContent = (param) => {
    // Map aliases for parameterRanges lookup
    let paramKeyForRange = param;
    if (param === "ORP") paramKeyForRange = "Oxidation-Reduction Potential";
    if (param === "DO") paramKeyForRange = "Dissolved Oxygen";
    if (param === "TDS") paramKeyForRange = "Total Dissolved Solids";
    // Map "Temp" to "Temperature" for hover content
    if (param === "Temp") paramKeyForRange = "Temperature";
    if (parameterRanges[paramKeyForRange]) {
      return (
        <div>
          <div className="font-semibold mb-1">Class Ranges:</div>
          <table className="min-w-full text-xs border">
            <thead>
              <tr>
                <th className="border px-1 py-0.5">Class</th>
                <th className="border px-1 py-0.5">Range</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parameterRanges[paramKeyForRange]).map(([classKey, [unitVal, rangeVal]]) => {
                const isOptimal = classKey === 'C'; // Class C is optimal for Laguna de Bay
                return (
                  <tr key={classKey}>
                    <td className={`border px-1 py-0.5 ${classColors[classKey] || ''}`}>
                      {classKey}
                    </td>
                    <td className={`border px-1 py-0.5 ${classColors[classKey] || ''}`}>{rangeVal} {unitVal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-green-700 text-center px-2 py-1 bg-green-50 rounded-lg font-medium">
            Class C is optimal for Laguna de Bay (LLDA guidelines)
          </div>
        </div>
      );
    }
    // if (parameterDescriptions[param]) {
    //   return <div>{parameterDescriptions[param]}</div>;
    // }
    return null;
  };

  // Helper: get all parameter keys from the first station in waterData
  const getAllParams = () => {
    if (waterData.length > 0 && waterData[0]['Station I']) {
      return Object.keys(waterData[0]['Station I']);
    }
    return [];
  };

  // Helper: build simulated station row with all params as N/A
  const buildSimulatedStation = (stationName) => {
    const params = getAllParams();
    const paramObj = {};
    params.forEach(param => {
      paramObj[param] = { value: "N/A" };
    });
    return { [stationName]: paramObj };
  };

  // Compose table rows: real data + simulated stations
  const tableRows = [
    ...waterData,
    buildSimulatedStation("Station III"),
    buildSimulatedStation("Station IV")
  ];

  // Station name mapping for tooltips
  const stationNameMap = {
    "Station I": "Central West Bay",
    "Station II": "Central East Bay",
    "Station III": "Central South Bay (not real)",
    "Station IV": "Central Bay"
  };

  return (
    <div className="flex flex-col w-full h-full bg-white shadow-lg p-1 sm:p-2 transition-all duration-200 font-inter relative z-10">
      <div className="w-full flex-1 overflow-auto relative z-10">
        <table className="min-w-full divide-y divide-gray-200 text-center border border-gray-200 shadow-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10">
            <tr>
              <th className="py-2 px-1 sm:px-2 text-center font-semibold border border-gray-200 text-gray-700 tracking-wide uppercase rounded-tl-lg text-xs">
                STATION
              </th>
              {getAllParams().map(param => {
                const displayParam = param === 'temperature' ? 'TEMP' : param.toUpperCase();
                const hoverContent = getHoverContent(displayParam);
                return (
                  <th
                    key={displayParam}
                    className="py-2 px-0.5 sm:px-1 text-center font-semibold uppercase border border-gray-200 text-gray-700 tracking-wide text-xs"
                  >
                    {hoverContent ? (
                      <HoverModal text={hoverContent}>
                        <span className="underline decoration-dotted decoration-2 cursor-help hover:text-blue-700 transition">{displayParam}</span>
                      </HoverModal>
                    ) : (
                      displayParam
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((items, index) =>
              Object.keys(items).map((station, rowIdx) => (
                <tr
                  key={`${station}-${index}`}
                  className={rowIdx % 2 === 0 ? "bg-gray-50 hover:bg-blue-50 transition" : "bg-white hover:bg-blue-50 transition"}
                  style={{ height: 59 }} // Increased row height
                >
                  <td className="py-2 px-1 sm:px-2 text-center font-medium border border-gray-200 text-gray-800 text-xs">
                    {stationNameMap[station] ? (
                      <HoverModal text={stationNameMap[station]}>
                        <span className="underline decoration-dotted decoration-2 cursor-help">{station.replace('Station ', 'S')}</span>
                      </HoverModal>
                    ) : (
                      station.replace('Station ', 'S')
                    )}
                  </td>
                  {getAllParams().map((param) => {
                    const displayParam = param === 'temperature' ? 'Temp' : param;
                    const cellData = items[station]?.[param] || { value: "N/A" };
                    const color = cellData.Color || 'Default';
                    const showHover = color === "Red" || color === "Orange";
                    const hoverContent = showHover ? getHoverContent(displayParam) : null;
                    const cellContent = (
                      <>
                        {cellData.value !== undefined
                          ? (typeof cellData.value === 'number' ? cellData.value.toFixed(1) : cellData.value)
                          : "N/A"}
                        {cellData.status !== undefined && cellData.value !== "N/A"
                          ? getTrendIndicator(cellData.value, cellData.before)
                          : ""}
                      </>
                    );
                    return (
                      <td
                        key={displayParam}
                        className={
                          (isDangerous(color) || "") +
                          " px-0.5 sm:px-1 text-center border border-gray-200 transition-all duration-150 rounded hover:shadow-md text-xs " +
                          (showHover ? "cursor-pointer hover:brightness-95" : "")
                        }
                        style={{
                          minWidth: 40,
                          height: 40,
                          fontWeight: color === "Red" || color === "Orange" ? 600 : 400,
                          color: color === "Red" || color === "Orange" ? "#fff" : "#222"
                        }}
                      >
                        {showHover && hoverContent ? (
                          <HoverModal text={hoverContent}>
                            <span className="underline decoration-dotted decoration-2 cursor-help">{cellContent}</span>
                          </HoverModal>
                        ) : (
                          cellContent
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-x-2 sm:gap-x-3 text-xs ml-1 text-gray-700 font-inter justify-center mt-1">
        <span className="font-semibold">Legends:</span>
        <div className="flex flex-row items-center gap-x-2 sm:gap-x-3">
          <div className="flex flex-row items-center gap-x-1">
            <span className="inline-block w-3 h-3 rounded bg-[#ffb84d] border border-gray-300"></span>
            <span>C</span>
          </div>
          <div className="flex flex-row items-center gap-x-1">
            <span className="inline-block w-3 h-3 rounded bg-[#ff4d4f] border border-gray-300"></span>
            <span>D</span>
          </div>
          <div className="flex flex-row items-center gap-x-1">
            <span className="inline-block w-3 h-3 rounded border border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200"></span>
            <span>AA-B</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RT_Report;

