import { useState, useEffect } from 'react';
import { gradingSystems } from './paramgrade';
import { FaExclamationTriangle } from 'react-icons/fa';
import HoverModal from '../hoverModal';

// Laguna de Bay environmental guidelines for each parameter (example values, adjust as needed)
const PARAM_GUIDELINES = {
  'Dissolved Oxygen': { type: 'min', value: 5 }, // mg/L, minimum
  'pH': { type: 'range', min: 6.5, max: 8.5 },   // acceptable range
  'Temperature': { type: 'max', value: 32 },     // °C, maximum
  'ORP': { type: 'min', value: 200 },            // mV, minimum (example)
  'Turbidity': { type: 'max', value: 25 },       // NTU, maximum (example)
  'TDS': { type: 'max', value: 1000 },           // mg/L, maximum (example)
  'Ammonia': { type: 'max', value: 0.5 },        // mg/L, maximum
  'Nitrate': { type: 'max', value: 10 },         // mg/L, maximum
  'Nitrite': { type: 'max', value: 1 },          // mg/L, maximum (example)
  'Phosphate': { type: 'max', value: 0.5 },      // mg/L, maximum (example)
  'BOD': { type: 'max', value: 7 },              // mg/L, maximum
  'Fecal Coliform': { type: 'max', value: 400 }, // MPN/100mL, maximum
};

// CCME WQI color/grade mapping - matches gauge chart colors
const CCME_WQI_THRESHOLDS = [
  { min: 95, max: 100, grade: 'Excellent', color: 'bg-[#4CBB17]', hex: '#4CBB17' }, // Dark Green
  { min: 80, max: 94, grade: 'Good', color: 'bg-[#9ACD32]', hex: '#9ACD32' },       // Light Green
  { min: 65, max: 79, grade: 'Fair', color: 'bg-[#FDDA0D]', hex: '#FDDA0D' },       // Yellow
  { min: 45, max: 64, grade: 'Marginal', color: 'bg-[#FFA500]', hex: '#FFA500' },   // Orange
  { min: 0, max: 44, grade: 'Poor', color: 'bg-[#EA4228]', hex: '#EA4228' },        // Red
];

// Map CCME WQI to grade/color
export const getCCMEWQIGrade = (wqi) => {
  // Handle edge cases and ensure we always return a proper grade
  if (isNaN(wqi) || wqi === null || wqi === undefined) {
    wqi = 0; // Default to 0 if invalid
  }
  
  // Ensure WQI is within valid range
  wqi = Math.max(0, Math.min(100, wqi));
    for (const threshold of CCME_WQI_THRESHOLDS) {
    if (wqi >= threshold.min && wqi <= threshold.max) {
      // Ensure color is exactly as expected for mapping
      return { grade: threshold.grade, color: threshold.color.trim(), hex: threshold.hex };
    }
  }
  
  // Fallback: if somehow no threshold matches, return the most appropriate based on value
  if (wqi >= 95) return { grade: 'Excellent', color: 'bg-[#4CBB17]', hex: '#4CBB17' };
  if (wqi >= 80) return { grade: 'Good', color: 'bg-[#9ACD32]', hex: '#9ACD32' };
  if (wqi >= 65) return { grade: 'Fair', color: 'bg-[#FDDA0D]', hex: '#FDDA0D' };
  if (wqi >= 45) return { grade: 'Marginal', color: 'bg-[#FFA500]', hex: '#FFA500' };
  return { grade: 'Poor', color: 'bg-[#EA4228]', hex: '#EA4228' };
};

// Helper to get guideline for a parameter
function getGuideline(param) {
  return PARAM_GUIDELINES[param];
}

// Helper to check if a value exceeds the guideline
function isExceedance(param, value) {
  const g = getGuideline(param);
  if (!g || value == null || value === '' || value === undefined) return false;
  if (g.type === 'max') return value > g.value;
  if (g.type === 'min') return value < g.value;
  if (g.type === 'range') return value < g.min || value > g.max;
  return false;
}

