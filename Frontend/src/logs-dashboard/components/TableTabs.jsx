const TableTabs = ({ activeTab, onTabChange }) => {
  const tabs = ['all', 'reports', 'system', 'sensors'];

  return (
    <div className="flex space-x-4 mb-4">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`px-4 py-2 rounded-md font-poppins ${
            activeTab === tab 
              ? 'bg-mapua-blue text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default TableTabs;
