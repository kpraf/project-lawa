import React from 'react';
import { calculateWQI } from './OverallWaterQuality';

const StationRanking = ({ data }) => {
  const calculateStationWQI = (stationId) => {
    const stationValues = data.values[stationId];
    if (!stationValues) return 100; // Default to worst score if no data

    const parameters = Object.keys(stationValues).reduce((acc, param) => {
      acc[param] = { value: stationValues[param] };
      return acc;
    }, {});

    return calculateWQI(parameters);
  };

  const rankedStations = data.stations.map(station => ({
    ...station,
    wqi: calculateStationWQI(station.id)
  })).sort((a, b) => a.wqi - b.wqi).slice(0, 5);

  return (
    <div className="station-ranking bg-white rounded-md shadow-lg p-3 sm:p-4 md:p-5 w-full">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-center">Top 5 Stations by WQI</h3>
      <ul className="list-disc list-inside space-y-1 sm:space-y-2">
        {rankedStations.map(station => (
          <li key={station.id} className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl break-words">
            <span className="font-semibold">{station.name}:</span> {station.wqi.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StationRanking;