// Helper to calculate excursion for a value
function getExcursion(param, value) {
  const g = getGuideline(param);
  if (!g || value == null || value === '' || value === undefined) return 0;
  if (g.type === 'max' && value > g.value) return (value / g.value) - 1;
  if (g.type === 'min' && value < g.value) return (g.value / value) - 1;
  if (g.type === 'range') {
    if (value < g.min) return (g.min / value) - 1;
    if (value > g.max) return (value / g.max) - 1;
    return 0;
  }
  return 0;
}

// CCME WQI calculation - only use parameters with valid data
const calculateCCMEWQI = (parameters) => {
  // Filter out parameters with no data before calculation (including 0s)
  const validParamEntries = Object.entries(parameters || {}).filter(([param, obj]) => {
    const value = obj?.value;
    return value !== null && value !== undefined && value !== 0 && !(typeof value === "string" && (value.trim() === "" || value.trim().toLowerCase() === "no data"));
  });
  
  const totalTests = validParamEntries.length;
  if (totalTests === 0) return 0;

  // F1: % of parameters that exceed at least once (here, only one value per param)
  const numParamsExceed = validParamEntries.filter(([param, obj]) => isExceedance(param, obj?.value)).length;
  const F1 = (numParamsExceed / totalTests) * 100;

  // F2: % of individual tests that exceed (same as F1 if one value per param)
  const numTestsExceed = numParamsExceed;
  const F2 = (numTestsExceed / totalTests) * 100;

  // F3: Amplitude (normalized sum of excursions)
  let excursions = 0;
  validParamEntries.forEach(([param, obj]) => {
    excursions += getExcursion(param, obj?.value);
  });
  const nse = excursions / totalTests;
  const F3 = (nse / (0.01 * nse + 0.01));

  // CCME WQI formula
  const ccmeWQI = 100 - Math.sqrt((F1 * F1 + F2 * F2 + F3 * F3) / 1.732);
  return Math.max(0, Math.min(100, ccmeWQI));
};

const getGrade = (param, value) => {
  const gradingSystem = gradingSystems[param];
  return gradingSystem ? gradingSystem(value) : { grade: 'Poor', color: 'bg-red-500 bg-opacity-75' };
};

// Add comprehensive danger explanations for tooltips
const dangerExplanations = {
  'Dissolved Oxygen': 'Low dissolved oxygen can cause fish kills, harm aquatic life, and indicate pollution or organic waste contamination.',
  'pH': 'Extreme pH levels can be harmful to aquatic organisms, affect chemical processes, and indicate industrial or agricultural pollution.',
  'Temperature': 'Abnormal water temperature can stress or kill aquatic life, affect oxygen levels, and indicate thermal pollution.',
  'ORP': 'Low Oxidation-Reduction Potential may indicate poor water quality, high pollution levels, and reduced water\'s ability to break down contaminants.',
  'Turbidity': 'High turbidity reduces light penetration, harms aquatic plants and animals, and may indicate sediment or pollution runoff.',
  'TDS': 'High Total Dissolved Solids affect water taste, usability, and can indicate pollution from industrial sources or agricultural runoff.',
  'Total Dissolved Solids': 'High Total Dissolved Solids affect water taste, usability, and can indicate pollution from industrial sources or agricultural runoff.',
  'Ammonia': 'High ammonia levels are toxic to fish and aquatic life, indicate organic pollution, and can lead to eutrophication.',
  'Nitrate': 'Elevated nitrate levels can cause harmful algal blooms, deplete oxygen, and pose health risks especially to infants.',
  'Nitrite': 'High nitrite is toxic to fish, indicates incomplete nitrification, and can lead to oxygen depletion in water bodies.',
  'Phosphate': 'Excessive phosphate promotes algal blooms, leads to eutrophication, and can cause oxygen depletion.',
  'BOD': 'High Biochemical Oxygen Demand indicates organic pollution and means less oxygen available for aquatic life.',
  'Fecal Coliform': 'High fecal coliform levels indicate sewage contamination and possible presence of disease-causing pathogens.',
  'E. coli': 'Presence of E. coli indicates fecal contamination and potential health risks from waterborne pathogens.',
  'Chlorophyll-a': 'High chlorophyll-a levels indicate excessive algae growth, potential eutrophication, and ecosystem imbalance.',
  'Conductivity': 'Abnormal conductivity levels may indicate pollution, salinity issues, or changes in water chemistry.',
  'Salinity': 'High salinity can harm freshwater organisms and indicate saltwater intrusion or industrial contamination.',
  'Hardness': 'Extreme water hardness can affect aquatic life and indicate mineral pollution or geological changes.',
  'Alkalinity': 'Abnormal alkalinity affects pH stability and can indicate pollution or changes in water chemistry.',
};

