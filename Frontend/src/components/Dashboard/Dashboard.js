import Map from './Map_clean';
import SquaresContainer from './S_Container';
import { useState, useEffect } from 'react';
import OverallWaterQuality from './OverallWaterQuality';
import Weather from './Weather';
import { classDescriptions } from './GradeDescription';

function getOverallGrade(data) {
  if (!Array.isArray(data) || data.length === 0) return 'No data available';
  const validData = data.filter(item => item?.value != null);
  return validData.length ? validData.map(item => item.value) : 'No valid data available';
}

function Dashboard({ data }) {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedStation, setSelectedStation] = useState('');
  const overallGrade = getOverallGrade(data);

  useEffect(() => {
    if (selectedMarker) setSelectedStation(selectedMarker.station);
  }, [selectedMarker]);

  return (
    <div className="main-container flex flex-col items-start p-5 flex-grow bg-blue-100 space-y-5">
      <div className="flex justify-between items-start w-full space-x-5">
        <Map onMarkerSelect={setSelectedMarker} />
        <Weather />
        <SquaresContainer selectedMarker={selectedMarker} selectedStation={selectedStation} />
        {selectedMarker && (
          <OverallWaterQuality
            waterData={selectedMarker.waterData}
            className="text-center"
            selectedStation={selectedMarker.station}
            classDescriptions={classDescriptions}
          />
        )}
      </div>
      <p>Overall Grade: {overallGrade}</p>
    </div>
  );
}

export default Dashboard;
