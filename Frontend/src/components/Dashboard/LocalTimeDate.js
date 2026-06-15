import { useState, useEffect } from 'react';

// Simple local time/date display component (not used in Dashboard.js)
function LocalTimeDate() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 h-full w-full">
      <div className="flex-1 min-w-0 rounded-sm shadow-lg bg-gray-50 font-poppins py-2 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-left space-y-1 sm:space-y-2">
        {/* <i className="bi bi-clock-fill"></i> */}
        <h1 className="text-left font-poppins text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-gray-700">
          TIME
        </h1>
        <p className="text-left font-open-sans text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 break-words">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div className="flex-1 min-w-0 rounded-sm shadow-lg bg-gray-50 font-poppins py-2 px-2 sm:py-3 sm:px-3 lg:py-4 lg:px-4 text-left space-y-1 sm:space-y-2">
        {/* <i className="bi bi-calendar-fill"></i> */}
        <h1 className="text-left font-poppins text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-gray-700">
          DATE
        </h1>
        <p className="text-left font-open-sans text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 break-words">
          {time.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default LocalTimeDate;