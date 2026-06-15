import React, { useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getGrade } from './paramgrade';

const MapDetails = ({ description, grade, param, value }) => {
  const { grade: paramGrade } = value == null ? { grade: 'Invalid Data' } : getGrade(param, value);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <>
      <div
        className="flex flex-col sm:flex-row description p-3 sm:p-4 md:p-5 rounded-sm shadow-md justify-center bg-white text-black mt-2 sm:mt-3 md:mt-4 text-center hover:shadow-xl transition-shadow duration-200 cursor-pointer"
        onClick={toggleModal}
      >
        <div className="flex items-center justify-center mb-2 sm:mb-0">
          {paramGrade === 'Class D' && <FaExclamationTriangle className="mr-2 text-red-500 text-sm sm:text-base" />}
          <p className="text-sm sm:text-base md:text-lg">{description}</p>
        </div>
        <i className="bi bi-info-circle-fill text-sm mr-0 sm:mr-3 text-blue-500 mb-2 sm:mb-0"></i>
        <p className="font-open-sans text-xs sm:text-sm text-gray-500">Click to see information about the stations.</p>
        {paramGrade === 'Class D' && (
          <div className="mt-2 text-red-500 flex items-center justify-center">
            <FaExclamationTriangle className="inline mr-1 text-sm" />
            <span className="text-sm sm:text-base">{param} is at a dangerous level.</span>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-4 sm:p-5 md:p-6 rounded-sm shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Station Information</h3>
            <p className="text-sm sm:text-base mb-4">Detailed information about the water quality stations will be displayed here.</p>
            <button
              className="w-full sm:w-auto mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-sm transition-colors duration-200"
              onClick={toggleModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MapDetails;