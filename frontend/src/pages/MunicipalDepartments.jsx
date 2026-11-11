import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import {
  Building2,
  Users,
  FileText,
  CheckCircle2,
  Shield,
  ArrowRight,
  ExternalLink,
  Search,
  X,
  Clock,
  MapPin,
  AlertCircle
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

const MunicipalDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState({});
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected department to view its complaints
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [deptStatusFilter, setDeptStatusFilter] = useState('ALL');
  const [deptPriorityFilter, setDeptPriorityFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, issueRes] = await Promise.all([
          api.get('/departments'),
          api.get('/issues/all'),
        ]);
        setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        setIssues(Array.isArray(issueRes.data) ? issueRes.data : []);

        const memberMap = {};
        await Promise.all(
          (deptRes.data || []).map(async (dept) => {
            try {
              const res = await api.get(`/departments/${dept.id}/members`);
              memberMap[dept.id] = res.data;
            } catch {
              memberMap[dept.id] = [];
            }
          })
        );
        setMembers(memberMap);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDepartmentIssues = (deptId) => {
    return issues.filter(
      i => i.assignedDepartmentId === deptId || i.recommendedDepartmentId === deptId
    );
  };

  const getIssueCount = (deptId) => getDepartmentIssues(deptId).length;

  const getActiveCount = (deptId) =>
    issues.filter(
      i =>
        (i.assignedDepartmentId === deptId || i.recommendedDepartmentId === deptId) &&
        !['RESOLVED', 'CLOSED', 'VERIFIED'].includes(i.status)
    ).length;

  // Selected department filtered issues
  const deptIssues = selectedDept ? getDepartmentIssues(selectedDept.id) : [];
  const deptActiveIssues = deptIssues.filter(i => !['RESOLVED', 'CLOSED', 'VERIFIED'].includes(i.status));
  const deptResolvedIssues = deptIssues.filter(i => ['RESOLVED', 'CLOSED', 'VERIFIED'].includes(i.status));

  const filteredDeptIssues = deptIssues.filter(issue => {
    if (deptStatusFilter === 'ACTIVE') {
      if (['RESOLVED', 'CLOSED', 'VERIFIED'].includes(issue.status)) return false;
    } else if (deptStatusFilter !== 'ALL' && issue.status !== deptStatusFilter) {
      return false;
    }

    if (deptPriorityFilter !== 'ALL' && issue.priority !== deptPriorityFilter) {
      return false;
    }

    if (deptSearch.trim()) {
      const q = deptSearch.toLowerCase().trim();
      const matchTitle = issue.title && issue.title.toLowerCase().includes(q);
      const matchId = issue.id && issue.id.toLowerCase().includes(q);
      const matchAddr = issue.address && issue.address.toLowerCase().includes(q);
      const matchDesc = issue.description && issue.description.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchAddr && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav title="Municipal Division Directory" breadcrumb="Departments" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D] block mb-0.5">
                Administrative Infrastructure
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                Municipal Departments &amp; Complaints
              </h1>
              <p className="text-xs text-[#747982] mt-0.5">
                Click any department to inspect all complaints, active caseloads, and staff personnel.
              </p>
            </div>

            <div className="text-xs font-semibold text-[#747982] bg-white px-3 py-1.5 rounded-xl border border-[#E2E4E7]">
              <span>{departments.length} Municipal Departments</span>
            </div>
          </div>

          {loading ? (
            <div className="civic-card p-12 text-center text-[#747982] text-sm">
              Loading department directory and active complaints...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {departments.map(dept => {
                const deptMembers = members[dept.id] || [];
                const officers = deptMembers.filter(m => m.role === 'OFFICER');
                const workers = deptMembers.filter(m => m.role === 'WORKER');
                const totalIssues = getIssueCount(dept.id);
                const activeIssues = getActiveCount(dept.id);

                return (
                  <div
                    key={dept.id}
                    onClick={() => {
                      setSelectedDept(dept);
                      setDeptSearch('');
                      setDeptStatusFilter('ALL');
                      setDeptPriorityFilter('ALL');
                    }}
                    className="civic-card p-5 sm:p-6 flex flex-col justify-between hover:border-[#FF8A3D] hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-[#17191C] text-[#FF8A3D] flex items-center justify-center border border-[#292D32] group-hover:bg-[#FF8A3D] group-hover:text-white transition-colors">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="font-mono text-[10px] text-[#747982] bg-[#F4F5F6] px-2 py-0.5 rounded border border-[#E2E4E7]">
                          {dept.id}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-[#202226] mb-1 group-hover:text-[#FF8A3D] transition-colors flex items-center justify-between">
                        <span>{dept.name}</span>
                        <ArrowRight className="w-4 h-4 text-[#747982] group-hover:text-[#FF8A3D] group-hover:translate-x-1 transition-all" />
                      </h2>
                      <p className="text-xs text-[#747982] mb-4 leading-relaxed">{dept.description}</p>

                      {/* Workload Stats */}
                      <div className="grid grid-cols-2 gap-2.5 mb-4">
                        <div className="bg-[#F4F5F6] rounded-xl p-2.5 text-center border border-[#E2E4E7] group-hover:bg-white transition-colors">
                          <p className="text-xl font-bold text-[#202226]">{totalIssues}</p>
                          <p className="text-[10px] text-[#747982] font-semibold uppercase">Total Complaints</p>
                        </div>
                        <div className="bg-[#FFF3EB] rounded-xl p-2.5 text-center border border-[#FF8A3D]/30">
                          <p className="text-xl font-bold text-[#FF8A3D]">{activeIssues}</p>
                          <p className="text-[10px] text-[#FF8A3D] font-semibold uppercase">Active Repairs</p>
                        </div>
                      </div>

                      {/* Officers Roster */}
                      <div className="mb-3 pt-3 border-t border-[#E2E4E7]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#747982] mb-1.5 flex items-center justify-between">
                          <span>Officers</span>
                          <span className="bg-[#F4F5F6] px-1.5 py-0.2 rounded text-[9px]">{officers.length}</span>
                        </p>
                        {officers.length === 0 ? (
                          <p className="text-xs text-[#747982] italic">No officers assigned</p>
                        ) : (
                          <ul className="space-y-1">
                            {officers.slice(0, 2).map(o => (
                              <li key={o.id} className="text-xs text-[#202226] flex items-center justify-between py-0.5">
                                <span className="font-medium truncate pr-2">{o.name}</span>
                                <span className="text-[#747982] font-mono text-[11px] shrink-0">{o.employeeId}</span>
                              </li>
                            ))}
                            {officers.length > 2 && (
                              <li className="text-[11px] text-[#747982] italic">+{officers.length - 2} more officers</li>
                            )}
                          </ul>
                        )}
                      </div>

                      {/* Workers Roster */}
                      <div className="pt-2 border-t border-[#E2E4E7]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#747982] mb-1.5 flex items-center justify-between">
                          <span>Field Personnel</span>
                          <span className="bg-[#F4F5F6] px-1.5 py-0.2 rounded text-[9px]">{workers.length}</span>
                        </p>
                        {workers.length === 0 ? (
                          <p className="text-xs text-[#747982] italic">No workers assigned</p>
                        ) : (
                          <ul className="space-y-1">
                            {workers.slice(0, 2).map(w => (
                              <li key={w.id} className="text-xs text-[#202226] flex items-center justify-between py-0.5">
                                <span className="font-medium truncate pr-2">{w.name}</span>
                                <span className="text-[#747982] font-mono text-[11px] shrink-0">{w.employeeId}</span>
                              </li>
                            ))}
                            {workers.length > 2 && (
                              <li className="text-[11px] text-[#747982] italic">+{workers.length - 2} more personnel</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Department Click Action Button */}
                    <div className="pt-3.5 mt-3 border-t border-[#E2E4E7] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDept(dept);
                          setDeptSearch('');
                          setDeptStatusFilter('ALL');
                          setDeptPriorityFilter('ALL');
                        }}
                        className="btn-orange-primary text-xs py-2 px-3 flex-1 flex items-center justify-center gap-1.5 shadow-none"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Complaints ({totalIssues})</span>
                      </button>
                      <Link
                        to={`/municipal/issues?dept=${dept.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-white-outline text-xs p-2 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                        title="Open full complaints queue for this department"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Department Complaints Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E2E4E7] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-[#E2E4E7] flex items-start justify-between gap-4 bg-[#F4F5F6]/60 shrink-0">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#17191C] text-[#FF8A3D] flex items-center justify-center border border-[#292D32] shrink-0 mt-0.5">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-[#747982] bg-white px-2 py-0.5 rounded border border-[#E2E4E7]">
                      {selectedDept.id}
                    </span>
                    <span className="text-xs font-semibold text-[#747982]">Department Complaints Registry</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#202226] tracking-tight truncate">
                    {selectedDept.name}
                  </h2>
                  <p className="text-xs text-[#747982] mt-0.5 line-clamp-1">{selectedDept.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDept(null)}
                className="w-8 h-8 rounded-xl bg-white border border-[#E2E4E7] text-[#747982] hover:text-[#202226] hover:border-[#202226] flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics & Filter Bar */}
            <div className="p-4 sm:px-6 py-3 border-b border-[#E2E4E7] bg-white space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Quick Metrics */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-[#F4F5F6] border border-[#E2E4E7] font-semibold text-[#202226]">
                    Total Complaints: <strong className="font-bold">{deptIssues.length}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FFF3EB] border border-[#FF8A3D]/30 font-semibold text-[#FF8A3D]">
                    Active Repairs: <strong className="font-bold">{deptActiveIssues.length}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-semibold text-[#20A779]">
                    Resolved / Closed: <strong className="font-bold">{deptResolvedIssues.length}</strong>
                  </span>
                </div>

                {/* Direct link to full queue */}
                <Link
                  to={`/municipal/issues?dept=${selectedDept.id}`}
                  className="text-xs font-bold text-[#FF8A3D] hover:text-[#DE6717] inline-flex items-center gap-1 transition self-start sm:self-auto"
                >
                  <span>Open in Full Complaints Queue</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-[#747982] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search complaints in this department by title, address, or ID..."
                    value={deptSearch}
                    onChange={(e) => setDeptSearch(e.target.value)}
                    className="form-input-clean pl-8.5 text-xs py-1.5"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={deptStatusFilter}
                    onChange={(e) => setDeptStatusFilter(e.target.value)}
                    className="form-input-clean text-xs py-1.5 bg-white sm:w-36"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active Repairs</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="CLOSED">Closed</option>
                  </select>

                  <select
                    value={deptPriorityFilter}
                    onChange={(e) => setDeptPriorityFilter(e.target.value)}
                    className="form-input-clean text-xs py-1.5 bg-white sm:w-32"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Complaints List Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-[#F4F5F6]/40">
              {filteredDeptIssues.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E4E7] p-10 text-center text-[#747982]">
                  <div className="w-12 h-12 rounded-xl bg-[#F4F5F6] text-[#747982] flex items-center justify-center mx-auto mb-3 border border-[#E2E4E7]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-[#202226] mb-1">No complaints found</p>
                  <p className="text-xs text-[#747982]">
                    {deptIssues.length === 0
                      ? `No citizen complaints have been registered or routed to ${selectedDept.name} yet.`
                      : 'No complaints match your current search/filter criteria.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDeptIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2E4E7] hover:border-[#D3D6DC] shadow-2xs transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-[10px] text-[#747982] bg-[#F4F5F6] px-1.5 py-0.5 rounded border border-[#E2E4E7]">
                              {issue.id}
                            </span>
                            <span className={`badge-status text-[10px] ${getPriorityBadge(issue.priority)}`}>
                              {issue.priority} Priority
                            </span>
                            <span className={`badge-status text-[10px] ${getStatusBadge(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-[#202226] truncate">{issue.title}</h3>
                        </div>

                        <Link
                          to={`/municipal/issues/${issue.id}`}
                          className="btn-orange-primary text-xs py-1.5 px-3 shrink-0 flex items-center gap-1 shadow-none self-start"
                        >
                          <span>Manage Complaint</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {issue.description && (
                        <p className="text-xs text-[#747982] line-clamp-2 leading-relaxed bg-[#F4F5F6]/60 p-2.5 rounded-lg border border-[#E2E4E7]/60">
                          {issue.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#E2E4E7] text-[11px] text-[#747982]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#FF8A3D]" />
                          <span className="truncate">{issue.address || 'Address not specified'}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Lodged: {new Date(issue.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:px-6 bg-white border-t border-[#E2E4E7] flex items-center justify-between text-xs shrink-0">
              <span className="text-[#747982]">
                Showing <strong>{filteredDeptIssues.length}</strong> of <strong>{deptIssues.length}</strong> complaints for {selectedDept.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedDept(null)}
                className="btn-white-outline text-xs py-1.5 px-4 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalDepartments;
