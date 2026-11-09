import React, { useState, useMemo, useEffect } from 'react';
import { getStatusColor, getStatusText } from '../utils/statusUtils';

const TableContent = ({ data, type }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 1) Filter once based on type
  const filteredData = useMemo(() => {
    if (!data) return [];
    switch (type) {
      case 'reports':
        return data.Log.Report.Data || [];
      case 'system':
        return data.Log.System.Data || [];
      case 'sensors':
        return data.Sensor.Data.All || [];
      default:
        return [
          ...(data.Log.All.Data   || []),
          ...(data.Sensor.Data.All || [])
        ];
    }
  }, [data, type]);

  // 2) Compute total pages
  const totalPages = useMemo(
    () => Math.ceil(filteredData.length / itemsPerPage),
    [filteredData.length, itemsPerPage]
  );

  // 3) Clamp currentPage if it's out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [currentPage, totalPages]);

  // 4) Slice out the current page of items
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // 5) Build a clean page-number list with ellipsis
  const pageNumbers = useMemo(() => {
    const pages = [];
    const siblingCount = 1;               // how many neighbors to show
    const totalPageNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalPageNumbers) {
      // fewer pages than the limit → show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftSiblingIndex  = Math.max(currentPage - siblingCount, 2);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages - 1);

    const showLeftEllipsis  = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    pages.push(1);

    if (showLeftEllipsis) {
      pages.push('LEFT_ELLIPSIS');
    } else {
      for (let i = 2; i < leftSiblingIndex; i++) {
        pages.push(i);
      }
    }

    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }

    if (showRightEllipsis) {
      pages.push('RIGHT_ELLIPSIS');
    } else {
      for (let i = rightSiblingIndex + 1; i < totalPages; i++) {
        pages.push(i);
      }
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, currentPage]);

  // Only change page if it's a valid number
  const handlePageChange = (page) => {
    if (typeof page === 'number' && page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      {/* Items per page selector */}
      <div className="flex items-center space-x-2 mb-4">
        <label className="text-sm text-gray-700 font-open-sans">Show</label>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-sm text-gray-700 font-open-sans">entries</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white border-collapse border border-gray-300 rounded-lg table-fixed">
          <thead className="bg-mapua-blue text-white">
            <tr>
              <th className="w-1/4 py-2 px-3 border border-gray-300 text-center font-medium font-poppins">Time</th>
              <th className="w-2/5 py-2 px-3 border border-gray-300 text-center font-medium font-poppins">Description</th>
              <th className="w-1/6 py-2 px-3 border border-gray-300 text-center font-medium font-poppins">Status</th>
              {type === 'sensors' && (
                <th className="w-1/6 py-2 px-3 border border-gray-300 text-center font-medium font-poppins">Value</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <tr
                key={`${item.time}-${item.description.slice(0, 10)}`}
                className="hover:bg-gray-100 transition"
              >
                <td className="w-1/4 py-2 px-3 border border-gray-300 text-center font-open-sans whitespace-nowrap">
                  {new Date(item.time).toLocaleString()}
                </td>
                <td className="w-2/5 py-2 px-3 border border-gray-300 text-center font-open-sans">
                  <div className="truncate" title={item.description}>
                    {item.description}
                  </div>
                </td>
                <td className="w-1/6 py-2 px-3 border border-gray-300 text-center">
                  <span className={`px-2 py-1 rounded-md font-open-sans ${getStatusColor(item, type)}`}>
                    {getStatusText(item, type)}
                  </span>
                </td>
                {type === 'sensors' && (
                  <td className="w-1/6 py-2 px-3 border border-gray-300 text-center font-open-sans">
                    {item.value}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-700 font-open-sans">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredData.length)} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md font-poppins ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-mapua-blue text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {pageNumbers.map((p, idx) =>
              p === 'LEFT_ELLIPSIS' || p === 'RIGHT_ELLIPSIS' ? (
                <span key={`ellipsis-${idx}`} className="px-3 py-1 font-poppins">
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => handlePageChange(p)}
                  className={`px-3 py-1 rounded-md font-poppins ${
                    currentPage === p
                      ? 'bg-mapua-blue text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md font-poppins ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-mapua-blue text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableContent;