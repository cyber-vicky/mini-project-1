import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { AuthContext } from '../context/AuthContext';
import {
  Map,
  FileText,
  BarChart3,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

const getPriorityBadge = (pri) => {
  switch (pri) {
    case 'CRITICAL':
      return 'badge-priority-critical';
    case 'HIGH':
      return 'badge-priority-high';
    case 'MEDIUM':
      return 'badge-priority-medium';
    default:
      return 'badge-priority-low';
  }
};

const getStatusBadge = (st) => {
  switch (st) {
    case 'SUBMITTED':
      return 'badge-submitted';
    case 'ACKNOWLEDGED':
      return 'badge-acknowledged';
    case 'ASSIGNED':
      return 'badge-assigned';
    case 'IN_PROGRESS':
      return 'badge-in-progress';
    case 'RESOLVED':
      return 'badge-resolved';
    case 'VERIFIED':
      return 'badge-verified';
    case 'CLOSED':
      return 'badge-closed';
    case 'REOPENED':
      return 'badge-reopened';
    default:
      return 'badge-assigned';
  }
};

const MunicipalDashboard = () => {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [statsRes, issuesRes, deptsRes] = await Promise.all([
          api.get('/analytics').catch(() => ({ data: null })),
          api.get('/issues/all').catch(() => ({ data: [] })),
          api.get('/departments').catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          setStats(statsRes.data);
          setIssues(Array.isArray(issuesRes.data) ? issuesRes.data : []);
          setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : []);
        }
      } catch (err) {
        console.error('Failed to load municipal dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user?.role === 'ADMIN' || user?.role === 'OFFICER') {
      fetchDashboardData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  // Department name resolver
  const getDeptName = (deptId) => {
    if (!deptId) return 'Unassigned';
    const d = departments.find(item => item.id === deptId);
    return d ? d.name : deptId;
  };

  // Officer specific counts (computed from department-scoped issues)
  const officerStats = {
    total: issues.length,
    pendingAck: issues.filter(i => i.status === 'SUBMITTED').length,
    assigned: issues.filter(i => i.status === 'ASSIGNED').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: issues.filter(i => ['RESOLVED', 'CLOSED', 'VERIFIED'].includes(i.status)).length,
    highPriority: issues.filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH').length,
  };

  // Admin specific counts
  const adminStats = {
    total: stats?.total ?? issues.length,
    pending: (stats?.byStatus?.SUBMITTED || 0) + (stats?.byStatus?.ACKNOWLEDGED || 0),
    inProgress: (stats?.byStatus?.ASSIGNED || 0) + (stats?.byStatus?.IN_PROGRESS || 0),
    resolved: (stats?.byStatus?.RESOLVED || 0) + (stats?.byStatus?.VERIFIED || 0) + (stats?.byStatus?.CLOSED || 0),
    critical: stats?.byPriority?.CRITICAL || 0,
  };

  const officerDeptName = user?.departmentName || getDeptName(user?.departmentId) || 'Authorized Department';

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav
          title={user?.role === 'ADMIN' ? 'City Governance Dashboard' : `Officer Dashboard — ${officerDeptName}`}
          breadcrumb="Dashboard"
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#17191C] text-[#FF8A3D] border border-[#292D32]">
                  {user?.role === 'ADMIN' ? 'City-Wide Oversight' : `Department: ${officerDeptName}`}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                Operational Overview
              </h1>
              <p className="text-xs text-[#747982] mt-0.5">
                {user?.role === 'ADMIN'
                  ? 'City-wide municipal departments, operational GIS tracking, and infrastructure performance.'
                  : `Authorized jurisdiction for ${officerDeptName}. Triage complaints, assign field personnel, and verify repairs.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <Link
                to="/municipal/map"
                className="btn-graphite-secondary text-xs py-2 px-3.5 flex-1 sm:flex-initial"
              >
                <Map className="w-3.5 h-3.5 text-[#FF8A3D]" />
                <span>Operations Map</span>
              </Link>
              <Link
                to="/municipal/issues"
                className="btn-orange-primary text-xs py-2 px-3.5 flex-1 sm:flex-initial"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>All Complaints</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="civic-card p-12 text-center text-[#747982]">
              <p className="text-sm font-semibold">Loading municipal dashboard metrics...</p>
            </div>
          ) : user?.role === 'ADMIN' ? (
            /* ==============================================================
               ADMIN DASHBOARD VIEW
               ============================================================== */
            <div className="space-y-6 sm:space-y-8">
              {/* Admin Key Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-[11px] text-[#747982] font-bold uppercase tracking-wider">
                      Total Reports
                    </p>
                    <div className="w-7 h-7 rounded-lg bg-[#F4F5F6] flex items-center justify-center text-[#202226] border border-[#E2E4E7]">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-[#202226] tracking-tight">{adminStats.total}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#747982] mt-1">City-wide lodged issues</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#17191C]"></div>
                </div>

                <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-[11px] text-[#747982] font-bold uppercase tracking-wider">
                      Pending Triage
                    </p>
                    <div className="w-7 h-7 rounded-lg bg-[#F4B740]/10 flex items-center justify-center text-[#F4B740] border border-[#F4B740]/30">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-[#202226] tracking-tight">{adminStats.pending}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#747982] mt-1">Submitted &amp; Acknowledged</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#F4B740]"></div>
                </div>

                <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-[11px] text-[#747982] font-bold uppercase tracking-wider">
                      In Progress
                    </p>
                    <div className="w-7 h-7 rounded-lg bg-[#FF8A3D]/10 flex items-center justify-center text-[#FF8A3D] border border-[#FF8A3D]/30">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-[#FF8A3D] tracking-tight">{adminStats.inProgress}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#747982] mt-1">Assigned &amp; Active repairs</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF8A3D]"></div>
                </div>

                <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-[11px] text-[#747982] font-bold uppercase tracking-wider">
                      Resolved
                    </p>
                    <div className="w-7 h-7 rounded-lg bg-[#20A779]/10 flex items-center justify-center text-[#20A779] border border-[#20A779]/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-[#20A779] tracking-tight">{adminStats.resolved}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#747982] mt-1">Completed &amp; Closed</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#20A779]"></div>
                </div>

                <div className="civic-card p-4 sm:p-5 relative overflow-hidden col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] sm:text-[11px] text-[#747982] font-bold uppercase tracking-wider">
                      Critical Priority
                    </p>
                    <div className="w-7 h-7 rounded-lg bg-[#E45757]/10 flex items-center justify-center text-[#E45757] border border-[#E45757]/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-[#E45757] tracking-tight">{adminStats.critical}</p>
                  <p className="text-[10px] sm:text-[11px] text-[#747982] mt-1">Requiring immediate action</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#E45757]"></div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/municipal/map"
                  className="civic-card p-5 hover:border-[#FF8A3D] transition flex items-center justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#17191C] text-[#FF8A3D] flex items-center justify-center border border-[#292D32] mb-3">
                      <Map className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#202226] group-hover:text-[#FF8A3D] transition-colors">
                      Municipal Map
                    </h4>
                    <p className="text-xs text-[#747982] mt-0.5">Real-time GIS OpenStreetMap</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747982] group-hover:text-[#FF8A3D] transition-colors" />
                </Link>

                <Link
                  to="/municipal/analytics"
                  className="civic-card p-5 hover:border-[#FF8A3D] transition flex items-center justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#17191C] text-[#FF8A3D] flex items-center justify-center border border-[#292D32] mb-3">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#202226] group-hover:text-[#FF8A3D] transition-colors">
                      Analytics &amp; Hotspots
                    </h4>
                    <p className="text-xs text-[#747982] mt-0.5">Resolution times &amp; clustering</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747982] group-hover:text-[#FF8A3D] transition-colors" />
                </Link>

                <Link
                  to="/municipal/departments"
                  className="civic-card p-5 hover:border-[#FF8A3D] transition flex items-center justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#17191C] text-[#FF8A3D] flex items-center justify-center border border-[#292D32] mb-3">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#202226] group-hover:text-[#FF8A3D] transition-colors">
                      Departments
                    </h4>
                    <p className="text-xs text-[#747982] mt-0.5">9 divisions &amp; personnel</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747982] group-hover:text-[#FF8A3D] transition-colors" />
                </Link>

                <Link
                  to="/municipal/issues"
                  className="civic-card p-5 hover:border-[#FF8A3D] transition flex items-center justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#17191C] text-[#FF8A3D] flex items-center justify-center border border-[#292D32] mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-sm text-[#202226] group-hover:text-[#FF8A3D] transition-colors">
                      All Complaints
                    </h4>
                    <p className="text-xs text-[#747982] mt-0.5">Search, filter &amp; override</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#747982] group-hover:text-[#FF8A3D] transition-colors" />
                </Link>
              </div>

              {/* Breakdown Grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Complaints by Department */}
                <div className="civic-card p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E4E7]">
                    <h3 className="font-bold text-sm text-[#202226]">Complaints by Department</h3>
                    <span className="text-xs font-semibold text-[#747982]">{departments.length} Divisions</span>
                  </div>
                  <div className="space-y-3">
                    {stats?.byDepartment && Object.entries(stats.byDepartment).map(([dept, count]) => {
                      const total = adminStats.total || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={dept}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-[#202226] truncate pr-2">{dept}</span>
                            <span className="font-bold text-[#202226] shrink-0">{count} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-[#F4F5F6] rounded-full h-2 overflow-hidden border border-[#E2E4E7]">
                            <div
                              className="h-full rounded-full bg-[#FF8A3D] transition-all"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Complaints by Category */}
                <div className="civic-card p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E4E7]">
                    <h3 className="font-bold text-sm text-[#202226]">Complaints by Category</h3>
                    <span className="text-xs font-semibold text-[#747982]">Distribution</span>
                  </div>
                  <div className="space-y-3">
                    {stats?.byCategory && Object.entries(stats.byCategory).slice(0, 6).map(([cat, count]) => {
                      const total = adminStats.total || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-[#202226] truncate pr-2">{cat}</span>
                            <span className="font-bold text-[#202226] shrink-0">{count}</span>
                          </div>
                          <div className="w-full bg-[#F4F5F6] rounded-full h-2 overflow-hidden border border-[#E2E4E7]">
                            <div
                              className="h-full rounded-full bg-[#292D32] transition-all"
                              style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent City Complaints Table */}
              <div className="civic-card overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[#E2E4E7] flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#202226]">Recent City Complaints</h3>
                    <p className="text-xs text-[#747982]">Live complaints lodged across all municipal districts</p>
                  </div>
                  <Link
                    to="/municipal/issues"
                    className="text-xs font-bold text-[#FF8A3D] hover:text-[#F37B2B] inline-flex items-center gap-1"
                  >
                    <span>View Full Registry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="responsive-table-container">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-[#F4F5F6] border-b border-[#E2E4E7] text-[11px] font-bold uppercase tracking-wider text-[#747982]">
                      <tr>
                        <th className="px-5 py-3">ID / Title</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Location</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E7] bg-white">
                      {issues.slice(0, 6).map(issue => (
                        <tr key={issue.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-[#202226] truncate max-w-xs">{issue.title}</p>
                            <p className="font-mono text-[10px] text-[#747982] mt-0.5">{issue.id}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#202226] font-medium">
                            {getDeptName(issue.assignedDepartmentId || issue.recommendedDepartmentId)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#747982] truncate max-w-xs">
                            {issue.address || 'GPS Coordinates'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge-status text-[11px] ${getPriorityBadge(issue.priority)}`}>
                              {issue.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge-status text-[11px] ${getStatusBadge(issue.status)}`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              to={`/municipal/issues/${issue.id}`}
                              className="btn-white-outline text-xs py-1 px-2.5 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ==============================================================
               OFFICER DASHBOARD VIEW (Department-Scoped)
               ============================================================== */
            <div className="space-y-6 sm:space-y-8">
              {/* Department Officer Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="civic-card p-4 relative overflow-hidden">
                  <p className="text-[10px] text-[#747982] font-bold uppercase tracking-wider">Dept Reports</p>
                  <p className="text-2xl font-black text-[#202226] mt-1">{officerStats.total}</p>
                  <p className="text-[10px] text-[#747982] mt-0.5 truncate">{officerDeptName}</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#17191C]"></div>
                </div>

                <div className="civic-card p-4 relative overflow-hidden">
                  <p className="text-[10px] text-[#747982] font-bold uppercase tracking-wider">Pending Ack</p>
                  <p className="text-2xl font-black text-[#F4B740] mt-1">{officerStats.pendingAck}</p>
                  <p className="text-[10px] text-[#747982] mt-0.5">Need inspection</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#F4B740]"></div>
                </div>

                <div className="civic-card p-4 relative overflow-hidden">
                  <p className="text-[10px] text-[#747982] font-bold uppercase tracking-wider">Assigned</p>
                  <p className="text-2xl font-black text-[#292D32] mt-1">{officerStats.assigned}</p>
                  <p className="text-[10px] text-[#747982] mt-0.5">Worker assigned</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#292D32]"></div>
                </div>

                <div className="civic-card p-4 relative overflow-hidden">
                  <p className="text-[10px] text-[#747982] font-bold uppercase tracking-wider">In Progress</p>
                  <p className="text-2xl font-black text-[#FF8A3D] mt-1">{officerStats.inProgress}</p>
                  <p className="text-[10px] text-[#747982] mt-0.5">Active field work</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF8A3D]"></div>
                </div>

                <div className="civic-card p-4 relative overflow-hidden">
                  <p className="text-[10px] text-[#747982] font-bold uppercase tracking-wider">Resolved</p>
                  <p className="text-2xl font-black text-[#20A779] mt-1">{officerStats.resolved}</p>
                  <p className="text-[10px] text-[#747982] mt-0.5">Completed</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#20A779]"></div>
                </div>

                <div className="civic-card p-4 relative overflow-hidden">
                  <p className="text-[10px] text-[#747982] font-bold uppercase tracking-wider">Urgent &amp; High</p>
                  <p className="text-2xl font-black text-[#E45757] mt-1">{officerStats.highPriority}</p>
                  <p className="text-[10px] text-[#747982] mt-0.5">High priority</p>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#E45757]"></div>
                </div>
              </div>

              {/* Department Complaints List */}
              <div className="civic-card overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-[#E2E4E7] flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#202226]">Department Queue</h3>
                    <p className="text-xs text-[#747982]">Assigned issues under {officerDeptName}</p>
                  </div>
                  <Link
                    to="/municipal/issues"
                    className="text-xs font-bold text-[#FF8A3D] hover:text-[#F37B2B] inline-flex items-center gap-1"
                  >
                    <span>Manage All</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="responsive-table-container">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-[#F4F5F6] border-b border-[#E2E4E7] text-[11px] font-bold uppercase tracking-wider text-[#747982]">
                      <tr>
                        <th className="px-5 py-3">ID / Title</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Location</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E7] bg-white">
                      {issues.map(issue => (
                        <tr key={issue.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-[#202226] truncate max-w-xs">{issue.title}</p>
                            <p className="font-mono text-[10px] text-[#747982] mt-0.5">{issue.id}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#202226] font-medium">
                            {issue.category}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#747982] truncate max-w-xs">
                            {issue.address || 'GPS Coordinates'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge-status text-[11px] ${getPriorityBadge(issue.priority)}`}>
                              {issue.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge-status text-[11px] ${getStatusBadge(issue.status)}`}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              to={`/municipal/issues/${issue.id}`}
                              className="btn-white-outline text-xs py-1 px-2.5 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MunicipalDashboard;
