import { Bar } from 'react-chartjs-2';
import { getUnsuccessfulLogsByDate } from '../utils/logsChartUtils';

const LogErrorBarChart = ({ logData, groupBy = 'day' }) => {
  const chartDataArr = getUnsuccessfulLogsByDate(logData, groupBy);
  const labels = chartDataArr.map(d => d.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'System',
        data: chartDataArr.map(d => d.System),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
      },
      {
        label: 'Report',
        data: chartDataArr.map(d => d.Report),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Unsuccessful Logs',
          font: { family: 'Poppins', size: 14 },
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
          font: { family: 'Poppins', size: 14 },
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Unsuccessful Logs per {groupBy === 'week' ? 'Week' : 'Day'}</h3>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default LogErrorBarChart;