// Short descriptions for each CCME WQI grade
const ccmeGradeDescriptions = {
  'Excellent': 'Water quality is protected with a virtual absence of threat or impairment; conditions are very close to natural or pristine levels.',
  'Good': 'Water quality is protected with only a minor degree of threat or impairment; conditions rarely depart from natural or desirable levels.',
  'Fair': 'Water quality is usually protected but occasionally threatened or impaired; conditions sometimes depart from natural or desirable levels.',
  'Marginal': 'Water quality is frequently threatened or impaired; conditions often depart from natural or desirable levels.',
  'Poor': 'Water quality is almost always threatened or impaired; conditions usually depart from natural or desirable levels.'
};

// Class descriptions for water quality grades
const classDescriptions = {
  'Class AA': 'Public Water Supply Class I - Intended primary for waters having watersheds, which are uninhabited and/or otherwise declared as protected areas, and which require only approved disinfection to meet the latest Philippine National Standards for Drinking Water (PNSDW)',
  'Class A': 'Public Water Supply Class II - Intended as sources of water supply requiring conventional treatment (coagulation, sedimentation, filtration and disinfection) to meet the latest Philippine National Standards for Drinking Water (PNSDW)',
  'Class B': 'Recreational Water Class I - Intended for primary contact recreation (bathing, swimming, etc.)',
  'Class C': 'OPTIMAL FOR LAGUNA DE BAY\n\n1. Fishery Water for the propagation and growth of fish and other aquatic resources\n2. Recreational Water Class II - For boating, fishing, or similar activities\n3. For agriculture, irrigation, and livestock watering\n\nNote: According to LLDA guidelines, Class C is the target classification for Laguna de Bay water quality parameters.',
  'Class D': 'Navigable waters'
};

const SAFE_CLASSES = ['Class AA', 'Class A', 'Class B', 'AA', 'A', 'B'];

