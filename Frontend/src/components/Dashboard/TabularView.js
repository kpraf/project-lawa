import React from 'react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  });
};

const TabularView = ({ waterData, selectedMarker }) => (
  <div className="w-full bg-white p-3 sm:p-4 md:p-5 rounded-sm shadow-lg overflow-x-auto">
    <div className="min-w-full">
      <table className="min-w-full bg-white text-xs sm:text-sm md:text-base">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold">Parameter</th>
            <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold">Value</th>
            <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold">Station</th>
            <th className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 text-left font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {waterData && waterData.Parameters && Object.keys(waterData.Parameters).map((param, index) => {
            const value = waterData.Parameters[param].value;
            const station = selectedMarker.station;
            return (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 break-words">{param}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 break-words">{value}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 break-words">{station}</td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 md:px-4 break-words text-xs sm:text-sm">
                  {formatDate(waterData.Parameters[param].time)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default TabularView;