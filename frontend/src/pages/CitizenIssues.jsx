import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { Search, PlusCircle, FileText, ChevronRight, Filter } from 'lucide-react';

const getStatusBadge = (status) => {
  const map = {
    SUBMITTED: 'badge-submitted',
    ACKNOWLEDGED: 'badge-acknowledged',
    ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-in-progress',
    RESOLVED: 'badge-resolved',
    VERIFIED: 'badge-verified',
    CLOSED: 'badge-closed',
    REOPENED: 'badge-reopened',
  };
  return map[status] || 'badge-assigned';
};

const CitizenIssues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await api.get('/issues/my-issues');
        setIssues(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load issues:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      (issue.title && issue.title.toLowerCase().includes(term)) ||
      (issue.id && issue.id.toLowerCase().includes(term)) ||
      (issue.category && issue.category.toLowerCase().includes(term)) ||
      (issue.address && issue.address.toLowerCase().includes(term));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D]">
                My Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight">
              My Complaints
            </h1>
            <p className="text-xs sm:text-sm text-[#747982] mt-0.5">
              Review, filter, and inspect the resolution timeline for all your reported issues.
            </p>
          </div>

          <Link
            to="/citizen/report"
            className="btn-orange-primary w-full sm:w-auto shadow-sm text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="civic-card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#747982] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, ID, category, or address..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input-clean pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#747982] shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="form-input-clean sm:w-48 bg-white"
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
        </div>

        {/* Complaints Table & List */}
        <div className="civic-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#747982] text-sm">Loading complaints...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="p-12 text-center text-[#747982]">
              <div className="w-12 h-12 rounded-xl bg-[#F4F5F6] text-[#747982] flex items-center justify-center mx-auto mb-3 border border-[#E2E4E7]">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-[#202226] mb-1">No matching complaints found</p>
              <p className="text-xs text-[#747982]">Try adjusting your search criteria or report a new issue.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block responsive-table-container">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F4F5F6] border-b border-[#E2E4E7] text-[11px] font-bold uppercase tracking-wider text-[#747982]">
                    <tr>
                      <th className="px-6 py-3.5">ID / Title</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Location</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E4E7] bg-white">
                    {filteredIssues.map(issue => (
                      <tr key={issue.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[#202226] truncate max-w-xs">{issue.title}</p>
                          <p className="font-mono text-[10px] text-[#747982] mt-0.5">{issue.id}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-[#202226]">
                          {issue.category}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#747982] truncate max-w-xs">
                          {issue.address || 'GPS Coordinates'}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#747982]">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge-status ${getStatusBadge(issue.status)}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/citizen/issues/${issue.id}`}
                            className="btn-white-outline text-xs py-1.5 px-3 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-[#E2E4E7]">
                {filteredIssues.map(issue => (
                  <Link
                    key={issue.id}
                    to={`/citizen/issues/${issue.id}`}
                    className="block p-4 hover:bg-[#F4F5F6]/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-[10px] text-[#747982] block mb-0.5">{issue.id}</span>
                        <h3 className="font-bold text-sm text-[#202226] truncate">{issue.title}</h3>
                      </div>
                      <span className={`badge-status shrink-0 ${getStatusBadge(issue.status)}`}>
                        {issue.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-[#747982] pt-1">
                      <span>{issue.category}</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CitizenIssues;
