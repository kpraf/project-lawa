import React, { useState } from 'react';
import { Link } from 'react-router';
import { FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getGrade } from './paramgrade';
import Overlay from '../Modal';

// Export class descriptions as an object
export const classDescriptions = {
  'Class AA': 'Public Water Supply Class I - Intended primary for waters having watersheds, which are uninhabited and/or otherwise declared as protected areas, and which require only approved disinfection to meet the latest Philippine National Standards for Drinking Water (PNSDW)',
  'Class A': 'Public Water Supply Class II - Intended as sources of water supply requiring conventional treatment (coagulation, sedimentation, filtration and disinfection) to meet the latest Philippine National Standards for Drinking Water (PNSDW)',
  'Class B': 'Recreational Water Class I - Intended for primary contact recreation (bathing, swimming, etc.)',
  'Class C': 'OPTIMAL FOR LAGUNA DE BAY\n\n1. Fishery Water for the propagation and growth of fish and other aquatic resources\n2. Recreational Water Class II - For boating, fishing, or similar activities\n3. For agriculture, irrigation, and livestock watering\n\nNote: According to LLDA guidelines, Class C is the target classification for Laguna de Bay water quality parameters.',
  'Class D': 'Navigable waters',
  'Failed': 'FAILED - Values completely outside all water quality standards. These readings indicate severe water quality issues that require immediate attention and remediation. Such values may pose significant environmental and health risks.'
};

