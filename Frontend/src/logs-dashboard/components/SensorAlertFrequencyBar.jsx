import { Bar } from 'react-chartjs-2';
import { getAlertFrequencyPerSensor } from '../utils/sensorChartUtils';

const SensorAlertFrequencyBar = ({ sensorData }) => {
  const chartDataArr = getAlertFrequencyPerSensor(sensorData);
  const chartData = {
    labels: chartDataArr.map(d => d.sensor),
    datasets: [
      {
        label: 'Alerts',
        data: chartDataArr.map(d => d.alerts),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fill container height
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Alerts',
          font: { family: 'Poppins', size: 14 },
        },
      },
      x: {
        title: {
          display: true,
          text: 'Sensor',
          font: { family: 'Poppins', size: 14 },
        },
      },
    },
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Alert Frequency per Sensor</h3>
      <div className="flex-1">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};
export default SensorAlertFrequencyBar;
