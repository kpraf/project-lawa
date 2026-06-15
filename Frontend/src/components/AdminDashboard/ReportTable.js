// import React, { useMemo } from 'react';

// const ReportTable = ({ filteredData, selectedYear, selectedQuarter, getQuarterMonths, romanToInt }) => {
//   const generateTableData = useMemo(() => {
//     if (!filteredData || !filteredData.Parameters) return [];

//     const months = selectedQuarter ? getQuarterMonths(selectedQuarter) : [];
//     const groupedData = {};

//     Object.entries(filteredData.Parameters).forEach(([param, entries]) => {
//       entries.forEach(entry => {
//         const station = romanToInt(entry.station_id).toString();
//         if (!groupedData[station]) groupedData[station] = {};
//         if (!groupedData[station][param]) groupedData[station][param] = {};
//         const month = new Date(entry.time).getMonth() + 1;
//         if (!selectedQuarter || months.includes(month)) {
//           if (!groupedData[station][param][month]) groupedData[station][param][month] = [];
//           groupedData[station][param][month].push(parseFloat(entry.value));
//         }
//       });
//     });

//     return Object.entries(groupedData).map(([station, params]) => ({
//       station,
//       parameters: Object.entries(params).map(([param, months]) => ({
//         param,
//         monthlyAverages: months
//       }))
//     }));
//   }, [filteredData, selectedQuarter]);

//   const getMonthName = (monthNumber) => {
//     const date = new Date();
//     date.setMonth(monthNumber - 1);
//     return date.toLocaleString('en-US', { month: 'short' });
//   };

//   return (
//     <div className="mt-5 w-full">
//       <h3 className="text-lg font-poppins mb-4 text-left">
//         Reports for {selectedYear} - {selectedQuarter}
//       </h3>
//       <table className="min-w-full bg-white border-collapse border border-gray-300">
//         <thead>
//           <tr>
//             <th className="py-2 px-4 border border-gray-300 text-center" rowSpan="2">Station</th>
//             <th className="py-2 px-4 border border-gray-300 text-center" colSpan={3 * Object.keys(filteredData.Parameters).length}>
//               Parameters
//             </th>
//           </tr>
//           <tr>
//             {Object.keys(filteredData.Parameters).map(param => (
//               <th key={param} className="py-2 px-4 border border-gray-300 text-center" colSpan="3">{param}</th>
//             ))}
//           </tr>
//           <tr>
//             <th className="py-2 px-4 border border-gray-300 text-center"></th>
//             {Object.keys(filteredData.Parameters).map(() =>
//               (selectedQuarter ? getQuarterMonths(selectedQuarter) : Array.from({ length: 12 }, (_, i) => i + 1)).map(month => (
//                 <th key={month} className="py-2 px-4 border border-gray-300 text-center">{getMonthName(month)}</th>
//               ))
//             )}
//           </tr>
//         </thead>
//         <tbody>
//           {generateTableData.map(({ station, parameters }) => (
//             <React.Fragment key={station}>
//               <tr>
//                 <td className="py-2 px-4 border border-gray-300 text-center" rowSpan={parameters.length + 1}>{station}</td>
//               </tr>
//               {parameters.map(({ param, monthlyAverages }) => (
//                 <tr key={param}>
//                   <td className="py-2 px-4 border border-gray-300 text-center">{param}</td>
//                   {(selectedQuarter ? getQuarterMonths(selectedQuarter) : Array.from({ length: 12 }, (_, i) => i + 1)).map(month => (
//                     <td key={month} className="py-2 px-4 border border-gray-300 text-center">
//                       {monthlyAverages[month] ? (monthlyAverages[month].reduce((a, b) => a + b, 0) / monthlyAverages[month].length).toFixed(2) : '-'}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </React.Fragment>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default ReportTable;
