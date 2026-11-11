const jsonService = require('../services/jsonService');
const hotspotService = require('../services/hotspotService');

const getAnalytics = (req, res) => {
  try {
    const issues = jsonService.readData('issues');
    const departments = jsonService.readData('departments');
    const deptMap = {};
    departments.forEach(d => { deptMap[d.id] = d.name; });
    
    const stats = {
      total: issues.length,
      byCategory: {},
      byStatus: {},
      byPriority: {},
      byDepartment: {},
      byDate: {},
      avgResolutionHours: 0,
      resolvedCount: 0
    };

    let totalResolutionHours = 0;
    let resolvedIssuesCount = 0;

    issues.forEach(issue => {
      // By category
      stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
      
      // By status
      stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
      
      // By priority
      stats.byPriority[issue.priority] = (stats.byPriority[issue.priority] || 0) + 1;

      // By department
      const deptId = issue.assignedDepartmentId || issue.recommendedDepartmentId || 'unassigned';
      const deptName = deptMap[deptId] || (deptId === 'unassigned' ? 'Unassigned' : deptId);
      stats.byDepartment[deptName] = (stats.byDepartment[deptName] || 0) + 1;

      // By date (over time)
      if (issue.createdAt) {
        const dateKey = issue.createdAt.split('T')[0];
        stats.byDate[dateKey] = (stats.byDate[dateKey] || 0) + 1;
      }

      // Average resolution time
      if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(issue.status) && issue.createdAt && issue.updatedAt) {
        const createdTime = new Date(issue.createdAt).getTime();
        const updatedTime = new Date(issue.updatedAt).getTime();
        const diffHours = (updatedTime - createdTime) / (1000 * 60 * 60);
        if (diffHours >= 0) {
          totalResolutionHours += diffHours;
          resolvedIssuesCount += 1;
        }
      }
    });

    stats.resolvedCount = resolvedIssuesCount;
    stats.avgResolutionHours = resolvedIssuesCount > 0
      ? Number((totalResolutionHours / resolvedIssuesCount).toFixed(1))
      : 0;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getHotspots = (req, res) => {
  try {
    const hotspots = hotspotService.getHotspots();
    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPublicStats = (req, res) => {
  try {
    const issues = jsonService.readData('issues');
    const departments = jsonService.readData('departments');

    const totalReports = issues.length;
    const resolvedIssues = issues.filter(i => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)).length;
    const pendingIssues = issues.filter(i => ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(i.status)).length;
    const activeDepartments = departments.length;

    res.json({
      totalReports,
      resolvedIssues,
      pendingIssues,
      activeDepartments
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAnalytics, getHotspots, getPublicStats };
