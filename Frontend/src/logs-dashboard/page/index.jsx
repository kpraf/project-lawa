import { useState, useEffect } from 'react';
import Sidebar from '../../components/sidebar';
import OverviewCards from '../components/OverviewCards';
import DistributionCharts from '../components/DistributionCharts';
import ActivitySection from '../components/ActivitySection';
import DetailedTable from '../components/DetailedTable';
import AlertHeatmap from '../components/AlertHeatmap';
import LogErrorBarChart from '../components/LogErrorBarChart';
import TopStationsAlertBar from '../components/TopStationsAlertBar';
import SensorAlertFrequencyBar from '../components/SensorAlertFrequencyBar';
import LogDistributionPie from '../components/LogDistributionPie';
import SensorAlertDistributionPie from '../components/SensorAlertDistributionPie';
import TotalSensorAlerts from '../components/TotalSensorAlerts';

const LogsDashboard = (props) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const user = props.user;
  const email = props.email;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.projectlawa.org/sensors/report-logs');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-row w-full bg-blue-100 items-center min-h-screen">
        <div className="sticky top-0 z-50 bg-pink-300">
          <Sidebar userProps={user} emailProps={email}/>
        </div>
        <div className="flex w-full justify-center items-center">
          <p className="mt-4 text-black text-xl animate-pulse">Fetching data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full bg-blue-100 items-center min-h-screen">
        <header className="sticky top-0 z-50">
          <Sidebar userProps={user} emailProps={email}/>
        </header>
        <div className="w-[95%] mt-[70px]">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <p className="text-red-500 text-center">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row w-full bg-blue-100">
      <div className="">
        <Sidebar userProps={user} emailProps={email}/>
      </div>
      
      <div className="w-[95%] p-4">
        <p className="text-4xl font-poppins py-9 w-full text-center mb-5 font-bold">System Logs</p>
        <div className="">
          <div className="grid grid-cols-2 gap-4 mb-4 items-start">
            <div className="w-full flex flex-col h-full gap-y-4">
              <OverviewCards data={data} />
              <SensorAlertFrequencyBar sensorData={data} />
            </div>
            <div className="flex flex-col gap-y-4 items-center max-w-full w-full h-full">
              <TotalSensorAlerts data={data} />
              <div className="flex flex-row gap-4 w-full justify-center">
                <div className="w-full">
                  <LogDistributionPie data={data} />
                </div>
                <div className="w-full">
                  <SensorAlertDistributionPie data={data} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 mb-4 gap-x-4">
            <div className="h-full mb-4">
              <AlertHeatmap data={data} />
            </div>
            <TopStationsAlertBar sensorData={data} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            <LogErrorBarChart logData={data.Log} groupBy="day" />
            <SensorAlertFrequencyBar sensorData={data} />
          </div>
          <ActivitySection data={data} />
          <DetailedTable 
            data={data} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
        </div>
      </div>
    </div>
  );
};

export default LogsDashboard;
