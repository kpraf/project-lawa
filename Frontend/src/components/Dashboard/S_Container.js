import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gradingSystems } from './paramgrade';
import ParamCharts from './ParamCharts';
import HoverModal from '../hoverModal';

// Laguna de Bay environmental guidelines for each parameter
const PARAM_GUIDELINES = {
  'Dissolved Oxygen': { type: 'min', value: 5 }, // mg/L, minimum
  'pH': { type: 'range', min: 6.5, max: 8.5 },   // acceptable range
  'Temperature': { type: 'max', value: 32 },     // Â°C, maximum
  'ORP': { type: 'min', value: 200 },            // mV, minimum
  'Turbidity': { type: 'max', value: 25 },       // NTU, maximum
  'TDS': { type: 'max', value: 1000 },           // mg/L, maximum
  'Total Dissolved Solids': { type: 'max', value: 1000 }, // mg/L, maximum (alias)
  'Ammonia': { type: 'max', value: 0.5 },        // mg/L, maximum
  'Nitrate': { type: 'max', value: 10 },         // mg/L, maximum
  'Inorganic Phosphate': { type: 'max', value: 0.5 }, // mg/L, maximum
  'BOD': { type: 'max', value: 7 },              // mg/L, maximum
  'Fecal Coliform': { type: 'max', value: 400 }, // MPN/100mL, maximum
};

// Helper to check if a value exceeds the guideline
function isExceedance(param, value) {
  const g = PARAM_GUIDELINES[param];
  if (!g || value == null || value === '' || value === undefined) return false;
  if (g.type === 'max') return value > g.value;
  if (g.type === 'min') return value < g.value;
  if (g.type === 'range') return value < g.min || value > g.max;
  return false;
}

const parameterRanges = {
  Temperature: {
    AA: ["Â°C", "26 - 30"],
    A: ["Â°C", "26 - 30"],
    B: ["Â°C", "26 - 30"],
    C: ["Â°C", "25 - 31"],
    D: ["Â°C", "25 - 32"]
  },
  pH: {
    AA: ["", "6.5 - 8.5"],
    A: ["", "6.5 - 8.5"],
    B: ["", "6.5 - 8.5"],
    C: ["", "6.5 - 9.0"],
    D: ["", "6.0 - 9.0"]
  },
  'Dissolved Oxygen': {
    AA: ["mg/L", "â‰¥5"],
    A: ["mg/L", "â‰¥5"],
    B: ["mg/L", "â‰¥5"],
    C: ["mg/L", "â‰¥5"],
    D: ["mg/L", "2 - 4"]
  },
  'Total Dissolved Solids': {
    AA: ["ppm", "<500"],
    A: ["ppm", "<500"],
    B: ["ppm", "<500"],
    C: ["ppm", "500 - 1000"],
    D: ["ppm", "1000 - 1500"]
  },
  Turbidity: {
    AA: ["NTU", "<5"],
    A: ["NTU", "<5"],
    B: ["NTU", "<5"],
    C: ["NTU", "5 - 10"],
    D: ["NTU", "10 - 15"]
  },
  'Oxidation-Reduction Potential': {
    AA: ["mV", ">300"],
    A: ["mV", ">300"],
    B: ["mV", ">250"],
    C: ["mV", "200 - 250"],
    D: ["mV", "150 - 200"]
  },
  BOD: {
    AA: ["mg/L", "â‰¤1"],
    A: ["mg/L", "â‰¤3"],
    B: ["mg/L", "â‰¤5"],
    C: ["mg/L", "â‰¤7"],
    D: ["mg/L", ">7"]
  },
  'Fecal Coliform': {
    AA: ["CFU/100mL", "<1.1"],
    A: ["CFU/100mL", "â‰¤100"],
    B: ["CFU/100mL", "â‰¤200"],
    C: ["CFU/100mL", "â‰¤400"],
    D: ["CFU/100mL", ">400"]
  },
  'Inorganic Phosphate': {
    AA: ["mg/L", "<0.003"],
    A: ["mg/L", "â‰¤0.05"],
    B: ["mg/L", "â‰¤0.1"],
    C: ["mg/L", "â‰¤0.5"],
    D: ["mg/L", ">0.5"]
  },
  Nitrate: {
    AA: ["mg/L", "â‰¤1"],
    A: ["mg/L", "â‰¤3"],
    B: ["mg/L", "â‰¤6"],
    C: ["mg/L", "â‰¤10"],
    D: ["mg/L", ">10"]
  },
  Ammonia: {
    AA: ["mg/L", "â‰¤0.02"],
    A: ["mg/L", "â‰¤0.05"],
    B: ["mg/L", "â‰¤0.1"],
    C: ["mg/L", "â‰¤0.5"],
    D: ["mg/L", ">0.5"]
  }
};

