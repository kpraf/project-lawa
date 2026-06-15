export const gradingSystems = {
  BOD: (value) => {
    if (value < 0 || value > 15) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value <= 1) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - Pristine
    if (value <= 3) return { grade: 'Class A', color: 'bg-red-500' }; // Red - High Quality
    if (value <= 5) return { grade: 'Class B', color: 'bg-red-500' }; // Red - Very Good
    if (value <= 7) return { grade: 'Class C', color: 'bg-green-500' }; // Green - Optimal for Laguna de Bay
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - Poor
  },
  'Fecal Coliform': (value) => {
    if (value < 0 || value > 1000) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 1.1) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - Pristine
    if (value <= 100) return { grade: 'Class A', color: 'bg-red-500' }; // Red - High Quality
    if (value <= 200) return { grade: 'Class B', color: 'bg-red-500' }; // Red - Very Good
    if (value <= 400) return { grade: 'Class C', color: 'bg-green-500' }; // Green - Optimal for Laguna de Bay
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - Poor
  },
  pH: (value) => {
    // Based on the original ranges: AA, A, B all share 6.5-8.5; C is 6.5-9.0; D is 6.0-9.0
    if (value < 5.5 || value > 9.5) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 6.0 || value > 9.0) return { grade: 'Class D', color: 'bg-red-500' }; // Red - Outside D range
    if (value >= 6.5 && value <= 8.5) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA range (most restrictive)
    if (value >= 6.5 && value <= 9.0) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (6.0-9.0 but outside others)
  },
  'Inorganic Phosphate': (value) => {
    if (value < 0 || value > 1.0) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 0.003) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - Pristine
    if (value <= 0.05) return { grade: 'Class A', color: 'bg-red-500' }; // Red - High Quality
    if (value <= 0.1) return { grade: 'Class B', color: 'bg-red-500' }; // Red - Very Good
    if (value <= 0.5) return { grade: 'Class C', color: 'bg-green-500' }; // Green - Optimal for Laguna de Bay
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - Poor
  },
  'Dissolved Oxygen': (value) => {
    // Based on original ranges: AA, A, B share ≥7; C has 5-7; D has 2-5
    // Higher DO values indicate better water quality, but Class C (5-7) is optimal for Laguna de Bay
    if (value < 0 || value > 20) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 2) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Below all standards
    if (value < 5) return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (2-5, poor quality)
    if (value <= 7) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range (5-7, optimal for Laguna de Bay)
    return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA/A/B range (>7, good but not optimal for LLDA)
  },
  Nitrate: (value) => {
    if (value < 0 || value > 50) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value <= 1) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - Pristine
    if (value <= 3) return { grade: 'Class A', color: 'bg-red-500' }; // Red - High Quality
    if (value <= 6) return { grade: 'Class B', color: 'bg-red-500' }; // Red - Very Good
    if (value <= 10) return { grade: 'Class C', color: 'bg-green-500' }; // Green - Optimal for Laguna de Bay
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - Poor
  },
  Temperature: (value) => {
    // Based on original ranges: AA, A, B all share 26-30; C is 25-31; D is 25-32
    if (value < 20 || value > 40) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 25 || value > 32) return { grade: 'Class D', color: 'bg-red-500' }; // Red - Outside D range
    if (value >= 26 && value <= 30) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA range (most restrictive)
    if (value >= 25 && value <= 31) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (25-32 but outside others)
  },
  Ammonia: (value) => {
    if (value < 0 || value > 2.0) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value <= 0.02) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - Pristine
    if (value <= 0.05) return { grade: 'Class A', color: 'bg-red-500' }; // Red - High Quality
    if (value <= 0.1) return { grade: 'Class B', color: 'bg-red-500' }; // Red - Very Good
    if (value <= 0.5) return { grade: 'Class C', color: 'bg-green-500' }; // Green - Optimal for Laguna de Bay
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - Poor
  },
  Turbidity: (value) => {
    // Based on original ranges: AA, A, B all share <5; C is 5-10; D is 10-15
    if (value < 0) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Invalid
    if (value > 25) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value > 15) return { grade: 'Class D', color: 'bg-red-500' }; // Red - Above D range
    if (value < 5) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA range (most restrictive)
    if (value <= 10) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range (5-10)
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (10-15)
  },
  'Total Dissolved Solids': (value) => {
    // Based on original ranges: AA, A, B all share <500; C is 500-1000; D is 1000-1500
    if (value < 0) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Invalid
    if (value > 2000) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value > 1500) return { grade: 'Class D', color: 'bg-red-500' }; // Red - Above D range
    if (value < 500) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA range (most restrictive)
    if (value <= 1000) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range (500-1000)
    return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (1000-1500)
  },
  ORP: (value) => {
    // Based on original ranges: AA, A share >300; B is >250; C is 200-250; D is 150-200
    if (value < 0 || value > 600) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 150) return { grade: 'Class D', color: 'bg-red-500' }; // Red - Below D range
    if (value <= 200) return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (150-200)
    if (value <= 250) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range (200-250)
    if (value > 250) return { grade: 'Class B', color: 'bg-red-500' }; // Red - B range (>250)
    if (value > 300) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA range (>300, most restrictive)
    return { grade: 'Class D', color: 'bg-red-500' };
  },
  'Oxidation-Reduction Potential': (value) => {
    // Based on original ranges: AA, A share >300; B is >250; C is 200-250; D is 150-200
    if (value < 0 || value > 600) return { grade: 'Failed', color: 'bg-red-500' }; // Red - Outside all standards
    if (value < 150) return { grade: 'Class D', color: 'bg-red-500' }; // Red - Below D range
    if (value <= 200) return { grade: 'Class D', color: 'bg-red-500' }; // Red - D range (150-200)
    if (value <= 250) return { grade: 'Class C', color: 'bg-green-500' }; // Green - C range (200-250)
    if (value > 250) return { grade: 'Class B', color: 'bg-red-500' }; // Red - B range (>250)
    if (value > 300) return { grade: 'Class AA', color: 'bg-red-500' }; // Red - AA range (>300, most restrictive)
    return { grade: 'Class D', color: 'bg-red-500' };
  },
  // Aliases for parameter names
  TDS: (value) => gradingSystems['Total Dissolved Solids'](value),
  Phosphate: (value) => gradingSystems['Inorganic Phosphate'](value)
};

