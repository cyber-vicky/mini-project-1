const calculatePriority = (category, description, matchedKeywords, nearbyReportsCount) => {
  let severity = 50;
  let urgency = 50;
  let publicImpact = 50;

  const text = description.toLowerCase();
  const urgencyKeywords = ['urgent', 'emergency', 'immediately', 'danger', 'accident', 'hazard', 'severe'];
  const impactKeywords = ['main road', 'school', 'hospital', 'crowd', 'many people', 'blocking'];

  // Check urgency
  urgencyKeywords.forEach(word => {
    if (text.includes(word)) urgency += 15;
  });

  // Check impact
  impactKeywords.forEach(word => {
    if (text.includes(word)) publicImpact += 15;
  });

  // Category based base severity
  if (category === 'WATER_LEAKAGE' || category === 'DRAINAGE_SEWERAGE' || category === 'TRAFFIC_SIGNAL') {
    severity += 20;
  }

  // Cap at 100
  severity = Math.min(severity, 100);
  urgency = Math.min(urgency, 100);
  publicImpact = Math.min(publicImpact, 100);
  const locationSensitivity = publicImpact; // Simplified for prototype
  const nearbyReports = Math.min(nearbyReportsCount * 10, 100);

  // Weighted score
  const score = Math.round(
    (severity * 0.30) +
    (urgency * 0.20) +
    (publicImpact * 0.20) +
    (nearbyReports * 0.15) +
    (locationSensitivity * 0.15)
  );

  let priority = 'LOW';
  if (score >= 75) priority = 'CRITICAL';
  else if (score >= 50) priority = 'HIGH';
  else if (score >= 25) priority = 'MEDIUM';

  return {
    priority,
    score,
    factors: {
      severity,
      urgency,
      publicImpact,
      nearbyReports,
      locationSensitivity
    }
  };
};

module.exports = { calculatePriority };
