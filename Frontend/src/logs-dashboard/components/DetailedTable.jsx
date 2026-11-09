import TableTabs from './TableTabs';
import TableContent from './TableContent';

const DetailedTable = ({ data, activeTab, onTabChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <TableTabs activeTab={activeTab} onTabChange={onTabChange} />
      <TableContent data={data} type={activeTab} />
    </div>
  );
};

export default DetailedTable;