export const getGrade = (param, value) => {
  // Handle parameter name aliases
  const paramAliases = {
    'TDS': 'Total Dissolved Solids',
    'ORP': 'Oxidation-Reduction Potential', 
    'Phosphate': 'Inorganic Phosphate'
  };
  
  const normalizedParam = paramAliases[param] || param;
  const gradingSystem = gradingSystems[normalizedParam];
  return gradingSystem ? gradingSystem(value) : { grade: 'Unknown', color: 'bg-gray-500' };
};

// IMPORTANT: Class C is the optimal classification for Laguna de Bay according to LLDA
// Color coding: Only Class C gets green (bg-green-500), all other classes get red (bg-red-500)
// This represents that for Laguna de Bay's specific context, Class C parameters are the target level
// Grading logic is designed to be consistent with gauge positioning in ParamCharts.js

// The grading system now emphasizes Class C optimality:
// - Failed (Critical): Red - Values completely outside all water quality standards
// - Class D (Poor): Red - Outside acceptable limits or dangerous levels
// - Class C (Optimal): Green - Target classification for Laguna de Bay
// - Class B (Very Good): Red - Better than target but indicates over-treatment
// - Class A (High Quality): Red - High quality but over-treatment for lake context
// - Class AA (Pristine): Red - Pristine but may indicate over-processing

// Ensure parameter names here match those in PARAM_GUIDELINES in OverallWaterQuality.js
// For example, if you use 'TDS' in one file and 'Total Dissolved Solids' in another, harmonize them or add aliases.