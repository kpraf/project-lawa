export const getStatusColor = (item, type) => {
  if (type === 'sensors') {
    return item.alert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  }
  return item.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

export const getStatusText = (item, type) => {
  if (type === 'sensors') {
    return item.alert ? 'Alert' : 'Normal';
  }
  return item.success ? 'Success' : 'Error';
};
