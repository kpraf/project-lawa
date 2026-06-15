// import React, { useState, useMemo, useEffect } from 'react';
// import LineGraph from './LineGraph';
// import { CSVLink } from 'react-csv';
// import Dropdown from './Dropdown';

// const LineGraphControls = ({ allData, setSelectedParam, selectedStation, setSelectedStation }) => {
//   const [selectedParam, setSelectedParamState] = useState('all');
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');

//   // Function to convert Roman numerals to integers
//   const romanToInt = (roman) => {
//     const romanMap = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
//     let num = 0, prev = 0;
//     for (let i = roman.length - 1; i >= 0; i--) {
//       const curr = romanMap[roman[i]];
//       if (curr < prev) {
//         num -= curr;
//       } else {
//         num += curr;
//       }
//       prev = curr;
//     }
//     return num;
//   };

//   // Modify the stations array to use numerical IDs
//   const stations = allData && allData.Parameters
//     ? [...new Set(Object.values(allData.Parameters).flat().map(entry => romanToInt(entry.station_id)))]
//         .sort((a, b) => a - b)
//         .map(station => ({ value: station.toString(), label: station.toString() }))
//     : [];

//   // Set the first station as default when stations array is populated
//   useEffect(() => {
//     if (stations.length > 0 && !selectedStation) {
//       setSelectedStation(stations[0].value);
//     }
//   }, [stations, selectedStation, setSelectedStation]);

//   const years = allData && allData.Parameters ? [...new Set(Object.values(allData.Parameters).flat().map(entry => new Date(entry.time).getFullYear()))].map(year => ({ value: year, label: year })) : [];
//   const months = [
//     { value: 0, label: 'January' },
//     { value: 1, label: 'February' },
//     { value: 2, label: 'March' },
//     { value: 3, label: 'April' },
//     { value: 4, label: 'May' },
//     { value: 5, label: 'June' },
//     { value: 6, label: 'July' },
//     { value: 7, label: 'August' },
//     { value: 8, label: 'September' },
//     { value: 9, label: 'October' },
//     { value: 10, label: 'November' },
//     { value: 11, label: 'December' }
//   ];

//   const filterEntries = (entries) => entries.filter(entry => {
//     const date = new Date(entry.time);
//     const entryStationId = romanToInt(entry.station_id);
//     return (!selectedStation || entryStationId === parseInt(selectedStation)) &&
//            (!startDate || date >= new Date(startDate)) &&
//            (!endDate || date <= new Date(endDate));
//   });

//   const filteredData = useMemo(() => {
//     if (!allData || !allData.Parameters || !selectedParam) return { Parameters: {} };

//     if (selectedParam === 'all') {
//       return {
//         ...allData,
//         Parameters: Object.fromEntries(Object.entries(allData.Parameters).map(([param, entries]) => [param, filterEntries(entries)]))
//       };
//     }

//     return {
//       ...allData,
//       Parameters: {
//         [selectedParam]: filterEntries(allData.Parameters[selectedParam] || [])
//       }
//     };
//   }, [allData, selectedParam, selectedStation, startDate, endDate]);

//   const formatDateTime = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleString('en-US', {
//       month: 'long',
//       day: 'numeric',
//       year: 'numeric',
//       hour: 'numeric',
//       minute: 'numeric',
//       second: 'numeric'
//     });
//   };

//   const tableData = selectedParam && selectedParam !== 'all' ? filteredData?.Parameters[selectedParam] || [] : [];
//   const displayedData = tableData
//     .sort((a, b) => new Date(b.time) - new Date(a.time))
//     .slice(0, 10)
//     .map(entry => ({
//       ...entry,
//       time: formatDateTime(entry.time)
//     }));

//   const getFilename = () => {
//     let filename = `${selectedParam}_data`;
//     if (selectedStation) {
//       filename += `_${selectedStation}`;
//     }
//     if (startDate || endDate) {
//       filename += `_${startDate || 'start'}-${endDate || 'end'}`;
//     }
//     return `${filename}.csv`;
//   };

//   const handleStationChange = (value) => {
//     setSelectedStation(value);
//   };

//   return (
//     <div className="mt-5 items-start w-[100%] flex flex-col">
//       <div className="flex flex-row space-x-5">
        
//         <div className="flex flex-row space-x-5">
//           <div className="flex flex-col">
//             <label htmlFor="parameter-select">Select Parameter</label>
//             <Dropdown
//               id="parameter-select"
//               value={selectedParam}
//               onChange={(e) => setSelectedParamState(e.target.value)}
//               options={allData && allData.Parameters ? [{ value: 'all', label: 'All Parameters' }, ...Object.keys(allData.Parameters).map(param => ({ value: param, label: param }))] : []}
//               defaultOption="Select Parameter"
//             />
//           </div>
//           <div className="flex flex-col ">
//             <label htmlFor="station-select">Select Station</label>
//             <Dropdown
//               id="station-select"
//               value={selectedStation}
//               onChange={(e) => handleStationChange(e.target.value)}
//               options={[{ value: '', label: 'All Stations' }, ...stations]}
//               defaultOption="Select Station"
//             />
//           </div>
//         </div>
//         <div className="flex flex-row space-x-5 ">
//           <div className="flex flex-col">
//             <label htmlFor="start-date">Start Date</label>
//             <input
//               id="start-date"
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="p-3 border rounded-sm bg-white shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
//             />
//           </div>
//           <div className="flex flex-col">
//             <label htmlFor="end-date">End Date</label>
//             <input
//               id="end-date"
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="p-3 border rounded-sm bg-white shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
//             />
//           </div>
//         </div>
//       </div>
//       <div className="w-full flex flex-wrap gap-5">
//         {selectedParam === 'all' ? (
//           Object.keys(allData?.Parameters || {}).map(param => (
//             <div key={param} className="w-[30%]">
//               <LineGraph allData={filteredData} selectedParam={param} className="w-full" />
//             </div>
//           ))
//         ) : (
//           <div className="w-[30%]">
//             <LineGraph allData={filteredData} selectedParam={selectedParam} className="w-full" />
//           </div>
//         )}
//       </div>
//       <div className="w-full">
//         {selectedParam && selectedParam !== 'all' && (
//           <div className="mt-5 w-full">
//             <h3 className="text-lg font-poppins mb-4 text-left">Filtered Data Table</h3>
//             <table className="min-w-full bg-white">
//               <thead>
//                 <tr>
//                   {displayedData.length > 0 && Object.keys(displayedData[0]).map((key) => (
//                     <th key={key} className="py-2 px-4 border-b">{key}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {displayedData.map((entry, index) => (
//                   <tr key={index}>
//                     {Object.values(entry).map((value, i) => (
//                       <td key={i} className="py-2 px-4 border-b">{value}</td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {tableData.length > 10 && (
//               <p className="text-sm text-gray-500 mt-2">Only the first 10 rows are displayed. Export to see all data.</p>
//             )}
//             <CSVLink
//               data={tableData}
//               filename={getFilename()}
//               className="mt-3 inline-block p-2 bg-blue-500 text-white rounded shadow"
//             >
//               Export Data
//             </CSVLink>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LineGraphControls;
