import React, { useEffect, useRef } from 'react';
import GaugeChart from 'react-gauge-chart';
import { gradingSystems } from './paramgrade';
import { parameterRanges } from './GradeDescription';

// Enhanced gauge styling
const gaugeStyles = `
  .gauge-container {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    overflow: hidden;
  }
  
  .gauge-container:hover {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
    transform: scale(1.02);
    transition: all 0.2s ease-in-out;
  }
  
  .gauge-container svg {
    overflow: visible;
    max-width: 100%;
    max-height: 100%;
  }
  
  .gauge-container .recharts-surface {
    overflow: visible;
    max-width: 100%;
    max-height: 100%;
  }
  
  .gauge-container > div {
    overflow: hidden;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('gauge-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'gauge-styles';
  styleElement.textContent = gaugeStyles;
  document.head.appendChild(styleElement);
}

const ParamCharts = ({ parameterData, parameterRanges: propParameterRanges, compact = false, hideClassIndicator = false }) => {
  const hasRendered = useRef(false);

  useEffect(() => {
    hasRendered.current = true;
  }, []);

  if (!parameterData) {
    return <p>No data available for this parameter.</p>;
  }

  const latestValue = parameterData.value;
  const param = parameterData.param;
  const gradingSystem = gradingSystems[param];
  // Check for incomplete/missing data more thoroughly
  const hasValidData = latestValue !== undefined && 
                      latestValue !== null && 
                      latestValue !== '' && 
                      !isNaN(latestValue) &&
                      !(typeof latestValue === 'string' && latestValue.toLowerCase().includes('no data'));

  if (!gradingSystem || !hasValidData) {
    const size = compact ? 'w-32 h-56 sm:w-36 sm:h-60' : 'w-44 h-64 sm:w-48 sm:h-72 md:w-52 md:h-80';
    
    return (
      <div className={`gauge-container relative ${size} flex items-center justify-center flex-shrink-0 pt-14 pb-10 pl-4`}>
        <div className="w-full h-full flex items-center justify-center" style={{ height: '120%', marginTop: '-10%' }}>
          <GaugeChart
            id={`gauge-chart-${param}-no-data`}
            cornerRadius={0}
            arcsLength={[0.15, 0.2, 0.3, 0.2, 0.15]}
            arcPadding={0}
            colors={["#000000", "#e5e7eb", "#e5e7eb", "#e5e7eb", "#000000"]}
            percent={0}
            needleColor="#9ca3af"
            needleBaseColor="#6b7280"
            hideText={true}
            animate={false}
            arcWidth={0.4}
            width={undefined}
            height={undefined}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              width: '100%',
              height: '100%',
              clipPath: 'inset(0 0 20% 0)'
            }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-15%' }}>
          <div className="text-xs text-gray-400 font-medium pb-4">No Data</div>
        </div>
      </div>
    );
  }

  const { grade } = gradingSystem(latestValue);

  // Get parameter ranges for accurate needle positioning
  const getGaugeValue = (value, param) => {
    // Use the actual grade from grading system instead of hardcoded ranges
    // This ensures consistency with the grading logic
    
    console.log(`Parameter: ${param}, Value: ${value}, Grade: ${grade}`); // Debug log
    
    // Position based on actual grade classification
    // Gauge structure: [Black-Failed, Red-D(Poor), Green-C(Optimal), Red-AA/A/B(Good but not optimal), Black-Failed]
    // Note: AA/A/B are good quality but Class C is optimal for LLDA standards in Laguna de Bay
    // Class D is poor quality water, while Failed means outside all standards
    if (!grade) {
      return 0.05; // No grade - Black extreme
    }
    
    const gradeStr = grade.toString().toLowerCase();
    
    if (gradeStr.includes('failed')) {
      return 0.05; // Failed - Black extreme (outside all standards)
    } else if (gradeStr.includes('class c')) {
      return 0.5; // Class C - Green center (optimal for LLDA/Laguna de Bay)
    } else if (gradeStr.includes('class d')) {
      return 0.25; // Class D - Left red (poor quality water)
    } else if (gradeStr.includes('class b') || gradeStr.includes('class a')) {
      return 0.75; // Class B/A/AA - Right red (good quality but not optimal for LLDA standards)
    } else {
      console.log(`Unknown grade format: ${grade}, defaulting to failed position`); // Debug log
      return 0.05; // Default - Black extreme (failed)
    }
  };

  const gaugeValue = getGaugeValue(latestValue, param);

  // Color scheme: Only Class C is green (optimal for LLDA), with clear distinction between quality levels
  // AA/A/B are good quality but shown in red as they're not optimal for LLDA standards
  // Class D is poor quality, Failed is outside all standards (both in black/red)
  const getParameterColors = (parameter) => {
    return [
      "#000000",    // Black - Failed (outside all water quality standards)
      "#dc2626",    // Red - Class D (poor quality water)
      "#16a34a",    // Green - Class C (optimal for LLDA/Laguna de Bay standards)
      "#dc2626",    // Red - AA/A/B (good quality but not optimal for LLDA context)
      "#000000"     // Black - Failed (outside all water quality standards)
    ];
  };

  const parameterColors = getParameterColors(param);
  const size = compact ? 'w-32 h-56 sm:w-36 sm:h-60' : 'w-44 h-64 sm:w-48 sm:h-72 md:w-52 md:h-80';
  
  return (
    <div className={`gauge-container relative ${size} flex items-center justify-center flex-shrink-0 pt-14 pb-8 pl-4`}>
      <div className="w-full h-full flex items-center justify-center" style={{ height: '120%', marginTop: '-10%' }}>
        {/* Gauge Chart with blue color scheme matching GradeDescription.js table */}
        <GaugeChart
          id={`gauge-chart-${param}-${Date.now()}`}
          cornerRadius={0}
          arcsLength={[0.15, 0.2, 0.3, 0.2, 0.15]}
          arcPadding={0}
          colors={parameterColors}
          percent={gaugeValue}
          needleColor="#374151"
          needleBaseColor="#6b7280"
          hideText={true}
          animate={!hasRendered.current}
          animDelay={200}
          animateDuration={1200}
          arcWidth={0.4}
          width={undefined}
          height={undefined}
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            clipPath: 'inset(0 0 20% 0)'
          }}
        />
      </div>
      
      {/* Optional grade indicator overlay - only show if hideClassIndicator is false */}
      {!hideClassIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-5%' }}>
          <div className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 px-2 py-1 rounded-md shadow-sm pb-3`}>
            {grade?.replace('Class ', '') || 'N/A'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParamCharts;

// IMPORTANT: Water Quality Classification Context for Laguna de Bay (LLDA Standards)
// 
// Class C is the OPTIMAL classification for Laguna de Bay according to LLDA regulations
// - Class AA/A/B: Good to excellent water quality, but not specifically optimal for Laguna de Bay context
// - Class C: Target/optimal classification for Laguna de Bay's specific environmental conditions
// - Class D: Poor water quality that needs improvement
// - Failed: Outside all water quality standards, requires immediate attention
//
// Color coding rationale:
// - Green (Class C): Optimal target for LLDA/Laguna de Bay standards
// - Red (AA/A/B): Good quality but displayed as non-optimal for LLDA context visualization
// - Red (Class D): Poor quality water requiring improvement  
// - Black (Failed): Critical - outside all acceptable water quality standards
//
// This visual approach emphasizes Class C as the target standard while clearly distinguishing
// between good quality (AA/A/B) and poor quality (D) classifications.