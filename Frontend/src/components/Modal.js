import { useEffect, useRef, useState } from 'react';

function Overlay({ children, onClose }) {
  const overlayRef = useRef();

  const handleClickOutside = (event) => {
    if (overlayRef.current && !overlayRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    // Disable body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Restore original overflow
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300 z-[9999]">
      <div
        ref={overlayRef}
        className="m-auto bg-white rounded-lg p-4 sm:p-6 relative overflow-auto max-w-[95vw] max-h-[95vh] w-full sm:w-auto"
      >
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-black rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition duration-100"
        >
          <i className="bi bi-x text-3xl"></i>
        </button>
      </div>
    </div>
  );
}

export default Overlay;