const parameterDescriptions = {
  pH: 'pH measures the acidity or alkalinity of water. Extreme pH levels can be harmful to aquatic life.',
  'Dissolved Oxygen': 'Dissolved Oxygen is essential for aquatic life. Low levels can lead to fish kills.',
  Temperature: 'Water Temperature affects the metabolic rates of aquatic organisms and the solubility of oxygen.',
  ORP: "Oxidation-Reduction Potential (ORP) measures the water's ability to oxidize pollutants; higher values indicate better water quality.",
  Turbidity: 'Indicates water cloudiness caused by particles; high levels can harm aquatic ecosystems.',
  'Total Dissolved Solids': 'Represents dissolved substances in water; high levels affect taste, quality, and usability.',
  BOD: 'Biochemical Oxygen Demand measures the amount of oxygen needed by bacteria to decompose organic matter.',
  'Fecal Coliform': 'Bacteria indicator of sewage contamination; high levels indicate potential health risks.',
  'Inorganic Phosphate': 'Phosphate levels indicate nutrient pollution; high levels can cause algae blooms.',
  Nitrate: 'Nitrate is a nutrient that can cause eutrophication when present in high concentrations.',
  Ammonia: 'Ammonia is toxic to fish and indicates organic pollution or sewage contamination.',
};

// ADD THIS: parameterUnits definition
const parameterUnits = {
  BOD: 'mg/L',
  'Fecal Coliform': 'CFU/100mL',
  pH: '',
  'Inorganic Phosphate': 'mg/L',
  'Dissolved Oxygen': 'mg/L',
  Nitrate: 'mg/L',
  Temperature: 'Â°C',
  Ammonia: 'mg/L',
  Turbidity: 'NTU',
  'Total Dissolved Solids': 'mg/L',
  ORP: 'mV',
};

const classColors = {
  AA: 'bg-red-500',              // Red - All non-C classes are red
  A: 'bg-red-500',               // Red - All non-C classes are red
  B: 'bg-red-500',               // Red - All non-C classes are red
  C: 'bg-green-500',             // Green - OPTIMAL for Laguna de Bay
  D: 'bg-red-500',               // Red - All non-C classes are red
  Failed: 'bg-red-500'           // Red - All non-C classes are red
};

// Parameter categories for better organization
const parameterCategories = {
  physicochemical: {
    label: 'Physicochemical Parameters',
    description: 'These measure the basic physical and chemical properties of water, like how acidic it is, how much oxygen is dissolved in it, and how clear or cloudy it appears.',
    parameters: ['pH', 'Dissolved Oxygen', 'Temperature', 'ORP', 'Turbidity', 'Total Dissolved Solids'],
    color: 'blue'
  },
  biological: {
    label: 'Biological & Chemical Parameters', 
    description: 'These measure pollution levels and nutrients in water that come from living organisms, waste, or chemicals that can affect water quality and aquatic life.',
    parameters: ['BOD', 'Fecal Coliform', 'Ammonia', 'Nitrate', 'Inorganic Phosphate'],
    color: 'green'
  }
};

// Helper to get latest time from waterData.Parameters
export function getLatestParameterTime(waterData) {
  if (!waterData || !waterData.Parameters) return null;
  let latestTime = null;
  Object.values(waterData.Parameters).forEach(paramData => {
    if (paramData && paramData.time) {
      const t = new Date(paramData.time);
      if (!latestTime || t > latestTime) latestTime = t;
    }
  });
  return latestTime;
}

