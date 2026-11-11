const jsonService = require('./jsonService');

const routeToDepartment = (category) => {
  const departments = jsonService.readData('departments');
  
  // Maps both exact category codes AND display names to department names
  const rules = {
    // Exact category codes (from classificationService)
    'POTHOLE': 'Public Works / Roads',
    'ROAD_DAMAGE': 'Public Works / Roads',
    'FOOTPATH_DAMAGE': 'Public Works / Roads',
    'GARBAGE_OVERFLOW': 'Sanitation / Solid Waste',
    'ILLEGAL_DUMPING': 'Sanitation / Solid Waste',
    'STREETLIGHT': 'Electrical / Streetlights',
    'BROKEN_STREETLIGHT': 'Electrical / Streetlights',
    'WATER_LEAKAGE': 'Water Supply',
    'DRAINAGE_SEWERAGE': 'Drainage / Sewerage',
    'DRAINAGE_SEWAGE_PROBLEM': 'Drainage / Sewerage',
    'TRAFFIC_SIGNAL': 'Traffic',
    'FALLEN_TREE': 'Parks / Horticulture',
    'PUBLIC_PARK_ISSUE': 'Parks / Horticulture',
    'STRAY_ANIMAL': 'Animal Control',
    'OTHER': 'Municipal Control Room',
    // Display names (for backward compat)
    'ROAD DAMAGE': 'Public Works / Roads',
    'FOOTPATH DAMAGE': 'Public Works / Roads',
    'GARBAGE OVERFLOW': 'Sanitation / Solid Waste',
    'ILLEGAL DUMPING': 'Sanitation / Solid Waste',
    'BROKEN STREETLIGHT': 'Electrical / Streetlights',
    'WATER LEAKAGE': 'Water Supply',
    'DRAINAGE/SEWAGE PROBLEM': 'Drainage / Sewerage',
    'TRAFFIC SIGNAL': 'Traffic',
    'FALLEN TREE': 'Parks / Horticulture',
    'PUBLIC PARK ISSUE': 'Parks / Horticulture',
    'STRAY ANIMAL': 'Animal Control'
  };

  const upperCategory = (category || '').toUpperCase().replace(/-/g, '_');
  const targetDeptName = rules[upperCategory] || 'Municipal Control Room';
  
  const dept = departments.find(d => d.name === targetDeptName);
  
  return {
    recommendedDepartmentId: dept ? dept.id : null,
    reason: `Category '${category}' automatically routed to ${targetDeptName}.`
  };
};

module.exports = { routeToDepartment };
