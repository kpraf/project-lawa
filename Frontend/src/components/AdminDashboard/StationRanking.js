import React, { useMemo } from 'react';
import { calculateWQI } from './OWQAdmin';

const StationRanking = ({ data }) => {
  const rankedStations = useMemo(() => {
    return data.stations.map(station => ({
      ...station,
      wqi: calculateWQI(
        Object.fromEntries(
          Object.entries(data.values[station.id] || {}).map(([param, value]) => [param, { value }])
        )
      )
    })).sort((a, b) => a.wqi - b.wqi).slice(0, 5);
  }, [data]);

  return (
    <div className="station-ranking bg-white rounded-md shadow-lg p-5 w-full">
      <h3 className="text-xl font-bold mb-4 text-center">Top 5 Stations by WQI</h3>
      <ul className="list-disc list-inside">
        {rankedStations.map(station => (
          <li key={station.id} className="mb-3 text-2xl">
            <span className="font-semibold">{station.name}:</span> {station.wqi.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StationRanking;
