import React from 'react';

const Dropdown = ({ value, onChange, options, defaultOption, style }) => {
  // Ensure value is never null
  const safeValue = value == null ? '' : value;
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        value={safeValue}
        onChange={onChange}
        className="p-3 border rounded-sm bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out text-left"
        style={{
          width: '100%',
          maxHeight: 240,
          overflowY: 'auto',
          appearance: 'none', // Remove default arrow
          paddingRight: 32, // Space for custom arrow
          ...style
        }}
      >
        <option value="" disabled>{defaultOption}</option>
        {options.map(option => (
          <option key={option.value} value={option.value} className="text-left">
            {option.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: '#2563eb',
          fontSize: 18
        }}
      >&#9662;</span>
    </div>
  );
};

export default Dropdown;