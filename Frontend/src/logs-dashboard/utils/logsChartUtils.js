export function getUnsuccessfulLogsByDate(logData, groupBy = 'day') {
  // logData: data.Log
  const systemErrors = logData.System.Error_System.Data || [];
  const reportErrors = logData.Report.Error_Report.Data || [];

  // Helper to get date string (YYYY-MM-DD or week number)
  const getKey = (dateObj) => {
    if (groupBy === 'week') {
      const d = new Date(dateObj);
      const onejan = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      return `${d.getFullYear()}-W${week}`;
    }
    // Default: day
    return new Date(dateObj).toLocaleDateString();
  };

  const countByDate = (arr) => {
    const counts = {};
    arr.forEach(log => {
      const key = getKey(log.time);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  const systemCounts = countByDate(systemErrors);
  const reportCounts = countByDate(reportErrors);

  // Get all unique dates
  const allDates = Array.from(new Set([...Object.keys(systemCounts), ...Object.keys(reportCounts)])).sort();

  // Return array for chart
  return allDates.map(date => ({
    date,
    System: systemCounts[date] || 0,
    Report: reportCounts[date] || 0,
  }));
}
