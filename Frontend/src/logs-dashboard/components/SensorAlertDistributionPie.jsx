import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const SensorAlertDistributionPie = ({ data }) => {
  const sensorChartData = {
    labels: ['Active Alerts', 'Normal'],
    datasets: [
      {
        data: [
          data?.Sensor.Alert.Total || 0,
          data?.Sensor.No_Alert.Total || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Sensor Alert Distribution</h3>
      <div className="h-full flex items-center justify-center">
        <Pie data={sensorChartData} options={chartOptions} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
export default SensorAlertDistributionPie;
