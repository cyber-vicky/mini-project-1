const jsonService = require('./jsonService');

const getHotspots = () => {
  const issues = jsonService.readData('issues');
  const hotspots = {};
  
  // Grid size roughly ~500m precision
  // 0.005 degrees is approx 500m
  const GRID_SIZE = 0.005;

  issues.forEach(issue => {
    if (issue.latitude && issue.longitude && issue.status !== 'CLOSED') {
      const latGrid = Math.round(parseFloat(issue.latitude) / GRID_SIZE) * GRID_SIZE;
      const lonGrid = Math.round(parseFloat(issue.longitude) / GRID_SIZE) * GRID_SIZE;
      
      const key = `${latGrid.toFixed(4)},${lonGrid.toFixed(4)}`;
      
      if (!hotspots[key]) {
        hotspots[key] = {
          latitude: latGrid,
          longitude: lonGrid,
          count: 0,
          categories: {}
        };
      }
      
      hotspots[key].count += 1;
      hotspots[key].categories[issue.category] = (hotspots[key].categories[issue.category] || 0) + 1;
    }
  });

  // Convert to array and filter out low density areas
  return Object.values(hotspots)
    .filter(h => h.count > 1) // At least 2 complaints to be considered a minor hotspot
    .sort((a, b) => b.count - a.count);
};

module.exports = { getHotspots };
