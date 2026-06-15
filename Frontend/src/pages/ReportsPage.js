import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import Footer from '../components/Footer'

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('process.env.REACT_APP_API_URL/reports/list/');
        const data = await response.json();
        setReports(data.reports);
        console.log(reports);
      } catch (error) {
        // console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleQuarterClick = (pdfUrl) => window.open(pdfUrl, '_blank');

  const groupedReports = React.useMemo(() => {
    // Build a map: { year: { Q1: pdf, Q2: pdf, ... } }
    const map = {};
    reports.forEach(({ title, pdf }) => {
      const [quarter, year] = title.split(' ');
      if (!map[year]) map[year] = {};
      map[year][quarter] = pdf;
    });
    // Ensure all years have Q1-Q4 (even if missing)
    Object.keys(map).forEach(year => {
      ['Q1', 'Q2', 'Q3', 'Q4'].forEach(q => {
        if (!(q in map[year])) map[year][q] = null;
      });
    });
    return map;
  }, [reports]);

  // Sort years in descending order for display
  const sortedYears = Object.keys(groupedReports).sort((a, b) => b - a);

  return (
    <div className="flex flex-col w-full bg-gradient-to-b from-blue-100 via-blue-50 to-white items-center min-h-screen">
      <header className="w-full sticky top-0 z-50 shadow-md bg-white/80 backdrop-blur">
        <Navbar />
      </header>
      <div className="w-full max-w-4xl px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 mb-4 sm:mb-8 mt-4 sm:mt-8">
        <div className="flex flex-col items-center mb-6 sm:mb-8 px-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-poppins text-blue-900 tracking-tight mb-2 drop-shadow-lg text-center uppercase">
            Quarterly Reports
          </h1>
          <div className="h-1 w-16 sm:w-24 bg-blue-500 rounded-full mb-2 shadow"></div>
          <p className="text-gray-600 text-center max-w-xl mt-2 text-sm sm:text-base lg:text-lg">Browse and download quarterly reports by year. Click on a quarter to view the PDF report.</p>
        </div>
        <div className="w-full bg-white/90 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 md:p-8 lg:p-10 border border-blue-200">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-[30vh] sm:h-[40vh] lg:h-[50vh]">
              <div className="wave-loader"><span className="wave"></span><span className="wave"></span><span className="wave"></span></div>
              <p className="mt-4 text-black text-lg sm:text-xl animate-pulse">Fetching data...</p>
            </div>
          ) : (
            <div className="w-full px-0 overflow-x-auto">
              <table className="min-w-full bg-white border-collapse rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
                <thead className="bg-mapua-blue text-white">
                  <tr>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-200 text-center font-semibold text-sm sm:text-base lg:text-lg">Year</th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-200 text-center font-semibold text-sm sm:text-base lg:text-lg">Quarters</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedYears.map((year, idx) => (
                    <tr
                      key={year}
                      className={`${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:bg-blue-100/70 transition-all duration-150`}
                    >
                      <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-100 text-center text-blue-900 font-bold text-sm sm:text-base lg:text-lg align-middle">{year}</td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 border-b border-blue-100 text-center">
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                          {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                            const pdf = groupedReports[year][quarter];
                            return (
                              <button
                                key={quarter + year}
                                className={
                                  pdf
                                    ? "flex items-center gap-1 bg-mapua-red text-white py-1 sm:py-1.5 px-2 sm:px-4 rounded-lg font-semibold shadow hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 text-xs sm:text-sm"
                                    : "flex items-center gap-1 bg-gray-300 text-gray-400 py-1 sm:py-1.5 px-2 sm:px-4 rounded-lg font-semibold cursor-not-allowed shadow text-xs sm:text-sm"
                                }
                                onClick={pdf ? () => handleQuarterClick(pdf) : undefined}
                                disabled={!pdf}
                                title={pdf ? `Open ${quarter} ${year} report` : `No report for ${quarter} ${year}`}
                              >
                                {quarter}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="w-full mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default ReportsPage;
