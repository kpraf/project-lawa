import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const DistributionCharts = ({ data }) => {
  // Log Distribution Chart Data
  const logChartData = {
    labels: ['Reports', 'System'],
    datasets: [
      {
        data: [
          data?.Log.Report.Total || 0,
          data?.Log.System.Total || 0
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',  // Blue for Reports
          'rgba(255, 99, 132, 0.6)',  // Pink for System
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Sensor Alert Distribution Chart Data
  const sensorChartData = {
    labels: ['Active Alerts', 'Normal'],
    datasets: [
      {
        data: [
          data?.Sensor.Alert.Total || 0,
          data?.Sensor.No_Alert.Total || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',  // Red for Alerts
          'rgba(75, 192, 192, 0.6)',  // Green for Normal
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Common chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: '', // Will be set per chart below
        font: { family: 'Poppins', size: 16, weight: 'bold' },
      },
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Log Distribution</h3>
        <div className="h-[300px] flex items-center justify-center">
          <Pie data={logChartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                display: true,
                text: 'Log Distribution (Reports vs System)',
              }
            }
          }} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sensor Alert Distribution</h3>
        <div className="h-[300px] flex items-center justify-center">
          <Pie data={sensorChartData} options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                display: true,
                text: 'Sensor Alert Distribution (Active Alerts vs Normal)',
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default DistributionCharts;