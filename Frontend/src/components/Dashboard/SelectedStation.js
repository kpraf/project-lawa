import React from 'react';

const SelectedStation = ({ selectedMarker }) => {
  if (!selectedMarker || !selectedMarker.station) {
    return (
      <div className="object-center items-center selected-station p-3 sm:p-4 md:p-5 rounded-sm shadow-lg bg-white text-black mb-2 sm:mb-3 md:mb-4">
        <p className="text-base sm:text-lg md:text-xl font-bold text-center">No station selected.</p>
      </div>
    );
  }

  return (
    <div className="object-center items-center selected-station p-3 sm:p-4 md:p-5 rounded-sm shadow-lg bg-white text-black mb-2 sm:mb-3 md:mb-4">
      <div className="flex items-center justify-center">
        <p className="text-base sm:text-lg md:text-xl font-bold text-center break-words">
          Selected Station: {selectedMarker.station}
        </p>
      </div>
    </div>
  );
};

export default SelectedStation; 