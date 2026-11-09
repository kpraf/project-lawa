import ActivityTimeline from './ActivityTimeline';

const ActivitySection = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">System Logs</h3>
        <ActivityTimeline
          data={data?.Log.All.Data}
          type="system"
        />
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sensor Alerts</h3>
        <ActivityTimeline
          data={data?.Sensor.Data.All}
          type="sensor"
        />
      </div>
    </div>
  );
};

export default ActivitySection;
