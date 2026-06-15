import React, { useRef, useEffect, useState } from 'react';

const QUICK_RANGES = [
  { label: 'Today', value: 'Today' },
  { label: 'Yesterday', value: 'Yesterday' },
  { label: 'Last 7 Days', value: 'Last 7 Days' },
  { label: 'Last 30 Days', value: 'Last 30 Days' },
  { label: 'Last 6 Months', value: 'Last 6 Months' },
  { label: 'Last Year', value: 'Last Year' },
  { label: 'All Time', value: 'All Time' }
];

const DateRangeSelector = ({ dateRange, onDateRangeChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close filter view when clicking outside the container
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [open]);

  // Helper to format the selected range for display
  const formatRangeLabel = () => {
    if (dateRange.status && dateRange.status !== 'Custom') return dateRange.status;
    if (dateRange.startDate && dateRange.endDate) {
      const start = dateRange.startDate.toLocaleDateString();
      const end = dateRange.endDate.toLocaleDateString();
      return `${start} - ${end}`;
    }
    if (dateRange.startDate) return `From ${dateRange.startDate.toLocaleDateString()}`;
    if (dateRange.endDate) return `Until ${dateRange.endDate.toLocaleDateString()}`;
    return 'Select Date Range';
  };

  // Ensure only one of status or custom range is set at a time
  const handleQuickRangeSelect = (range) => {
    onDateRangeChange({
      startDate: null,
      endDate: null,
      status: range
    });
  };

  const handleCustomDateChange = (startDate, endDate) => {
    onDateRangeChange({
      startDate,
      endDate,
      status: null
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        className="w-full text-left px-3 py-2 border border-gray-300 rounded-md bg-white shadow-sm hover:bg-gray-50 transition-colors text-sm sm:text-base"
        onClick={() => {
          if (!open) setOpen(true);
        }}
        tabIndex={0}
      >
        <span className="truncate block">{formatRangeLabel()}</span>
      </button>
      {open && (
        <div className="absolute z-20 bg-white border border-gray-300 rounded-md shadow-lg mt-2 w-full min-w-[280px] sm:min-w-[320px] md:min-w-[400px]">
          <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2 mb-3">
                {QUICK_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => {
                      handleQuickRangeSelect(range.value);
                      setOpen(true);
                    }}
                    className={`
                      px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                      ${dateRange.status === range.value
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-800 border-2 border-transparent hover:bg-gray-200'
                      }
                    `}
                    type="button"
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const newStart = e.target.value ? new Date(e.target.value) : null;
                      handleCustomDateChange(newStart, dateRange.endDate);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const newEnd = e.target.value ? new Date(e.target.value) : null;
                      handleCustomDateChange(dateRange.startDate, newEnd);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <span>Selected: </span>
                <span className="font-semibold break-all">{formatRangeLabel()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;