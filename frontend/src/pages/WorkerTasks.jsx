import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { AuthContext } from '../context/AuthContext';
import { Map, CheckSquare, Play, ChevronRight, FileText } from 'lucide-react';

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

const WorkerTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState({});
  const { user } = useContext(AuthContext);

  const fetchTasks = async () => {
    try {
      const [resIssues, resDepts] = await Promise.all([
        api.get('/issues/all'),
        api.get('/departments').catch(() => ({ data: [] }))
      ]);
      setTasks(Array.isArray(resIssues.data) ? resIssues.data : []);
      const dMap = {};
      if (resDepts.data) {
        resDepts.data.forEach(d => { dMap[d.id] = d.name; });
      }
      setDepartments(dMap);
    } catch (err) {
      console.error('Failed to load worker tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartWork = async (taskId) => {
    setActionLoading(prev => ({ ...prev, [taskId]: true }));
    try {
      await api.post(`/issues/${taskId}/status`, { status: 'IN_PROGRESS', remarks: 'Worker started work on task' });
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(t.status);
    return t.status === filter;
  });

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav title="Field Worker Operations" breadcrumb="My Tasks" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D] block mb-0.5">
                Field Dispatch
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                My Assigned Work Orders
              </h1>
              <p className="text-xs text-[#747982] mt-0.5">
                Review assigned site locations, update field progress, and upload repair completion proofs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Link
                to="/municipal/map"
                className="btn-graphite-secondary text-xs py-2 px-3.5"
              >
                <Map className="w-3.5 h-3.5 text-[#FF8A3D]" />
                <span>Open Task Map</span>
              </Link>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E4E7]">
                <button
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filter === 'ALL' ? 'bg-[#17191C] text-white shadow-2xs' : 'text-[#747982] hover:text-[#202226]'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filter === 'ACTIVE' ? 'bg-[#FF8A3D] text-white shadow-2xs' : 'text-[#747982] hover:text-[#202226]'
                  }`}
                >
                  Active ({tasks.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(t.status)).length})
                </button>
                <button
                  onClick={() => setFilter('RESOLVED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    filter === 'RESOLVED' ? 'bg-[#20A779] text-white shadow-2xs' : 'text-[#747982] hover:text-[#202226]'
                  }`}
                >
                  Resolved ({tasks.filter(t => t.status === 'RESOLVED').length})
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="civic-card overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[#747982] text-sm">
                Loading assigned tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-[#747982]">
                <div className="w-12 h-12 rounded-xl bg-[#F4F5F6] text-[#747982] flex items-center justify-center mx-auto mb-3 border border-[#E2E4E7]">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-[#202226] mb-1">No tasks in this view</p>
                <p className="text-xs text-[#747982]">New field tasks dispatched to your account will appear here.</p>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block responsive-table-container">
                  <table className="w-full text-left text-sm min-w-[760px]">
                    <thead className="bg-[#F4F5F6] border-b border-[#E2E4E7] text-[11px] font-bold uppercase tracking-wider text-[#747982]">
                      <tr>
                        <th className="px-5 py-3">Task ID / Title</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3">Site Location</th>
                        <th className="px-5 py-3">Priority</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E4E7] bg-white">
                      {filteredTasks.map(task => (
                        <tr key={task.id} className="hover:bg-[#F4F5F6]/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-[#202226] truncate max-w-xs">{task.title}</p>
                            <p className="font-mono text-[10px] text-[#747982] mt-0.5">{task.id}</p>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#202226] font-medium">
                            {task.category}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#747982] truncate max-w-[180px]">
                            {task.address || 'GPS Coordinates'}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge-status text-[11px] ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`badge-status text-[11px] ${getStatusBadge(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2">
                            {(task.status === 'ASSIGNED' || task.status === 'REOPENED') && (
                              <button
                                onClick={() => handleStartWork(task.id)}
                                disabled={actionLoading[task.id]}
                                className="btn-orange-primary text-xs py-1.5 px-3 shadow-none inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3" />
                                <span>{actionLoading[task.id] ? 'Starting...' : 'Start Work'}</span>
                              </button>
                            )}
                            <Link
                              to={`/municipal/issues/${task.id}`}
                              className="btn-white-outline text-xs py-1.5 px-3 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                            >
                              Manage Task
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-[#E2E4E7]">
                  {filteredTasks.map(task => (
                    <div key={task.id} className="p-4 hover:bg-[#F4F5F6]/70 transition-colors space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-[#747982] block mb-0.5">{task.id}</span>
                          <h3 className="font-bold text-sm text-[#202226] truncate">{task.title}</h3>
                        </div>
                        <span className={`badge-status text-[10px] shrink-0 ${getStatusBadge(task.status)}`}>
                          {task.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#747982]">
                        <span className="font-medium text-[#202226]">{task.category}</span>
                        <span>&bull;</span>
                        <span className={`badge-status text-[10px] ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.address && (
                        <p className="text-xs text-[#747982] truncate">{task.address}</p>
                      )}

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E2E4E7]">
                        {(task.status === 'ASSIGNED' || task.status === 'REOPENED') && (
                          <button
                            onClick={() => handleStartWork(task.id)}
                            disabled={actionLoading[task.id]}
                            className="btn-orange-primary text-xs py-1.5 px-3 shadow-none"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start Work</span>
                          </button>
                        )}
                        <Link
                          to={`/municipal/issues/${task.id}`}
                          className="btn-white-outline text-xs py-1.5 px-3"
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerTasks;
