import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getTopStationsWithAlerts } from '../utils/sensorChartUtils';
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
  
const TopStationsAlertBar = ({ sensorData }) => {
  const chartDataArr = getTopStationsWithAlerts(sensorData);
  const chartData = {
    labels: chartDataArr.map(d => d.station),
    datasets: [
      {
        label: 'Alerts',
        data: chartDataArr.map(d => d.alerts),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
    ],
  };
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Alerts',
          font: { family: 'Poppins', size: 14 },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Station',
          font: { family: 'Poppins', size: 14 },
        },
      },
    },
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Stations with Most Alerts</h3>
      <Bar data={chartData} options={options} />
    </div>
  );
};
export default TopStationsAlertBar;