// Export parameterRanges for use in other components
export const parameterRanges = {
  Temperature: {
    AA: ["°C", "26 - 30"],
    A: ["°C", "26 - 30"],
    B: ["°C", "26 - 30"],
    C: ["°C", "25 - 31"],
    D: ["°C", "25 - 32"]
  },

  pH: {
    AA: ["", "6.5 - 8.5"],
    A: ["", "6.5 - 8.5"],
    B: ["", "6.5 - 8.5"],
    C: ["", "6.5 - 9.0"],
    D: ["", "6.0 - 9.0"]
  },

  'Dissolved Oxygen': {
    AA: ["mg/L", "≥5"],
    A: ["mg/L", "≥5"],
    B: ["mg/L", "≥5"],
    C: ["mg/L", "≥5"],
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


}

const GradeDescription = ({ description, grade, param, value }) => {
  const { grade: paramGrade } = getGrade(param, value);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const parameterDescriptions = {
    Temperature: 'Water Temperature affects the metabolic rates of aquatic organisms and the solubility of oxygen.',
    pH: 'pH measures the acidity or alkalinity of water. Extreme pH levels can be harmful to aquatic life.',
    'Dissolved Oxygen': 'Dissolved Oxygen is essential for aquatic life. Low levels can lead to fish kills.',
    'Total Dissolved Solids': 'Represents dissolved substances in water; high levels affect taste, quality, and usability.',
    Turbidity: 'Indicates water cloudiness caused by particles; high levels can harm aquatic ecosystems.',
    'Oxidation-Reduction Potential': "Oxidation-Reduction Potential (ORP) measures the water's ability to oxidize pollutants; higher values indicate better water quality.",
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <div
        className="flex flex-row description p-5 rounded-sm shadow-md justify-center bg-white text-black text-center hover:shadow-xl hover:bg-gray-100 transition duration-200 cursor-pointer font-sans"
        onClick={toggleModal}
      >
        <div className="flex items-center justify-center">
          {paramGrade === 'Class D' && <FaExclamationTriangle className="mr-2 text-red-500" />}
          <p className="font-sans">{description}</p>
        </div>
        <i className="bi bi-info-circle-fill text-sm mr-3 text-blue-500"></i>
        <p className="font-sans text-sm text-gray-500">Click to learn more about Water and Parameter Classifications</p>
        {paramGrade === 'Class D' && (
          <div className="mt-2 text-red-500 font-sans">
            <FaExclamationTriangle className="inline mr-1" />
            <span>{param} is at a dangerous level.</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <Overlay onClose={toggleModal}>
            <div className="h-[90vh] w-[95vw] max-w-[1400px] font-sans overflow-y-auto p-6">
              {/* Enhanced Header with prominent references */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold font-sans text-gray-800">Water Quality Assessment</h2>
                <div className="flex gap-3 text-right">
                  <span
                    className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-3 py-2 rounded-lg border border-blue-300 transition font-sans text-sm"
                    onClick={() => window.open("https://www.ccme.ca/en/res/wqindex_en.pdf", "_blank", "noopener,noreferrer")}
                  >
                    CCME WQI Reference Guide
                  </span>
                  <span
                    className="cursor-pointer bg-green-100 hover:bg-green-200 text-green-700 font-medium px-3 py-2 rounded-lg border border-green-300 transition font-sans text-sm"
                    onClick={() => window.open("https://pab.emb.gov.ph/wp-content/uploads/2017/07/DAO-2016-08-WQG-and-GES.pdf", "_blank", "noopener,noreferrer")}
                  >
                    DENR DAO 2016 Reference
                  </span>
                </div>
              </div>

              {/* Responsive Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column - CCME WQI */}
                <div>
                  <h3 className="text-xl font-bold mb-3 font-sans">CCME Water Quality Index (WQI)</h3>
                  <p className="mb-3 text-gray-700 text-sm leading-relaxed">
                    The CCME WQI provides a standardized method for assessing overall water quality based on multiple parameters. 
                    It converts complex water quality data into a single number between 0 and 100.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-4 font-sans text-lg">CCME WQI Classifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 bg-green-200 rounded-lg border-l-4 border-green-600">
                        <div className="w-20 text-center font-bold text-sm">95-100</div>
                        <div className="ml-4 text-sm">
                          <span className="font-semibold">Excellent:</span> Virtual absence of threat
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-green-100 rounded-lg border-l-4 border-green-500">
                        <div className="w-20 text-center font-bold text-sm">80-94</div>
                        <div className="ml-4 text-sm">
                          <span className="font-semibold">Good:</span> Minor degree of threat
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-yellow-200 rounded-lg border-l-4 border-yellow-600">
                        <div className="w-20 text-center font-bold text-sm">65-79</div>
                        <div className="ml-4 text-sm">
                          <span className="font-semibold">Fair:</span> Occasionally threatened
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-orange-200 rounded-lg border-l-4 border-orange-600">
                        <div className="w-20 text-center font-bold text-sm">45-64</div>
                        <div className="ml-4 text-sm">
                          <span className="font-semibold">Marginal:</span> Frequently threatened
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-red-200 rounded-lg border-l-4 border-red-600">
                        <div className="w-20 text-center font-bold text-sm">0-44</div>
                        <div className="ml-4 text-sm">
                          <span className="font-semibold">Poor:</span> Almost always threatened
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Calculation Process */}
                <div>
                  <h3 className="text-xl font-bold mb-3 font-sans">CCME WQI Calculation Process</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1 text-sm">Step 1: F1 (Scope)</h4>
                        <p className="text-xs text-gray-700 mb-1">% of parameters exceeding guidelines:</p>
                        <div className="bg-white p-2 rounded border font-mono text-xs">
                          F1 = (Parameters exceeding / Total parameters) × 100
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1 text-sm">Step 2: F2 (Frequency)</h4>
                        <p className="text-xs text-gray-700 mb-1">% of tests exceeding guidelines:</p>
                        <div className="bg-white p-2 rounded border font-mono text-xs">
                          F2 = (Tests exceeding / Total tests) × 100
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1 text-sm">Step 3: F3 (Amplitude)</h4>
                        <p className="text-xs text-gray-700 mb-1">Normalized sum of excursions:</p>
                        <div className="bg-white p-2 rounded border font-mono text-xs space-y-1">
                          <div>NSE = Sum of excursions / Total tests</div>
                          <div>F3 = NSE / (0.01 × NSE + 0.01)</div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          <em>Excursion = |Failed value - Guideline| / Guideline</em>
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-blue-700 mb-1 text-sm">Step 4: Final CCME WQI</h4>
                        <div className="bg-white p-2 rounded border font-mono text-xs">
                          CCME WQI = 100 - √[(F1² + F2² + F3²) / 1.732]
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          <em>Result is clamped between 0 and 100</em>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsive Parameter Classifications Table */}
              <div>
                <h3 className="text-xl font-bold mb-3 font-sans">Parameter Classifications (DENR DAO 2016)</h3>
                
                {/* Laguna de Bay Optimization Notice */}
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-lg">
                  <div className="flex items-center mb-2">
                    <h4 className="font-bold text-green-800 text-lg">Laguna de Bay Optimization</h4>
                  </div>
                  <p className="text-green-700 font-medium">
                    According to LLDA (Laguna Lake Development Authority) guidelines, <strong>Class C is the optimal classification</strong> for water quality parameters in Laguna de Bay. 
                    This dashboard is specifically calibrated to show Class C parameters in green to indicate they meet the target level for this lake ecosystem.
                  </p>
                </div>
                
                {/* Color Legend */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-bold mb-3 text-sm">Color Coding Guide</h4>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 border border-red-600 mr-2 rounded"></div>
                      <span className="font-medium">Class AA (Pristine)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 border border-red-600 mr-2 rounded"></div>
                      <span className="font-medium">Class A (High Quality)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 border border-red-600 mr-2 rounded"></div>
                      <span className="font-medium">Class B (Very Good)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 border border-green-700 mr-2 rounded"></div>
                      <span className="font-medium">Class C (Optimal)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 border border-red-600 mr-2 rounded"></div>
                      <span className="font-medium">Class D (Poor)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 border border-red-600 mr-2 rounded"></div>
                      <span className="font-medium">Failed (Critical)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> Colors match the gauge indicators. Class C (green) is optimal for Laguna de Bay according to LLDA guidelines. All other classes (red) indicate either over-treatment or poor water quality.
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className='min-w-full bg-white border border-gray-300 font-sans text-sm'>
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-3 align-middle border font-sans font-semibold" rowSpan={2}>Parameter</th>
                        <th className="py-2 px-3 align-middle border font-sans font-semibold" rowSpan={2}>Description</th>
                        <th className="py-2 px-3 align-middle border font-sans font-semibold" rowSpan={2}>Unit</th>
                        <th className="py-2 px-3 border font-sans font-semibold" colSpan={6}>Water Quality Classes</th>
                      </tr>
                      <tr>
                        <th className='border px-2 py-1 font-sans bg-red-500 text-white text-sm font-semibold'>AA</th>
                        <th className='border px-2 py-1 font-sans bg-red-500 text-white text-sm font-semibold'>A</th>
                        <th className='border px-2 py-1 font-sans bg-red-500 text-white text-sm font-semibold'>B</th>
                        <th className='border px-2 py-1 font-sans bg-green-500 text-sm font-bold text-white'>C</th>
                        <th className='border px-2 py-1 font-sans bg-red-500 text-white text-sm font-semibold'>D</th>
                        <th className='border px-2 py-1 font-sans bg-red-500 text-white text-sm font-semibold'>Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(parameterRanges).map(([param, ranges]) => {
                        // Function to determine cell color - only Class C is green, everything else is red
                        const getCellColor = (classKey, value) => {
                          const allValues = [ranges.AA?.[1], ranges.A?.[1], ranges.B?.[1], ranges.C?.[1], ranges.D?.[1]];
                          
                          // Count how many classes have the same value as current class
                          const sameValueCount = allValues.filter(v => v === value).length;
                          
                          // If multiple classes share the same value, use Class C color if C is among them
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
                              return 'bg-green-500 font-bold text-white'; // Same as C - Green
                            }
                            
                            // Otherwise, all non-C classes get red
                            return 'bg-red-500 text-white'; // Red for all non-C classes
                          }
                          
                          // Use distinct colors: only C is green, everything else is red
                          switch (classKey) {
                            case 'C': return 'bg-green-500 font-bold text-white'; // Green - Optimal (Laguna de Bay target)
                            default: return 'bg-red-500 text-white'; // Red - All other classes
                          }
                        };

                        return (
                          <tr key={param} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 font-sans font-medium text-sm">{param}</td>
                            <td className="border px-3 py-2 font-sans text-sm max-w-xs leading-relaxed">{parameterDescriptions[param]}</td>
                            <td className="border px-3 py-2 font-sans text-center text-sm">{ranges.AA ? ranges.AA[0] : ''}</td>
                            <td className={`border px-3 py-2 font-sans text-center text-sm ${getCellColor('AA', ranges.AA?.[1])}`}>{ranges.AA ? ranges.AA[1] : ''}</td>
                            <td className={`border px-3 py-2 font-sans text-center text-sm ${getCellColor('A', ranges.A?.[1])}`}>{ranges.A ? ranges.A[1] : ''}</td>
                            <td className={`border px-3 py-2 font-sans text-center text-sm ${getCellColor('B', ranges.B?.[1])}`}>{ranges.B ? ranges.B[1] : ''}</td>
                            <td className={`border px-3 py-2 font-sans text-center text-sm ${getCellColor('C', ranges.C?.[1])}`}>{ranges.C ? ranges.C[1] : ''}</td>
                            <td className={`border px-3 py-2 font-sans text-center text-sm ${getCellColor('D', ranges.D?.[1])}`}>{ranges.D ? ranges.D[1] : ''}</td>
                            <td className="border px-3 py-2 font-sans text-center text-sm bg-red-500 text-white font-semibold">Out of range</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-sm text-gray-600 font-sans space-y-1">
                  <p><strong>Note:</strong> Classification shows "Invalid data" when no data is available for the parameter, and "Failed" when the parameter is out of range.</p>
                  <p className="font-bold mt-2">Water Quality Class Meanings</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300 font-sans text-sm mb-2">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-3 border font-sans font-semibold">Class</th>
                          <th className="py-2 px-3 border font-sans font-semibold">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border px-3 py-2 font-sans font-bold bg-red-500 text-white">AA (Public Water Supply I)</td>
                          <td className="border px-3 py-2 font-sans">Water is of the highest quality, suitable for drinking after approved disinfection only. Typically sourced from protected watersheds and used for sensitive uses such as direct human consumption and food processing.</td>
                        </tr>
                        <tr>
                          <td className="border px-3 py-2 font-sans font-bold bg-red-500 text-white">A (Public Water Supply II)</td>
                          <td className="border px-3 py-2 font-sans">Water is suitable for drinking after conventional treatment (coagulation, sedimentation, filtration, and disinfection). Used for municipal water supply and domestic purposes where some treatment is required.</td>
                        </tr>
                        <tr>
                          <td className="border px-3 py-2 font-sans font-bold bg-red-500 text-white">B (Recreational Water I)</td>
                          <td className="border px-3 py-2 font-sans">Water is safe for primary contact recreation such as swimming and bathing. Also suitable for uses where people are likely to ingest or come into direct contact with the water.</td>
                        </tr>
                        <tr className="border-2 border-green-500">
                          <td className="border px-3 py-2 font-sans font-bold bg-green-500 text-white">C (Fishery/Recreational II/Agriculture) - OPTIMAL FOR LAGUNA DE BAY</td>
                          <td className="border px-3 py-2 font-sans font-bold">Water is suitable for the propagation and growth of fish and other aquatic resources, secondary contact recreation (boating, fishing), and agricultural uses such as irrigation and livestock watering. <span className="text-green-700 font-bold">According to LLDA guidelines, Class C is the target classification for Laguna de Bay water quality parameters.</span></td>
                        </tr>
                        <tr>
                          <td className="border px-3 py-2 font-sans font-bold bg-red-500 text-white">D (Navigable Waters)</td>
                          <td className="border px-3 py-2 font-sans">Water is suitable for navigation and other uses not requiring high water quality. Not recommended for direct human contact, drinking, or aquatic life support.</td>
                        </tr>
                        <tr>
                          <td className="border px-3 py-2 font-sans font-bold bg-red-500 text-white">Failed</td>
                          <td className="border px-3 py-2 font-sans font-bold text-red-600">Values completely outside all water quality standards. These readings indicate severe water quality issues that require immediate attention and remediation. Such values may pose significant environmental and health risks.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
        </Overlay>
      )}
    </>
  );
};

export default GradeDescription;