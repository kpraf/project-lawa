const ActivityTimeline = ({ data, type }) => {
  return (
    <div className="space-y-4">
      {data?.slice(0, 5).map((item, index) => (
        <div key={index} className="flex items-start space-x-4">
          <div className={`w-2 h-2 rounded-full mt-2 ${
            type === 'system' 
              ? (item.success ? 'bg-green-500' : 'bg-red-500')
              : (item.alert ? 'bg-red-500' : 'bg-green-500')
          }`} />
          <div className="flex-1">
            <p className="text-sm">{item.description}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{type === 'sensor' ? `${item.station} - ${item.sensor}` : item.type}</span>
              <span>{new Date(item.time).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
