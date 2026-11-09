import OverviewCard from '../components/OverviewCard';

const TotalSensorAlerts = ({ data }) => {
  // Helper to extract per-station and per-sensor alert/success
  const alertStations = data?.Sensor?.Alert?.Data?.Stations || [];
  const noAlertStations = data?.Sensor?.No_Alert?.Data?.Stations || [];
  const alertSensors = data?.Sensor?.Alert?.Data?.Parameters || [];
  const noAlertSensors = data?.Sensor?.No_Alert?.Data?.Parameters || [];

  // Map for quick lookup of success (no alert) by station/sensor
  const noAlertStationMap = {};
  noAlertStations.forEach(stationObj => {
    const code = Object.keys(stationObj)[0];
    noAlertStationMap[code] = stationObj[code].Total;
  });
  const alertStationMap = {};
  alertStations.forEach(stationObj => {
    const code = Object.keys(stationObj)[0];
    alertStationMap[code] = stationObj[code].Total;
  });

  const noAlertSensorMap = {};
  noAlertSensors.forEach(sensorObj => {
    const name = Object.keys(sensorObj)[0];
    noAlertSensorMap[name] = sensorObj[name].Total;
  });
  const alertSensorMap = {};
  alertSensors.forEach(sensorObj => {
    console.log(Object.keys(sensorObj))
    const name = Object.keys(sensorObj)[0];
    alertSensorMap[name] = sensorObj[name].Total;
  });

    return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 w-full">
          <OverviewCard
            // title="Total Sensor Alerts"
            total={data?.Sensor.Total}
            success={data?.Sensor.No_Alert.Total}
            error={data?.Sensor.Alert.Total}
            inlineChildren={true}
          >
            <div className="flex flex-row w-full gap-4 items-start h-full">
              {/* Section 1: Per Station */}
              <div className="flex-1 min-w-0 h-full">
                <div className="mb-1 text-gray-600 font-medium text-sm">Per Station</div>
                <div className="flex flex-row flex-wrap gap-2 overflow-x-auto pb-2 h-f;;">
                  {Object.keys({...alertStationMap, ...noAlertStationMap}).map(stationCode => (
                    <div key={stationCode} className="min-w-[90px] h-full">
                      <div className="bg-gray-50 rounded-lg shadow p-2 flex flex-col items-center h-full">
                        <div className="font-semibold text-blue-700 mb-1">{stationCode}</div>
                        <div className="flex flex-row space-x-2 text-xs">
                          <span className="text-green-600 font-semibold">Success: {noAlertStationMap[stationCode] || 0}</span>
                          <span className="text-red-600 font-semibold">Errors: {alertStationMap[stationCode] || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Section 2: Per Sensor */}
              <div className="flex-1 w-full">
                <div className="mb-1 text-gray-600 font-medium text-sm">Per Sensor</div>
                <div className={`grid grid-cols-3 flex-wrap gap-2`}>
                  {Object.keys({...alertSensorMap, ...noAlertSensorMap}).map(sensorName => (
                    <div key={sensorName} className="min-w-[110px]">
                      <div className="bg-gray-50 rounded-lg shadow p-2 flex flex-col items-center">
                        <div className="font-semibold text-blue-700 mb-1">{sensorName}</div>
                        <div className="flex flex-row space-x-2 text-xs">
                          <span className="text-green-600 font-semibold">Success: {noAlertSensorMap[sensorName] || 0}</span>
                          <span className="text-red-600 font-semibold">Errors: {alertSensorMap[sensorName] || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          </OverviewCard>
        </div>
    )
};

export default TotalSensorAlerts;