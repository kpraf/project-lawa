export function getTopStationsWithAlerts(sensorData, topN = 5) {
  // sensorData: data.Sensor.Alert.Data.Stations
  const stationAlerts = sensorData.Sensor.Alert.Data.Stations || [];
  const stationCounts = stationAlerts.map(stationObj => {
    const code = Object.keys(stationObj)[0];
    const total = stationObj[code].Total;
    return { station: code, alerts: total };
  });
  // Sort and take top N
  return stationCounts.sort((a, b) => b.alerts - a.alerts).slice(0, topN);
}


export function getAlertFrequencyPerSensor(sensorData) {
    // sensorData: data.Sensor.Alert.Data.Parameters
    const paramAlerts = sensorData.Sensor.Alert.Data.Parameters || [];
    return paramAlerts.map(paramObj => {
      const name = Object.keys(paramObj)[0];
      const total = paramObj[name].Total;
      return { sensor: name, alerts: total };
    });
}