const SquaresContainer = ({ selectedMarker, selectedStation, className, waterData: propWaterData, paramsToShow, restParams = [], compact = false, zoom = 0.89 }) => {
  // State for fetched water data if not provided as prop
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch water data if not provided as prop
  const fetchWaterData = useCallback(async () => {
    if (selectedMarker) {
      setLoading(true);
      try {
        const response = await fetch(`process.env.REACT_APP_API_URL/sensors/recent-data/${selectedMarker.station}`);
        const data = await response.json();
        setWaterData(data);
      } catch (error) {
        console.error('Error fetching water data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedMarker]);

  useEffect(() => {
    if (propWaterData) {
      setWaterData(propWaterData);
    } else {
      fetchWaterData();
    }
    // eslint-disable-next-line
  }, [propWaterData, fetchWaterData]);

  // Use memoized water data for rendering
  const memoizedWaterData = useMemo(() => propWaterData || waterData, [propWaterData, waterData]);

  const getGrade = (param, value) => {
    const gradingSystem = gradingSystems[param];
    if (!gradingSystem) return { grade: 'Unknown', color: '' };
    
    const result = gradingSystem(value);
    // Normalize grade to match classColors keys (remove "Class " prefix)
    const normalizedGrade = result.grade.replace('Class ', '');
    return { grade: normalizedGrade, color: result.color };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const pad = n => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Get all possible parameters (union of parameterUnits and parameterDescriptions)
  const allParams = paramsToShow && Array.isArray(paramsToShow)
    ? [...paramsToShow, ...(restParams || [])]
    : Array.from(
        new Set([
          ...Object.keys(parameterUnits),
          ...Object.keys(parameterDescriptions),
          ...(memoizedWaterData?.Parameters ? Object.keys(memoizedWaterData.Parameters) : [])
        ])
      );

  // Categorize parameters
  const categorizedParams = {
    physicochemical: [],
    biological: []
  };

  allParams.forEach(param => {
    if (parameterCategories.physicochemical.parameters.includes(param)) {
      categorizedParams.physicochemical.push(param);
    } else if (parameterCategories.biological.parameters.includes(param)) {
      categorizedParams.biological.push(param);
    } else {
      // Default to physicochemical for unknown parameters
      categorizedParams.physicochemical.push(param);
    }
  });

  // Sort parameters within each category: those with data first, then alphabetically
  const sortParamsInCategory = (params) => {
    return params.sort((a, b) => {
      const aHasData = memoizedWaterData?.Parameters?.[a] && 
                      memoizedWaterData.Parameters[a].value !== undefined && 
                      memoizedWaterData.Parameters[a].value !== null;
      const bHasData = memoizedWaterData?.Parameters?.[b] && 
                      memoizedWaterData.Parameters[b].value !== undefined && 
                      memoizedWaterData.Parameters[b].value !== null;
      if (aHasData === bHasData) return a.localeCompare(b);
      return aHasData ? -1 : 1;
    });
  };

  categorizedParams.physicochemical = sortParamsInCategory(categorizedParams.physicochemical);
  categorizedParams.biological = sortParamsInCategory(categorizedParams.biological);

  // Render parameter category
  const renderParameterCategory = (categoryKey, categoryData, params) => {
    if (params.length === 0) return null;

    const categoryColor = categoryData.color === 'blue' 
      ? 'from-blue-50 to-blue-100 border-blue-200' 
      : 'from-green-50 to-green-100 border-green-200';
    
    const textColor = categoryData.color === 'blue' ? 'text-blue-800' : 'text-green-800';

    return (
      <div key={categoryKey} className={`w-full ${compact ? 'mb-1' : 'mb-4 sm:mb-6'}`}>
        {/* Category Header */}
        <div className={`w-full ${compact ? 'p-1' : 'p-3 sm:p-4'} rounded-t-lg border bg-gradient-to-r ${categoryColor} ${textColor} relative z-30`}>
          <HoverModal text={
            <div className="text-sm text-gray-700 text-center max-w-sm">
              {categoryData.description}
            </div>
          }>
            <div className="flex items-center justify-center gap-2 cursor-help">
              <h3 className={`${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg'} font-bold text-center tracking-wide`}>
                {categoryData.label}
              </h3>
              <div className={`flex items-center justify-center rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition-all duration-200 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`}>
                <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} fill-current opacity-70 hover:opacity-100 transition-opacity duration-200`} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </HoverModal>
        </div>
        
        {/* Parameters Grid */}
        <div className={`bg-white bg-opacity-50 rounded-b-lg border-l border-r border-b border-gray-200`} style={{ height: compact ? '305px' : '340px', padding: compact ? '4px 8px' : '8px 12px' }}>
          <div
            className={`grid w-full h-full auto-rows-fr
              ${compact
                ? 'gap-1 sm:gap-2 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
                : 'gap-2 sm:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}
            `}>
            {params.map((param, index) => renderParameterCard(param, index, categoryData.color))}
          </div>
        </div>
      </div>
    );
  };

  // Render individual parameter card
  const renderParameterCard = (param, index, categoryColor) => {
    if (!memoizedWaterData?.Parameters) return null;
    
    const paramData = memoizedWaterData.Parameters[param];
    const value = paramData?.value;
    const unit = parameterUnits[param] ? ` (${parameterUnits[param]})` : '';
    const { grade } = getGrade(param, value);
    const paramDate = paramData && paramData.time ? formatDate(paramData.time) : null;
    const paramKeyForRange = param === "ORP" ? "Oxidation-Reduction Potential" : param;

    // Function to get grouped class display for parameters with same ranges
    const getGroupedClassDisplay = (currentGrade, paramKey) => {
      const ranges = parameterRanges[paramKey];
      if (!ranges || !currentGrade) return currentGrade;

      // Find which range value the current grade corresponds to
      const currentRangeValue = ranges[currentGrade]?.[1];
      if (!currentRangeValue) return currentGrade;

      // Find all classes that share the same range value
      const classesWithSameRange = [];
      Object.entries(ranges).forEach(([classKey, [unit, rangeVal]]) => {
        if (rangeVal === currentRangeValue) {
          classesWithSameRange.push(classKey);
        }
      });

      // If multiple classes share the same range, show them as a group
      if (classesWithSameRange.length > 1) {
        // Sort classes in quality order: AA, A, B, C, D
        const classOrder = ['AA', 'A', 'B', 'C', 'D'];
        classesWithSameRange.sort((a, b) => classOrder.indexOf(a) - classOrder.indexOf(b));
        
        // Return range format (e.g., "AA-C" for consecutive classes)
        if (classesWithSameRange.length > 2) {
          return `${classesWithSameRange[0]}-${classesWithSameRange[classesWithSameRange.length - 1]}`;
        } else {
          return classesWithSameRange.join('/');
        }
      }

      return currentGrade;
    };

    const displayGrade = getGroupedClassDisplay(grade, paramKeyForRange);

    // Check if this parameter is dangerous
    const isDangerous = value !== undefined && value !== null && isExceedance(param, value);
    
    // Show class ranges on hover - ensure all parameters have tooltips
    let hoverContent = null;
    if (parameterRanges[paramKeyForRange]) {
      const description = parameterDescriptions[paramKeyForRange] || parameterDescriptions[param] || '';
      hoverContent = (
        <div>
          <table className="w-full text-xs border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="px-3 py-2 font-bold rounded-tl-lg bg-gray-100 text-gray-800">Class</th>
                <th className="px-3 py-2 font-bold rounded-tr-lg bg-gray-100 text-gray-800">Range</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parameterRanges[paramKeyForRange]).map(([classKey, [unitVal, rangeVal]], idx, arr) => {
                const isCurrentClass = grade === classKey;
                
                // Function to determine cell color based on color grouping scheme (same as main table in GradeDescription.js)
                const getCellColor = (classKey, value) => {
                  const ranges = parameterRanges[paramKeyForRange];
                  const allValues = [ranges.AA?.[1], ranges.A?.[1], ranges.B?.[1], ranges.C?.[1], ranges.D?.[1]];
                  
                  // Count how many classes have the same value as current class
                  const sameValueCount = allValues.filter(v => v === value).length;
                  
                  // If multiple classes share the same value, use color based on whether C is included
                  if (sameValueCount > 1) {
                    // Determine which classes share this value
                    const classesWithValue = [];
                    if (ranges.AA?.[1] === value) classesWithValue.push('AA');
                    if (ranges.A?.[1] === value) classesWithValue.push('A');
                    if (ranges.B?.[1] === value) classesWithValue.push('B');
                    if (ranges.C?.[1] === value) classesWithValue.push('C');
                    if (ranges.D?.[1] === value) classesWithValue.push('D');
                    
                    // If Class C shares this value, use Class C color for all
                    if (classesWithValue.includes('C')) {
                      return 'bg-green-500 text-white'; // Green for C and any classes sharing C's value
                    } else {
                      return 'bg-red-500 text-white'; // Red for all non-C classes
                    }
                  }
                  
                  // Use distinct colors: only C is green, everything else is red
                  switch (classKey) {
                    case 'C': return 'bg-green-500 font-bold text-white'; // Green - Optimal (Laguna de Bay target)
                    default: return 'bg-red-500 text-white'; // Red - All other classes
                  }
                };
                
                const baseColorClass = getCellColor(classKey, rangeVal);
                const highlightClass = isCurrentClass ? 'ring-2 ring-blue-500 ring-inset font-bold' : '';
                const isOptimal = classKey === 'C'; // Class C is optimal for Laguna de Bay
                
                return (
                  <tr key={classKey} className={highlightClass}>
                    <td className={`px-3 py-2 text-center font-semibold text-gray-800 ${baseColorClass} ${idx === arr.length-1 ? '' : ''} ${highlightClass}`}>
                      {classKey}
                    </td>
                    <td className={`px-3 py-2 text-center text-gray-800 ${baseColorClass} ${idx === arr.length-1 ? '' : ''} ${highlightClass}`}>
                      {rangeVal} {unitVal}
                    </td>
                  </tr>
                );
              })}
              {/* Add Failed classification row */}
              <tr className={grade === 'Failed' ? 'ring-2 ring-blue-500 ring-inset font-bold' : ''}>
                <td className={`px-3 py-2 text-center font-semibold rounded-bl-lg bg-black text-white ${grade === 'Failed' ? 'ring-2 ring-blue-500 ring-inset font-bold' : ''}`}>
                  Failed
                </td>
                <td className={`px-3 py-2 text-center rounded-br-lg bg-red-500 text-white ${grade === 'Failed' ? 'ring-2 ring-blue-500 ring-inset font-bold' : ''}`}>
                  Out of range
                </td>
              </tr>
            </tbody>
          </table>
          {description && (
            <div className="mt-3 text-xs text-gray-700 text-center px-3 py-2 bg-gray-50 rounded-lg">
              {description}
            </div>
          )}
          <div className="mt-2 text-xs text-green-700 text-center px-2 py-1 bg-green-50 rounded-lg font-medium">
            Class C is optimal for Laguna de Bay (LLDA guidelines)
          </div>
        </div>
      );
    } else {
      // Fallback tooltip for parameters without ranges
      const description = parameterDescriptions[param] || `${param} measurement for water quality assessment.`;
      hoverContent = (
        <div className="text-sm text-gray-700 text-center">
          {description}
        </div>
      );
    }

    const borderColor = categoryColor === 'blue' ? 'border-blue-300' : 'border-green-300';
    const hoverBorderColor = categoryColor === 'blue' ? 'hover:border-blue-400' : 'hover:border-green-400';

    return (
      <div
        key={`${param}-${index}`}
        className={`
          bg-white bg-opacity-90 backdrop-blur-sm shadow-md rounded-xl w-full flex flex-col items-center justify-between
          transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl hover:bg-opacity-100
          ${isDangerous ? 'border-2 border-red-500 bg-red-50 shadow-red-200' : `border-2 ${borderColor} ${hoverBorderColor}`}
          cursor-pointer ${paramData && value !== undefined && value !== null ? 'opacity-100' : 'opacity-75'}
          font-sans group relative overflow-visible
          p-1 xs:p-2 sm:p-3 md:p-4 lg:p-5 h-full min-w-[110px] xs:min-w-[120px] sm:min-w-[140px] md:min-w-[160px]'
        `}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          zIndex: 10,
          minHeight: compact ? '130px' : '180px',
          maxWidth: '100%',
        }}
      >
        <div className="w-full flex items-center justify-center flex-shrink-0 relative z-10">
          <ParamCharts parameterData={{ ...(paramData || {}), param }} parameterRanges={parameterRanges} compact={compact} hideClassIndicator={true} />
        </div>
        
        <div className="flex flex-col items-center justify-center w-full absolute bottom-0 left-0 right-0 px-2 pb-3 z-20" style={{ paddingBottom: compact ? '12px' : '16px' }}>
          {/* Class Grade Indicator - Only visible on hover */}
          {displayGrade && displayGrade !== 'Unknown' && (
            <div className={`${classColors[grade]} px-3 py-1 rounded-full mb-2 shadow-sm border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${grade === 'C' ? 'text-white font-bold' : 'text-gray-800'}`}>
              <span className={`${compact ? 'text-sm sm:text-base' : 'text-base sm:text-lg md:text-xl'} font-bold`}>
                {displayGrade}
              </span>
            </div>
          )}
          
          {/* Parameter Value - displayed above parameter name */}
          <div className={`${compact ? 'text-base sm:text-lg font-bold' : 'text-lg sm:text-xl md:text-2xl font-bold'} text-gray-800 text-center leading-tight mb-1`}>
            {value !== undefined && value !== null ? value : "No data"}
          </div>
          
          {/* Parameter name with tooltip */}
          <HoverModal text={hoverContent}>
            <p className={`${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base md:text-lg'} font-bold font-sans text-gray-800 cursor-help text-center leading-tight group-hover:text-gray-900 mt-1 relative hover:text-blue-600 transition-colors duration-200 z-30`}>
              {param}
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
            </p>
          </HoverModal>
          
          {/* Units */}
          <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-xs sm:text-sm'} font-medium font-sans text-center mt-1 group-hover:text-gray-700`}>
            {unit}
          </p>
          {/* Timestamp - only show if not compact or if compact and has data */}
          {(!compact || (compact && paramDate)) && (
            <>
              <p
                className={`font-sans text-center mt-1 leading-tight transition-all duration-300 ${compact ? 'truncate max-w-full text-xs' : 'text-base'} group-hover:scale-110 group-hover:shadow-lg text-black`}
                style={{ letterSpacing: '0.04em' }}
              >
                {paramDate ? paramDate : 'No data'}
              </p>
              {/* View in Analytics Link */}
              {selectedMarker ? (
                <Link
                  to={`/monitoring-data?station=${encodeURIComponent(selectedMarker.station || selectedStation || 'unknown')}&parameter=${encodeURIComponent(param)}&fromDashboard=true`}
                  className={`inline-flex items-center gap-1 mt-2 mb-2 px-3 py-2 text-xs bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 hover:text-blue-700 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50`}
                  style={{ fontSize: compact ? '0.65rem' : '0.75rem' }}
                  title={`View ${param} analytics for ${selectedMarker.station || selectedStation || 'station'}`}
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="whitespace-nowrap">View Analytics</span>
                </Link>
              ) : (
                <div className="text-xs text-gray-400 mt-2 mb-2">
                  Click a station on the map to view analytics
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${className} flex flex-col w-full h-full`} style={{ zoom }}>
      <div className="w-full">
        {/* Render Physicochemical Parameters */}
        {renderParameterCategory('physicochemical', parameterCategories.physicochemical, categorizedParams.physicochemical)}
        
        {/* Render Biological Parameters */}
        {renderParameterCategory('biological', parameterCategories.biological, categorizedParams.biological)}
      </div>
    </div>
  );
};

export default SquaresContainer;

