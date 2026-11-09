import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AlertHeatmap = ({ data }) => {
  const [timeRange, setTimeRange] = useState('daily');

  // Process data to get alert frequencies
  const processData = () => {
    if (!data?.Sensor?.Data?.Stations) return null;

    const stations = data.Sensor.Data.Stations;
    const allTimeKeys = new Set(); // To store all unique time keys
    const stationDataMap = new Map(); // To store data for each station

    // First pass: collect all time keys and initialize station data
    stations.forEach(station => {
      const stationCode = Object.keys(station)[0];
      const stationData = station[stationCode].Data;
      
      // Initialize data structure for this station
      stationDataMap.set(stationCode, new Map());

      // Process each alert
      stationData.forEach(alert => {
        const date = new Date(alert.time);
        let timeKey;

        switch (timeRange) {
          case 'hourly':
            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
            break;
          case 'daily':
            timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            break;
          case 'weekly':
            const weekNumber = getWeekNumber(date);
            timeKey = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
            break;
          default:
            timeKey = date.toLocaleDateString();
        }

        allTimeKeys.add(timeKey);
        
        // Update station's alert count for this time period
        const currentCount = stationDataMap.get(stationCode).get(timeKey) || 0;
        if (alert.alert) {
          stationDataMap.get(stationCode).set(timeKey, currentCount + 1);
        }
      });
    });

    // Convert time keys to sorted array
    const sortedTimeKeys = Array.from(allTimeKeys).sort((a, b) => {
      if (timeRange === 'monthly') {
        return new Date(a) - new Date(b);
      }
      return a.localeCompare(b);
    });

    // Define a color palette for up to 6 stations
    const colorPalette = [
      { border: 'rgb(54, 162, 235)', background: 'rgba(54, 162, 235, 0.1)' }, // Blue
      { border: 'rgb(255, 99, 132)', background: 'rgba(255, 99, 132, 0.1)' }, // Red
      { border: 'rgb(255, 206, 86)', background: 'rgba(255, 206, 86, 0.1)' }, // Yellow
      { border: 'rgb(75, 192, 192)', background: 'rgba(75, 192, 192, 0.1)' }, // Teal
      { border: 'rgb(153, 102, 255)', background: 'rgba(153, 102, 255, 0.1)' }, // Purple
      { border: 'rgb(255, 159, 64)', background: 'rgba(255, 159, 64, 0.1)' }, // Orange
    ];

    // Create datasets for the chart
    const datasets = Array.from(stationDataMap.entries()).map(([stationCode, timeData], idx) => ({
      label: `Station ${stationCode}`,
      data: sortedTimeKeys.map(timeKey => timeData.get(timeKey) || 0),
      borderColor: colorPalette[idx % colorPalette.length].border,
      backgroundColor: colorPalette[idx % colorPalette.length].background,
      fill: false, // No area fill for clarity
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 7,
      borderWidth: 2,
    }));

    return {
      labels: sortedTimeKeys,
      datasets,
    };
  };

  const chartData = processData();

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: 'Poppins', size: 14 },
          boxWidth: 20,
          boxHeight: 2,
          padding: 20,
        },
      },
      title: {
        display: true,
        font: { family: 'Poppins', size: 18, weight: 'bold' },
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} alerts`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Alerts',
          font: { family: 'Poppins', size: 14 },
        },
        grid: { color: '#e5e7eb' },
      },
      x: {
        title: {
          display: true,
          text: 'Time Period',
          font: { family: 'Poppins', size: 14 },
        },
        grid: { color: '#f3f4f6' },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-start items-center mb-4">
        <h3 className="text-lg font-semibold font-poppins">Alert Frequency Analysis</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm ml-4"
        >
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      {chartData ? (
        <div className="flex-1 flex justify-center items-center">
          <Line data={chartData} options={options} className="w-full h-full" />
        </div>
      ) : (
        <div className="h-[250px] flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

// Helper function to get week number
const getWeekNumber = (date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export default AlertHeatmap;
