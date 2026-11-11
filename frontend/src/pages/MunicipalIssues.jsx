import React, { useEffect, useState, useContext } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { AuthContext } from '../context/AuthContext';
import { Search, Filter, ArrowUpDown, ChevronRight, FileText, CheckCircle2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

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

const MunicipalIssues = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialSearch = searchParams.get('search') || '';
  const initialDept = searchParams.get('dept') || 'ALL';

  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState(initialDept);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('NEWEST');

  useEffect(() => {
    const deptParam = searchParams.get('dept');
    if (deptParam) {
      setDeptFilter(deptParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Delete modal state
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteErr, setDeleteErr] = useState('');

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (location.state?.message) {
      setDeleteMsg(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resIssues, resDepts] = await Promise.all([
          api.get('/issues/all'),
          api.get('/departments').catch(() => ({ data: [] }))
        ]);
        setIssues(Array.isArray(resIssues.data) ? resIssues.data : []);
        setDepartments(Array.isArray(resDepts.data) ? resDepts.data : []);
      } catch (err) {
        console.error('Failed to load issues:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDeptName = (deptId) => {
    if (!deptId) return 'Unassigned';
    const d = departments.find(item => item.id === deptId);
    return d ? d.name : deptId;
  };

  const handleDeleteComplaint = async () => {
    if (!issueToDelete) return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await api.delete(`/issues/${issueToDelete.id}`);
      setIssues(prev => prev.filter(i => i.id !== issueToDelete.id));
      setDeleteMsg(`Complaint "${issueToDelete.title}" has been deleted successfully.`);
      setIssueToDelete(null);
      setTimeout(() => setDeleteMsg(''), 5000);
    } catch (err) {
      setDeleteErr(err.response?.data?.message || 'Failed to delete complaint. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || issue.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || issue.category === categoryFilter;
    const matchesDept = deptFilter === 'ALL' ||
      issue.assignedDepartmentId === deptFilter ||
      issue.recommendedDepartmentId === deptFilter;

    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (issue.title && issue.title.toLowerCase().includes(term)) ||
      (issue.id && issue.id.toLowerCase().includes(term)) ||
      (issue.category && issue.category.toLowerCase().includes(term)) ||
      (issue.address && issue.address.toLowerCase().includes(term));

    return matchesStatus && matchesPriority && matchesCategory && matchesDept && matchesSearch;
  });

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'NEWEST') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'OLDEST') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'PRIORITY') {
      const pWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0);
    }
    return 0;
  });

  const categories = ['Pothole & Road Damage', 'Water Supply & Leakage', 'Garbage & Sanitation', 'Streetlight Outage', 'Drainage & Sewage', 'Other'];

  const canDelete = user && (user.role === 'ADMIN' || user.role === 'OFFICER');

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav title="Citizen Complaints Management" breadcrumb="Complaints Queue" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D] block mb-0.5">
                Municipal Records
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                All Lodged Complaints
              </h1>
              <p className="text-xs text-[#747982] mt-0.5">
                Inspect, filter, re-assign, manage resolution workflows, or remove registered complaints.
              </p>
            </div>

            <div className="text-xs font-semibold text-[#747982] bg-white px-3 py-1.5 rounded-xl border border-[#E2E4E7]">
              Showing <span className="font-bold text-[#202226]">{sortedIssues.length}</span> of {issues.length} complaints
            </div>
          </div>

          {/* Feedback alerts */}
          {deleteMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#20A779] text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{deleteMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteMsg('')}
                className="text-[#20A779] hover:opacity-75 text-sm font-bold ml-2 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="civic-card p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#747982] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title, ID, category, or address..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="form-input-clean pl-10"
                />
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#747982] shrink-0" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="form-input-clean sm:w-44 text-xs font-semibold bg-white"
                >
                  <option value="NEWEST">Sort: Newest First</option>
                  <option value="OLDEST">Sort: Oldest First</option>
                  <option value="PRIORITY">Sort: Priority (Highest)</option>
                </select>
              </div>
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-[#E2E4E7]">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#747982] mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="form-input-clean text-xs py-1.5 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REOPENED">Reopened</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#747982] mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                  className="form-input-clean text-xs py-1.5 bg-white"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#747982] mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="form-input-clean text-xs py-1.5 bg-white"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#747982] mb-1">Department</label>
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="form-input-clean text-xs py-1.5 bg-white"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table / Cards Container */}
          <div className="civic-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[#747982] text-sm">
                Loading complaints...
              </div>
            ) : sortedIssues.length === 0 ? (
              <div className="p-12 text-center text-[#747982]">
                <div className="w-12 h-12 rounded-xl bg-[#F4F5F6] text-[#747982] flex items-center justify-center mx-auto mb-3 border border-[#E2E4E7]">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-[#202226] mb-1">No matching complaints found</p>
                <p className="text-xs text-[#747982]">Try resetting your filters or search keywords.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block responsive-table-container">
                  <table className="w-full text-left text-sm min-w-[760px]">
                    <thead className="bg-[#F4F5F6] border-b border-[#E2E4E7] text-[11px] font-bold uppercase tracking-wider text-[#747982]">
                      <tr>
                        <th className="px-5 py-3">ID / Title</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Department</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Submitted</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E7] bg-white">
                      {sortedIssues.map(issue => (
                        <tr key={issue.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-[#202226] truncate max-w-xs">{issue.title}</p>
                            <p className="font-mono text-[10px] text-[#747982] mt-0.5">{issue.id}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#202226] font-medium">
                            {issue.category}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#747982] truncate max-w-[150px]">
                            {getDeptName(issue.assignedDepartmentId || issue.recommendedDepartmentId)}
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
                          <td className="px-5 py-3.5 text-xs text-[#747982]">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/municipal/issues/${issue.id}`}
                                className="btn-white-outline text-xs py-1.5 px-3 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                              >
                                Manage
                              </Link>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIssueToDelete(issue);
                                    setDeleteErr('');
                                  }}
                                  className="p-1.5 rounded-lg border border-[#E2E4E7] text-[#747982] hover:text-[#E45757] hover:border-red-200 hover:bg-red-50 transition cursor-pointer"
                                  title="Delete Complaint"
                                  aria-label="Delete Complaint"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-[#E2E4E7]">
                  {sortedIssues.map(issue => (
                    <div key={issue.id} className="p-4 hover:bg-[#F4F5F6]/70 transition-colors space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-[#747982] block mb-0.5">{issue.id}</span>
                          <h3 className="font-bold text-sm text-[#202226] truncate">{issue.title}</h3>
                        </div>
                        <span className={`badge-status shrink-0 text-[11px] ${getStatusBadge(issue.status)}`}>
                          {issue.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs text-[#747982]">
                        <span className="font-medium text-[#202226]">{issue.category}</span>
                        <span>&bull;</span>
                        <span className={`badge-status text-[10px] ${getPriorityBadge(issue.priority)}`}>
                          {issue.priority}
                        </span>
                        <span>&bull;</span>
                        <span className="truncate">{getDeptName(issue.assignedDepartmentId || issue.recommendedDepartmentId)}</span>
                      </div>

                      <div className="pt-2 flex justify-between items-center gap-2">
                        <span className="text-[11px] text-[#747982]">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setIssueToDelete(issue);
                                setDeleteErr('');
                              }}
                              className="p-1.5 rounded-lg border border-red-200 text-[#E45757] hover:bg-red-50 transition cursor-pointer"
                              title="Delete Complaint"
                              aria-label="Delete Complaint"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link
                            to={`/municipal/issues/${issue.id}`}
                            className="btn-orange-primary text-xs py-1 px-3 shadow-none"
                          >
                            Manage Issue
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {issueToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E4E7]">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E45757] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#202226]">Delete Citizen Complaint</h3>
                <p className="text-xs text-[#747982] mt-0.5">
                  Are you sure you want to delete this complaint registered by citizen?
                </p>
              </div>
            </div>

            <div className="bg-[#F4F5F6] p-3.5 rounded-xl border border-[#E2E4E7] mb-4 text-xs space-y-1">
              <p className="font-bold text-[#202226] truncate">{issueToDelete.title}</p>
              <p className="font-mono text-[10px] text-[#747982]">ID: {issueToDelete.id}</p>
              <p className="text-[#747982]">
                Category: <span className="font-semibold text-[#202226]">{issueToDelete.category}</span> &bull; Status: <span className="font-semibold text-[#202226]">{issueToDelete.status}</span>
              </p>
            </div>

            <p className="text-xs text-[#E45757] bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4">
              This action cannot be undone. The complaint, related assignment history, and internal remarks will be permanently deleted.
            </p>

            {deleteErr && (
              <div className="text-xs text-[#E45757] bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4">
                {deleteErr}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setIssueToDelete(null);
                  setDeleteErr('');
                }}
                className="btn-white-outline text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteComplaint}
                className="px-4 py-2 bg-[#E45757] hover:bg-[#d04545] text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete Complaint</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalIssues;