// OWQAdmin component
const OWQAdmin = ({
  waterData,
  className,
  description,
  selectedStation,
  lastUpdated: lastUpdatedProp
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (waterData && waterData.Parameters) {
      setLoading(false);
    }
  }, [waterData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full m-auto w-[40%]">
        <center>
          <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
          <span className="ml-2">Loading...</span>
        </center>
      </div>
    );
  }

  if (!waterData || !waterData.Parameters) {
    return <div>Fetching data...</div>;
  }  // Only consider parameters that have data (excluding 0s)
  const measuredParams = Object.keys(waterData.Parameters).filter(param => {
    const value = waterData.Parameters[param]?.value;
    return value !== null && value !== undefined && value !== 0 && !(typeof value === "string" && (value.trim() === "" || value.trim().toLowerCase() === "no data"));
  });  // Find missing parameters - check both expected guidelines and actual data parameters (including 0s)
  const allPossibleParams = new Set([...Object.keys(PARAM_GUIDELINES), ...Object.keys(waterData.Parameters)]);
  const missingParameters = Array.from(allPossibleParams).filter(param => {
    const value = waterData.Parameters[param]?.value;
    return (
      value === null ||
      value === undefined ||
      value === 0 ||
      (typeof value === "string" && (value.trim() === "" || value.trim().toLowerCase() === "no data"))
    );
  });  // Use CCME WQI calculation with available data
  const wqi = calculateCCMEWQI(waterData.Parameters);
  
  // Categorize parameters by their exceedance levels (for alerts only)
  const dangerousParameters = measuredParams.filter(param => {
    const value = waterData.Parameters[param]?.value;
    return isExceedance(param, value);
  });

  // Always use CCME WQI-based classification, regardless of parameter exceedances
  const result = getCCMEWQIGrade(wqi);
  const overallGrade = result.grade;
  const overallGradeColor = result.color;

  const warningParameters = []; // We'll use dangerous for all exceedances

  // All safe if we have measured params and no exceedances
  const allSafe = measuredParams.length > 0 && dangerousParameters.length === 0;

  // Find the latest timestamp from parameters, unless provided as a prop
  let lastUpdated = lastUpdatedProp;
  if (!lastUpdated && waterData && waterData.Parameters) {
    const timestamps = Object.values(waterData.Parameters)
      .map(param => param && param.timestamp)
      .filter(Boolean)
      .map(ts => new Date(ts));
    if (timestamps.length > 0) {
      lastUpdated = new Date(Math.max(...timestamps));
    }
  }

  // Helper to format date as YYYY-MM-DD HH:mm
  function formatLastUpdated(date) {
    if (!date) return '';
    const pad = n => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // If lastUpdated is a Date, show date part as well
  const lastUpdatedDate = lastUpdated instanceof Date ? lastUpdated : new Date(lastUpdated);

  return (
    <div className="relative flex flex-col sm:flex-row w-full h-full font-sans">
      {/* Class Indicator: top/left side */}
      <div className={`overall-water-quality flex-1 h-[60px] sm:h-[120px] rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none shadow-sm flex flex-col justify-center items-center ${overallGradeColor} text-white ${className}`}>
        <div className="text-center w-full">
          <span className="block text-xs sm:text-sm font-semibold font-sans">Station {selectedStation}:</span>
          {/* Show WQI grade and value with tooltip */}
          <HoverModal text={ccmeGradeDescriptions[overallGrade] || ''}>
            <span className="block text-sm sm:text-xl font-bold font-sans underline underline-offset-2 decoration-1 cursor-help">
              {overallGrade}
            </span>
          </HoverModal>
          <span className="block text-sm sm:text-lg font-bold font-sans mt-1">{wqi.toFixed(1)}</span>
          {lastUpdated && (
            <span className="hidden sm:block text-xs text-gray-200 mt-1 font-sans">
              As of {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
      </div>
      {/* Warning Square: bottom/right side */}
      <div
        className={`flex flex-col justify-center items-center flex-1 h-[60px] sm:h-[120px] rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none shadow-sm relative overflow-hidden
          ${
            dangerousParameters.length > 0
              ? 'bg-red-50 border border-red-400'
              : missingParameters.length > 0
                ? 'bg-yellow-50 border border-yellow-400'
                : allSafe
                  ? 'bg-green-50 border border-green-400'
                  : 'bg-gray-50 border border-gray-300'
          }
        `}
        style={{ minWidth: 0 }}
      >
        <div className="flex flex-col items-center w-full h-full px-1 sm:px-2 py-1 sm:py-2 overflow-auto">
          {dangerousParameters.length > 0 ? (
            <>
              <div className="flex flex-row items-center mb-1">
                <FaExclamationTriangle className="text-red-500 text-sm sm:text-lg mr-1" />
                <span className="font-bold font-sans text-red-700 text-xs sm:text-sm break-words">Danger!</span>
              </div>
              <span className="text-xs font-sans text-red-700 mb-1 text-center break-words">Parameters exceeding guidelines:</span>
              <ul className="list-disc list-inside text-xs font-sans text-red-700 w-full px-1 sm:px-2 max-h-[30px] sm:max-h-[40px] overflow-auto break-words">
                {dangerousParameters.map(param => {
                  const value = waterData.Parameters[param]?.value;
                  const guideline = PARAM_GUIDELINES[param];
                  const unit = waterData.Parameters[param]?.unit || '';
                  
                  // Create detailed tooltip text
                  let tooltipText = `${param}\n`;
                  tooltipText += `Current Value: ${value}${unit ? ' ' + unit : ''}\n`;
                  
                  if (guideline) {
                    if (guideline.type === 'max') {
                      tooltipText += `Safe Maximum: ${guideline.value}${unit ? ' ' + unit : ''}\n`;
                      tooltipText += `Excess: ${((value / guideline.value - 1) * 100).toFixed(1)}% above limit`;
                    } else if (guideline.type === 'min') {
                      tooltipText += `Safe Minimum: ${guideline.value}${unit ? ' ' + unit : ''}\n`;
                      tooltipText += `Deficit: ${((guideline.value / value - 1) * 100).toFixed(1)}% below limit`;
                    } else if (guideline.type === 'range') {
                      tooltipText += `Safe Range: ${guideline.min} - ${guideline.max}${unit ? ' ' + unit : ''}\n`;
                      if (value < guideline.min) {
                        tooltipText += `Below range by: ${(guideline.min - value).toFixed(2)}${unit ? ' ' + unit : ''}`;
                      } else {
                        tooltipText += `Above range by: ${(value - guideline.max).toFixed(2)}${unit ? ' ' + unit : ''}`;
                      }
                    }
                  }
                  
                  // Add health/environmental impact
                  if (dangerExplanations[param]) {
                    tooltipText += `\n\nHealth Impact: ${dangerExplanations[param]}`;
                  }
                  
                  return (
                    <li key={param} className="break-words">
                      <HoverModal text={tooltipText}>
                        <span className="underline decoration-dotted cursor-help break-words">{param}</span>
                      </HoverModal>
                    </li>
                  );
                })}
              </ul>
              {missingParameters.length > 0 && (
                <>
                  <span className="text-xs font-sans text-red-600 mt-1 text-center break-words">Missing: {missingParameters.length} param{missingParameters.length > 1 ? 's' : ''}</span>
                </>
              )}
            </>
          ) : missingParameters.length > 0 ? (
            <>
              <div className="flex flex-row items-center mb-1">
                <FaExclamationTriangle className="text-yellow-500 text-sm sm:text-lg mr-1" />
                <span className="font-bold font-sans text-yellow-700 text-xs sm:text-sm break-words">Incomplete Data</span>
              </div>
              <span className="text-xs font-sans text-yellow-700 mb-1 text-center break-words">Missing data for {missingParameters.length} parameter{missingParameters.length > 1 ? 's' : ''}:</span>
              <ul className="list-disc list-inside text-xs font-sans text-yellow-700 w-full px-1 sm:px-2 max-h-[30px] sm:max-h-[50px] overflow-auto break-words">
                {missingParameters.map(param => {
                  const guideline = PARAM_GUIDELINES[param];
                  let tooltipText = `${param} - No Data Available\n`;
                  
                  if (guideline) {
                    if (guideline.type === 'max') {
                      tooltipText += `Expected Maximum: ${guideline.value}\n`;
                    } else if (guideline.type === 'min') {
                      tooltipText += `Expected Minimum: ${guideline.value}\n`;
                    } else if (guideline.type === 'range') {
                      tooltipText += `Expected Range: ${guideline.min} - ${guideline.max}\n`;
                    }
                  }
                  
                  // Add importance explanation
                  if (dangerExplanations[param]) {
                    tooltipText += `\nImportance: ${dangerExplanations[param]}`;
                  } else {
                    tooltipText += `\nThis parameter is important for comprehensive water quality assessment.`;
                  }
                  
                  tooltipText += `\n\nRecommendation: Regular monitoring of this parameter is essential for accurate water quality evaluation.`;
                  
                  return (
                    <li key={param} className="break-words text-xs">
                      <HoverModal text={tooltipText}>
                        <span className="underline decoration-dotted cursor-help break-words">{param}</span>
                      </HoverModal>
                    </li>
                  );
                })}
              </ul>
              <span className="text-xs font-sans text-yellow-600 mt-1 text-center break-words">
                Classification based on {measuredParams.length} available parameters
              </span>
            </>
          ) : allSafe ? (
            <div className="flex flex-col items-center w-full">
              <HoverModal text={`All ${measuredParams.length} measured parameters are within acceptable limits according to environmental guidelines.\n\nMeasured Parameters: ${measuredParams.join(', ')}\n\nThis indicates good water quality conditions for the monitored aspects.`}>
                <span className="font-bold font-sans text-green-700 text-xs sm:text-sm break-words cursor-help underline decoration-dotted">All Safe</span>
              </HoverModal>
              <span className="text-xs font-sans text-green-700 text-center break-words">All measured parameters are within safe levels.</span>
              <span className="text-xs font-sans text-green-600 mt-1 text-center break-words">
                Based on {measuredParams.length} parameters
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <span className="font-bold font-sans text-gray-700 text-xs sm:text-sm break-words">No Data</span>
              <span className="text-xs font-sans text-gray-700 text-center break-words">No parameter data available for analysis.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { calculateCCMEWQI as calculateWQI };
export default OWQAdmin;
