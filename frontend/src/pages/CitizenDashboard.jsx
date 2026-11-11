import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, FileText, Clock, CheckCircle2, AlertCircle, ChevronRight, ArrowRight } from 'lucide-react';

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

const CitizenDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await api.get('/issues/my-issues');
        setIssues(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load citizen issues:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const stats = {
    total: issues.length,
    submitted: issues.filter(i => i.status === 'SUBMITTED' || i.status === 'ACKNOWLEDGED').length,
    inProgress: issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length,
    resolved: issues.filter(i => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)).length,
  };

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D]">
                Citizen Portal
              </span>
              {user && (
                <span className="text-xs text-[#747982]">&bull; Welcome back, {user.name}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight">
              Citizen Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#747982] mt-0.5">
              Overview of your reported civic issues and active resolution timelines.
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

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mb-8">
          {/* Total */}
          <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] sm:text-xs text-[#747982] font-bold uppercase tracking-wider">
                Total Complaints
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#F4F5F6] flex items-center justify-center text-[#202226] border border-[#E2E4E7]">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#202226] tracking-tight">{stats.total}</p>
            <p className="text-[11px] text-[#747982] mt-1">Lodged by your account</p>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#292D32]"></div>
          </div>

          {/* Pending Triage */}
          <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] sm:text-xs text-[#747982] font-bold uppercase tracking-wider">
                Pending Triage
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#F4B740]/10 flex items-center justify-center text-[#F4B740] border border-[#F4B740]/25">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#202226] tracking-tight">{stats.submitted}</p>
            <p className="text-[11px] text-[#747982] mt-1">Submitted or acknowledged</p>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#F4B740]"></div>
          </div>

          {/* In Progress */}
          <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] sm:text-xs text-[#747982] font-bold uppercase tracking-wider">
                In Progress
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#FF8A3D]/10 flex items-center justify-center text-[#FF8A3D] border border-[#FF8A3D]/25">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#FF8A3D] tracking-tight">{stats.inProgress}</p>
            <p className="text-[11px] text-[#747982] mt-1">Under active field repair</p>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF8A3D]"></div>
          </div>

          {/* Resolved */}
          <div className="civic-card p-4 sm:p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] sm:text-xs text-[#747982] font-bold uppercase tracking-wider">
                Resolved
              </p>
              <div className="w-8 h-8 rounded-lg bg-[#20A779]/10 flex items-center justify-center text-[#20A779] border border-[#20A779]/25">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#20A779] tracking-tight">{stats.resolved}</p>
            <p className="text-[11px] text-[#747982] mt-1">Completed &amp; closed</p>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#20A779]"></div>
          </div>
        </div>

        {/* Recent Complaints Section */}
        <div className="civic-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#E2E4E7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#202226]">Recent Complaints</h2>
              <p className="text-xs text-[#747982]">Your latest civic submissions and their current workflow states</p>
            </div>
            <Link
              to="/citizen/issues"
              className="text-xs font-bold text-[#FF8A3D] hover:text-[#F37B2B] inline-flex items-center gap-1 transition"
            >
              <span>View all complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-10 text-center text-[#747982] text-sm">
              Loading complaints...
            </div>
          ) : issues.length === 0 ? (
            <div className="p-10 text-center text-[#747982]">
              <div className="w-12 h-12 rounded-xl bg-[#F4F5F6] text-[#747982] flex items-center justify-center mx-auto mb-3 border border-[#E2E4E7]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-[#202226] text-sm mb-1">No complaints lodged yet</h3>
              <p className="text-xs text-[#747982] mb-4">Notice a pothole, broken streetlight, or garbage overflow?</p>
              <Link to="/citizen/report" className="btn-orange-primary text-xs py-2 px-4 shadow-sm">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report your first issue</span>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E4E7]">
              {issues.slice(0, 5).map(issue => (
                <li key={issue.id}>
                  <Link
                    to={`/citizen/issues/${issue.id}`}
                    className="block hover:bg-[#F4F5F6]/70 px-4 py-3.5 sm:px-6 sm:py-4 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-[#202226] group-hover:text-[#FF8A3D] transition-colors truncate">
                            {issue.title}
                          </p>
                          <span className="font-mono text-[10px] text-[#747982] bg-[#F4F5F6] px-1.5 py-0.5 rounded border border-[#E2E4E7]">
                            {issue.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#747982]">
                          <span className="font-medium text-[#202226]">{issue.category}</span>
                          <span>&bull;</span>
                          <span className="truncate">{issue.address || 'Location provided via GPS'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`badge-status ${getStatusBadge(issue.status)}`}>
                          {issue.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#747982] group-hover:text-[#FF8A3D] transition-colors hidden sm:block" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default CitizenDashboard;
