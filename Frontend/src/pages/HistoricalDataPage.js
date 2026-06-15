import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import Tab from '../components/AnalyticsTab';
import LineGraphControls from '../components/Dashboard/LineGraphControls';
import { fetchAllData } from '../components/Dashboard/helpers';
import Footer from '../components/Footer'

const HistoricalDataPage = () => {
  const [searchParams] = useSearchParams();
  const [allData, setAllData] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null); // should be null for initial
  const [initialParameter, setInitialParameter] = useState(null);
  const [fromDashboard, setFromDashboard] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only read URL parameters once when component mounts
    if (!initializedRef.current) {
      const urlStation = searchParams.get('station');
      const urlParameter = searchParams.get('parameter');
      const urlFromDashboard = searchParams.get('fromDashboard');
      
      if (urlStation) {
        setSelectedStation(urlStation);
      }
      if (urlParameter) {
        setInitialParameter(urlParameter);
      }
      if (urlFromDashboard === 'true') {
        setFromDashboard(true);
      }
      initializedRef.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    // Fetch with status=Today on startup
    fetchAllData(setAllData, { status: 'All Time' });
  }, []);

  return (
    <div className="flex flex-col w-full bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 items-center" style={{ zoom: 0.8 }}>
      <header className="w-full content-center object-top sticky top-0 z-50">
        <Navbar/>
      </header>

      {/* Make container full width and responsive with less side margin */}
      <div className="w-full max-w-none px-0 sm:px-1 md:px-2 lg:px-4 xl:px-8 mb-4">
        {/* Enhanced label */}
        <div className="flex flex-col items-center mt-8 mb-6 px-2">
          <h1 className="text-lg sm:text-xl font-bold font-poppins text-blue-900 tracking-tight mb-2 drop-shadow-sm text-center">
            Data Monitoring &amp; Analytics
          </h1>
          <div className="h-1 w-16 bg-blue-500 rounded-full mb-2"></div>
          {/* Removed description text */}
        </div>
        {/* <Tab /> */}
        <div className="w-full bg-white/90 rounded-2xl shadow-xl p-2 sm:p-4 md:p-8">
          {allData ? (
            <div className="w-full">
              <LineGraphControls 
                allData={allData} 
                selectedStation={selectedStation} 
                setSelectedStation={setSelectedStation}
                initialParameter={initialParameter}
                fromDashboard={fromDashboard}
              />
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-[100dvh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-400 border-b-4 mb-4"></div>
              <p className="mt-2 text-blue-700 text-lg font-semibold">Fetching data...</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default HistoricalDataPage;