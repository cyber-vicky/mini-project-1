const jsonService = require('./jsonService');

// Haversine formula for distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
};

const detectDuplicate = (newIssue) => {
  const issues = jsonService.readData('issues');
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const DISTANCE_THRESHOLD = 500; // meters
  
  let bestDuplicate = null;
  let highestScore = 0;

  issues.forEach(issue => {
    if (issue.status === 'CLOSED' || issue.id === newIssue.id) return;
    
    // Check time window
    const timeDiff = new Date() - new Date(issue.createdAt);
    if (timeDiff > SEVEN_DAYS) return;

    // Check category match (normalized)
    const cat1 = (issue.category || '').toUpperCase().replace(/[\s\-_/]/g, '');
    const cat2 = (newIssue.category || '').toUpperCase().replace(/[\s\-_/]/g, '');
    const predCat = (newIssue.classificationResult?.category || newIssue.predictedCategory || '').toUpperCase().replace(/[\s\-_/]/g, '');
    if (cat1 !== cat2 && cat1 !== predCat) return;

    // Check distance if coords available
    if (issue.latitude && issue.longitude && newIssue.latitude && newIssue.longitude) {
      const distance = getDistance(
        parseFloat(newIssue.latitude), parseFloat(newIssue.longitude),
        parseFloat(issue.latitude), parseFloat(issue.longitude)
      );

      if (distance <= DISTANCE_THRESHOLD) {
        // Simple token overlap similarity
        const tokens1 = newIssue.description.toLowerCase().split(/\W+/);
        const tokens2 = issue.description.toLowerCase().split(/\W+/);
        const intersection = tokens1.filter(t => tokens2.includes(t)).length;
        const union = new Set([...tokens1, ...tokens2]).size;
        const jaccardScore = union === 0 ? 0 : intersection / union;
        
        // Base score for being close and same category
        let score = 0.5 + (jaccardScore * 0.5);
        
        if (score > highestScore && score > 0.6) { // Threshold 60%
          highestScore = score;
          bestDuplicate = issue.id;
        }
      }
    }
  });

  return {
    isDuplicate: !!bestDuplicate,
    duplicateOf: bestDuplicate,
    duplicateScore: highestScore > 0 ? Number((highestScore * 100).toFixed(0)) : 0
  };
};

module.exports = { detectDuplicate };
