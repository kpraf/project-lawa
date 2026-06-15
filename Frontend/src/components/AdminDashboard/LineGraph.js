// import React from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { FaInfoCircle } from 'react-icons/fa';
// import { Tooltip as ReactTooltip } from 'react-tooltip';

// const LineGraph = ({ allData, selectedParam }) => {
//   if (!allData || !allData.Parameters[selectedParam]) {
//     return <p>No data available for this parameter.</p>;
//   }

//   const data = allData.Parameters[selectedParam]
//     .sort((a, b) => new Date(a.time) - new Date(b.time))
//     .map(entry => ({
//       time: new Date(entry.time).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
//       value: entry.value
//     }));

//   const n = data.length;
//   const sumX = data.reduce((sum, _, index) => sum + index, 0);
//   const sumY = data.reduce((sum, entry) => sum + entry.value, 0);
//   const sumXY = data.reduce((sum, entry, index) => sum + index * entry.value, 0);
//   const sumX2 = data.reduce((sum, _, index) => sum + index * index, 0);

//   const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
//   const intercept = (sumY - slope * sumX) / n;

//   const trendData = data.map((entry, index) => ({
//     ...entry,
//     trend: intercept + slope * index
//   }));

//   const parameterDescriptions = {
//     pH: 'Shows acidity or basicity of water.',
//     Temperature: 'Indicates how warm the water is.',
//     'Dissolved Oxygen': 'Amount of oxygen available in water.',
//     Turbidity: 'Measures clarity of water.',
//     Conductivity: 'Indicates water\'s ability to conduct electricity.',
//     'Fecal Coliform': 'Indicates contamination by fecal matter.',
//     'Inorganic Phosphate': 'Levels indicate nutrient pollution.',
//     Nitrate: 'Indicates nutrient pollution.',
//     Ammonia: 'Toxic to aquatic life at high levels.',
//     BOD: 'Biochemical Oxygen Demand indicates organic matter in water.'
//   };

//   const parameterDescription = parameterDescriptions[selectedParam] || 'No description available.';

//   return (
//     <div className="mt-5 bg-white p-5 rounded-sm shadow-md w-full">
//       <h3 className="text-lg font-poppins mb-4 text-left">
//         {selectedParam}
//         <span data-tip={parameterDescription} className="inline-block ml-2 cursor-pointer text-blue-500">
//           <FaInfoCircle />
//         </span>
//         <ReactTooltip place="top" effect="solid" />
//       </h3>
//       <ResponsiveContainer width="100%" height={400}>
//         <LineChart data={trendData}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="time" />
//           <YAxis />
//           <Tooltip />
//           <Legend />
//           <Line type="monotone" dataKey="value" stroke="#e9242a" dot={false} activeDot={{ r: 8 }} />
//           <Line type="monotone" dataKey="trend" stroke="#172851" dot={false} />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default LineGraph;