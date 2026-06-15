import React, { useEffect, useRef } from 'react';
import GaugeChart from 'react-gauge-chart';
import { gradingSystems } from './paramgrade';

const ParamCharts = ({ parameterData, parameterRanges, compact = false, hideClassIndicator = true }) => {
  const hasRendered = useRef(false);

  useEffect(() => {
    hasRendered.current = true;
  }, []);

  if (!parameterData) {
    return <p>No data available for this parameter.</p>;
  }

  const { value: latestValue, param } = parameterData;
  const gradingSystem = gradingSystems[param];

  if (!gradingSystem) {
    return <p className="text-center">Data not found for parameter: {param}</p>;
  }

  if (latestValue == null) {
    return <p className="text-center">No valid data available for parameter: {param}</p>;
  }

  const { grade, color } = gradingSystem(latestValue);
  
  // Parameter-specific gauge positioning and colors based on actual standards groupings
  const getParameterSettings = (parameter, currentGrade) => {
    const paramKey = parameter === "ORP" ? "Oxidation-Reduction Potential" : parameter;
    
    // Define unique groups for each parameter based on the standards table
    const parameterGroups = {
      'Temperature': {
        groups: ['D', 'C', 'AA/A/B'], // D(25-32), C(25-31), AA/A/B(26-30)
        colors: ['#dc2626', '#16a34a', '#86efac'],
        values: { 'Class D': 0.2, 'Class C': 1.0, 'Class A': 0.6, 'Class AA': 0.6, 'Class B': 0.6 }
      },
      'pH': {
        groups: ['D', 'C', 'AA/A/B'], // D(6.0-9.0) widest, C(6.5-9.0) medium, AA/A/B(6.5-8.5) most restrictive
        colors: ['#dc2626', '#16a34a', '#86efac'],
        values: { 'Class D': 0.1, 'Class C': 1.0, 'Class A': 0.7, 'Class AA': 0.7, 'Class B': 0.7 }
      },
      'Dissolved Oxygen': {
        groups: ['D', 'AA/A/B/C'], // D(2-4), AA/A/B/C(≥5) - all same except D
        colors: ['#dc2626', '#16a34a'],
        values: { 'Class D': 0.2, 'Class C': 1.0, 'Class A': 1.0, 'Class AA': 1.0, 'Class B': 1.0 }
      },
      'Total Dissolved Solids': {
        groups: ['D', 'C', 'AA/A/B'], // D(1000-1500), C(500-1000), AA/A/B(<500)
        colors: ['#dc2626', '#16a34a', '#86efac'],
        values: { 'Class D': 0.2, 'Class C': 1.0, 'Class A': 0.6, 'Class AA': 0.6, 'Class B': 0.6 }
      },
      'Turbidity': {
        groups: ['D', 'C', 'AA/A/B'], // D(10-15), C(5-10), AA/A/B(<5)
        colors: ['#dc2626', '#16a34a', '#86efac'],
        values: { 'Class D': 0.2, 'Class C': 1.0, 'Class A': 0.6, 'Class AA': 0.6, 'Class B': 0.6 }
      },
      'Oxidation-Reduction Potential': {
        groups: ['D', 'C', 'B', 'AA/A'], // D(150-200), C(200-250), B(>250), AA/A(>300)
        colors: ['#dc2626', '#16a34a', '#4ade80', '#86efac'],
        values: { 'Class D': 0.1, 'Class C': 1.0, 'Class B': 0.7, 'Class A': 0.4, 'Class AA': 0.4 }
      }
    };

    const settings = parameterGroups[paramKey] || {
      groups: ['D', 'C', 'B', 'AA/A'],
      colors: ['#dc2626', '#16a34a', '#4ade80', '#86efac'],
      values: { 'Class D': 0.1, 'Class C': 1.0, 'Class B': 0.7, 'Class A': 0.3, 'Class AA': 0.3 }
    };

    return {
      colors: settings.colors,
      nrOfLevels: settings.colors.length,
      gaugeValue: settings.values[currentGrade] || 0.5
    };
  };

  const parameterSettings = getParameterSettings(param, grade);
  const gaugeValue = parameterSettings.gaugeValue;

  // console.log(gaugeValue)

  return (
    <div className="gauge-chart relative pt-5">
      {/* Admin Gauge Chart - Class C positioned as optimal (highest value) for LLDA guidelines */}
      <GaugeChart
        id="gauge-chart"
        nrOfLevels={parameterSettings.nrOfLevels}
        cornerRadius={0}
        colors={parameterSettings.colors}
        arcWidth={0.15}
        percent={gaugeValue}
        needleColor="#345243"
        hideText={true}
        animate={!hasRendered.current}
        animDelay={0}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold mt-[92.5px]">
        {latestValue}
      </div>
      
      {/* Grade indicator with Class C optimization */}
      <div className="text-center mt-2">
        <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${color.replace('bg-opacity-75', '')}`}>
          {grade}
        </div>
        {grade === 'Class C' && (
          <div className="text-xs text-green-600 font-medium mt-1">
            Optimal for Laguna de Bay
          </div>
        )}
      </div>
    </div>
  );
};

export default ParamCharts;