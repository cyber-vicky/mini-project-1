import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { resolveMediaUrl } from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { AuthContext } from '../context/AuthContext';
import {
  CheckCircle2,
  AlertTriangle,
  Brain,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  UploadCloud,
  Layers,
  MessageSquare,
  Sparkles,
  CheckSquare,
  Trash2,
  Loader2
} from 'lucide-react';

const statusOptions = ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED', 'CLOSED'];

const getStatusBadge = (s) => {
  const m = {
    SUBMITTED: 'badge-submitted',
    ACKNOWLEDGED: 'badge-acknowledged',
    ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-in-progress',
    RESOLVED: 'badge-resolved',
    VERIFIED: 'badge-verified',
    CLOSED: 'badge-closed',
    REOPENED: 'badge-reopened',
  };
  return m[s] || 'badge-assigned';
};

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

const MunicipalIssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [newRemark, setNewRemark] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  // Assignment fields
  const [assignDept, setAssignDept] = useState('');
  const [assignOfficer, setAssignOfficer] = useState('');
  const [assignWorker, setAssignWorker] = useState('');

  // Status update
  const [status, setStatus] = useState('');
  const [proof, setProof] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [addingRemark, setAddingRemark] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { user } = useContext(AuthContext);

  const refreshIssue = async () => {
    const res = await api.get(`/issues/${id}`);
    setIssue(res.data);
    setStatus(res.data.status);
    return res.data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const issueData = await refreshIssue();

        if (user.role === 'ADMIN' || user.role === 'OFFICER') {
          const deptRes = await api.get('/departments');
          setDepartments(deptRes.data);

          // Pre-load members for currently assigned dept
          const deptId = issueData.assignedDepartmentId || issueData.recommendedDepartmentId;
          if (deptId) {
            setAssignDept(deptId);
            const membersRes = await api.get(`/departments/${deptId}/members`);
            setMembers(membersRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load issue:', err);
        setActionErr('Failed to load issue details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user.role]);

  const handleDeptChange = async (deptId) => {
    setAssignDept(deptId);
    setAssignOfficer('');
    setAssignWorker('');
    setMembers([]);
    if (deptId) {
      try {
        const res = await api.get(`/departments/${deptId}/members`);
        setMembers(res.data);
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setActionMsg('');
    setActionErr('');
    try {
      const formData = new FormData();
      formData.append('status', status);
      if (remarks) formData.append('remarks', remarks);
      if (proof) {
        for (let i = 0; i < proof.length; i++) formData.append('proof', proof[i]);
      }
      await api.post(`/issues/${id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setActionMsg('Status updated successfully.');
      setRemarks('');
      setProof(null);
      await refreshIssue();
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    setActionMsg('');
    setActionErr('');
    try {
      const body = {};
      if (assignDept) body.departmentId = assignDept;
      if (assignOfficer) body.officerId = assignOfficer;
      if (assignWorker) body.workerId = assignWorker;

      await api.post(`/issues/${id}/assign`, body);
      setActionMsg('Assignment updated successfully. Status set to ASSIGNED.');
      await refreshIssue();
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Failed to assign.');
    } finally {
      setAssigning(false);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;
    setAddingRemark(true);
    try {
      await api.post(`/issues/${id}/remarks`, { remark: newRemark });
      setNewRemark('');
      setActionMsg('Remark added.');
      await refreshIssue();
    } catch (err) {
      setActionErr('Failed to add remark.');
    } finally {
      setAddingRemark(false);
    }
  };

  const handleDeleteIssue = async () => {
    setDeleting(true);
    setActionErr('');
    try {
      await api.delete(`/issues/${id}`);
      navigate('/municipal/issues', {
        replace: true,
        state: { message: `Complaint "${issue.title}" has been deleted successfully.` }
      });
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Failed to delete complaint.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const officers = members.filter(m => m.role === 'OFFICER');
  const workers = members.filter(m => m.role === 'WORKER');

  if (loading) {
    return (
      <div className="municipal-layout bg-[#F4F5F6]">
        <MunicipalSidebar />
        <div className="municipal-main p-8 text-center text-[#747982] text-sm">
          Loading complaint details...
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="municipal-layout bg-[#F4F5F6]">
        <MunicipalSidebar />
        <div className="municipal-main p-8 text-center text-[#E45757]">
          Issue not found.
        </div>
      </div>
    );
  }

  return (
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav title="Complaint Inspection &amp; Triage" breadcrumb="Issue Details" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Back link */}
          <div>
            <Link
              to={user.role === 'WORKER' ? "/municipal/tasks" : "/municipal/issues"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {user.role === 'WORKER' ? 'My Tasks' : 'All Complaints'}</span>
            </Link>
          </div>

          {/* Header Title & Badge */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#E2E4E7]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[10px] font-bold text-[#747982] bg-white px-2 py-0.5 rounded border border-[#E2E4E7]">
                  {issue.id}
                </span>
                <span className={`badge-status text-[11px] ${getPriorityBadge(issue.priority)}`}>
                  {issue.priority} Priority
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] break-words tracking-tight">
                {issue.title}
              </h1>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className={`badge-status text-xs ${getStatusBadge(issue.status)}`}>
                {issue.status}
              </span>
              {(user?.role === 'ADMIN' || user?.role === 'OFFICER') && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-white-outline text-xs py-1.5 px-3 border-red-200 text-[#E45757] hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Delete Complaint"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Complaint</span>
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {actionMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#20A779] text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionMsg}</span>
            </div>
          )}
          {actionErr && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#E45757] text-xs sm:text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionErr}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Complaint Info & Workflow Panels */}
            <div className="lg:col-span-2 space-y-6">
              {/* Complaint Overview Card */}
              <div className="civic-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E4E7]">
                  <h2 className="text-sm sm:text-base font-bold text-[#202226]">Incident Specifications</h2>
                  <span className="text-xs text-[#747982] font-semibold">{issue.category}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F4F5F6] p-4 rounded-xl border border-[#E2E4E7]">
                  <div>
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Category</span>
                    <span className="font-bold text-[#202226]">{issue.category}</span>
                  </div>
                  <div>
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Lodged Date</span>
                    <span className="font-semibold text-[#202226]">{new Date(issue.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Location</span>
                    <span className="font-semibold text-[#202226] break-words">
                      {issue.address || 'Address not specified'}
                      {issue.latitude ? ` (${issue.latitude}, ${issue.longitude})` : ''}
                    </span>
                  </div>
                  {issue.assignedDepartmentId && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Assigned Department</span>
                      <span className="font-semibold text-[#202226]">{issue.assignedDepartmentId}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#747982] mb-1.5">Citizen Description</h3>
                  <div className="bg-[#F4F5F6] p-4 rounded-xl border border-[#E2E4E7] text-xs sm:text-sm text-[#202226] leading-relaxed whitespace-pre-wrap">
                    {issue.description}
                  </div>
                </div>
              </div>

              {/* Citizen Media Photos */}
              {issue.media && issue.media.length > 0 && (
                <div className="civic-card p-5 sm:p-6">
                  <h2 className="text-sm sm:text-base font-bold text-[#202226] mb-3 pb-2 border-b border-[#E2E4E7]">
                    Citizen Attached Photos ({issue.media.length})
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {issue.media.map((p, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden border border-[#E2E4E7] bg-black aspect-video">
                        <img src={resolveMediaUrl(p)} alt="Citizen evidence" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Proof */}
              {issue.resolutionProof && issue.resolutionProof.length > 0 && (
                <div className="civic-card p-5 sm:p-6 bg-emerald-50/50 border-emerald-200">
                  <h2 className="text-sm sm:text-base font-bold text-[#20A779] mb-3 pb-2 border-b border-emerald-200">
                    Field Resolution Evidence
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {issue.resolutionProof.map((p, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden border border-emerald-300 bg-black aspect-video">
                        <img src={resolveMediaUrl(p)} alt="Worker resolution proof" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Status Panel */}
              <div className="civic-card p-5 sm:p-6 space-y-4">
                <div className="pb-3 border-b border-[#E2E4E7] flex justify-between items-center">
                  <h2 className="text-sm sm:text-base font-bold text-[#202226]">Update Complaint Status</h2>
                  <span className="text-xs text-[#747982]">Workflow Controller</span>
                </div>

                {user.role === 'WORKER' ? (
                  /* Worker action buttons */
                  <div className="space-y-4">
                    {(issue.status === 'ASSIGNED' || issue.status === 'REOPENED') && (
                      <div className="p-4 bg-[#FFF3EB] border border-[#FF8A3D]/40 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-[#202226]">Ready to start field repair on this task?</p>
                        <button
                          id="start-work-btn"
                          onClick={async () => {
                            setStatus('IN_PROGRESS');
                            setUpdating(true);
                            try {
                              await api.post(`/issues/${id}/status`, { status: 'IN_PROGRESS', remarks: 'Worker started work on task' });
                              setActionMsg('Work started! Status is now IN_PROGRESS.');
                              await refreshIssue();
                            } catch (err) {
                              setActionErr(err.response?.data?.message || 'Failed to start work');
                            } finally {
                              setUpdating(false);
                            }
                          }}
                          disabled={updating}
                          className="btn-orange-primary text-xs py-2 px-4 shadow-sm"
                        >
                          {updating ? 'Starting...' : 'Start Work (Set to IN_PROGRESS)'}
                        </button>
                      </div>
                    )}

                    {issue.status === 'IN_PROGRESS' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                        <h3 className="font-bold text-[#20A779] text-xs uppercase tracking-wider">
                          Complete &amp; Resolve Task
                        </h3>
                        <div>
                          <label className="block text-xs font-semibold text-[#202226] mb-1">
                            Resolution Proof (Upload After-Repair Photos)
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => setProof(e.target.files)}
                            className="form-input-clean text-xs py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#202226] mb-1">
                            Resolution Remarks <span className="text-[#E45757]">*</span>
                          </label>
                          <textarea
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Describe the repair actions taken to resolve this civic complaint..."
                            className="form-input-clean"
                            rows="2"
                          />
                        </div>
                        <button
                          id="resolve-task-btn"
                          onClick={async () => {
                            if (!remarks.trim()) {
                              return setActionErr('Please add resolution remarks describing the repair work completed.');
                            }
                            setUpdating(true);
                            setActionErr('');
                            try {
                              const formData = new FormData();
                              formData.append('status', 'RESOLVED');
                              formData.append('remarks', remarks);
                              if (proof) {
                                for (let i = 0; i < proof.length; i++) formData.append('proof', proof[i]);
                              }
                              await api.post(`/issues/${id}/status`, formData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              });
                              setActionMsg('Task marked as RESOLVED! Notification sent to citizen for resolution confirmation.');
                              setRemarks('');
                              setProof(null);
                              await refreshIssue();
                            } catch (err) {
                              setActionErr(err.response?.data?.message || 'Failed to resolve task.');
                            } finally {
                              setUpdating(false);
                            }
                          }}
                          disabled={updating}
                          className="btn-orange-primary text-xs py-2.5 px-4 shadow-sm"
                        >
                          {updating ? 'Submitting...' : <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark as RESOLVED</span>
                          </>}
                        </button>
                      </div>
                    )}

                    {['RESOLVED', 'CLOSED', 'VERIFIED'].includes(issue.status) && (
                      <div className="p-4 bg-[#F4F5F6] border border-[#E2E4E7] rounded-xl text-xs text-[#747982]">
                        This task is currently <strong className="text-[#202226]">{issue.status}</strong>. No further worker action is pending.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Admin & Officer status update controls */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#202226] mb-1.5">New Workflow Status</label>
                      <select
                        id="status-select"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="form-input-clean bg-white text-xs"
                      >
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#202226] mb-1.5">Status Transition Remarks</label>
                      <textarea
                        id="status-remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add inspection notes or justification for status change..."
                        className="form-input-clean text-xs"
                        rows="2"
                      />
                    </div>

                    {status === 'RESOLVED' && (
                      <div>
                        <label className="block text-xs font-semibold text-[#202226] mb-1.5">Upload Resolution Evidence Photos</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={e => setProof(e.target.files)}
                          className="form-input-clean text-xs"
                        />
                      </div>
                    )}

                    <button
                      id="update-status-btn"
                      onClick={handleUpdateStatus}
                      disabled={updating}
                      className="btn-orange-primary text-xs py-2 px-4 shadow-sm"
                    >
                      {updating ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                )}
              </div>

              {/* Department Assignment Panel — ADMIN or OFFICER */}
              {(user.role === 'ADMIN' || user.role === 'OFFICER') && (
                <div className="civic-card p-5 sm:p-6 space-y-4">
                  <div className="pb-3 border-b border-[#E2E4E7] flex justify-between items-center">
                    <h2 className="text-sm sm:text-base font-bold text-[#202226]">Department &amp; Staff Assignment</h2>
                    <span className="text-xs text-[#747982]">Triage Controls</span>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#202226] mb-1.5">Department</label>
                      <select
                        id="assign-dept"
                        value={assignDept}
                        onChange={(e) => handleDeptChange(e.target.value)}
                        className="form-input-clean bg-white text-xs"
                      >
                        <option value="">Select Department...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>

                    {members.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-[#202226] mb-1.5">Assign Officer (Optional)</label>
                          <select
                            id="assign-officer"
                            value={assignOfficer}
                            onChange={(e) => setAssignOfficer(e.target.value)}
                            className="form-input-clean bg-white text-xs"
                          >
                            <option value="">Select Officer...</option>
                            {officers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.employeeId})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#202226] mb-1.5">Assign Field Worker (Optional)</label>
                          <select
                            id="assign-worker"
                            value={assignWorker}
                            onChange={(e) => setAssignWorker(e.target.value)}
                            className="form-input-clean bg-white text-xs"
                          >
                            <option value="">Select Worker...</option>
                            {workers.map(w => <option key={w.id} value={w.id}>{w.name} ({w.employeeId})</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    <button
                      id="assign-btn"
                      onClick={handleAssign}
                      disabled={assigning || !assignDept}
                      className="btn-graphite-secondary text-xs py-2 px-4 shadow-sm"
                    >
                      {assigning ? 'Assigning...' : 'Save & Set to ASSIGNED'}
                    </button>
                  </div>
                </div>
              )}

              {/* Internal Remarks */}
              <div className="civic-card p-5 sm:p-6 space-y-4">
                <div className="pb-3 border-b border-[#E2E4E7]">
                  <h2 className="text-sm sm:text-base font-bold text-[#202226]">Internal Remarks &amp; Investigation Notes</h2>
                </div>

                {issue.remarks && issue.remarks.length > 0 && (
                  <div className="space-y-2.5 mb-4">
                    {issue.remarks.map((r, idx) => (
                      <div key={idx} className="bg-[#F4F5F6] p-3 rounded-xl border border-[#E2E4E7] text-xs">
                        <div className="flex justify-between items-center text-[#747982] mb-1">
                          <span className="font-bold text-[#202226]">{r.userName || r.userId} ({r.role})</span>
                          <span>{new Date(r.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[#202226] leading-relaxed break-words">{r.remark}</p>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  id="new-remark"
                  value={newRemark}
                  onChange={e => setNewRemark(e.target.value)}
                  placeholder="Record internal inspection notes or field dispatch details..."
                  className="form-input-clean text-xs"
                  rows="2"
                />

                <button
                  id="add-remark-btn"
                  onClick={handleAddRemark}
                  disabled={addingRemark || !newRemark.trim()}
                  className="btn-white-outline text-xs py-2 px-4 hover:border-[#FF8A3D] hover:text-[#FF8A3D]"
                >
                  {addingRemark ? 'Adding...' : 'Add Remark'}
                </button>
              </div>

              {/* Status Timeline History */}
              <div className="civic-card p-5 sm:p-6">
                <h2 className="text-sm sm:text-base font-bold text-[#202226] mb-4 pb-2 border-b border-[#E2E4E7]">
                  Status Transition History
                </h2>

                <div className="space-y-4">
                  {issue.history?.length === 0 ? (
                    <p className="text-xs text-[#747982]">No transition history recorded yet.</p>
                  ) : (
                    issue.history?.map((h, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-[#FF8A3D] ring-4 ring-[#FFF3EB] shrink-0 mt-1"></div>
                          {i !== issue.history.length - 1 && (
                            <div className="w-0.5 h-full bg-[#E2E4E7] my-1"></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#202226]">{h.newStatus}</span>
                            {h.oldStatus && (
                              <span className="text-[11px] text-[#747982]">from {h.oldStatus}</span>
                            )}
                            <span className="text-[11px] text-[#747982]">
                              &bull; {new Date(h.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {h.remarks && (
                            <p className="text-xs text-[#747982] mt-1 bg-[#F4F5F6] p-2.5 rounded-lg border border-[#E2E4E7]">
                              {h.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Danger Zone: Complaint Deletion */}
              {(user?.role === 'ADMIN' || user?.role === 'OFFICER') && (
                <div className="civic-card p-5 sm:p-6 border-red-200 bg-red-50/25 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#E45757] flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        <span>Danger Zone: Delete Citizen Complaint</span>
                      </h3>
                      <p className="text-xs text-[#747982] mt-1">
                        Permanently delete this complaint registered by citizen, along with all associated audit history, internal remarks, and worker tasks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-[#E45757] hover:bg-[#d04545] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Complaint</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 1 Col: Smart AI Panel & Current Assignment */}
            <div className="space-y-6">
              {/* Smart AI Panel */}
              <div className="civic-card p-5 sm:p-6 bg-[#17191C] text-white border-[#292D32]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#292D32]">
                  <Brain className="w-5 h-5 text-[#FF8A3D]" />
                  <h2 className="text-base font-bold text-white">Smart AI Triage</h2>
                </div>

                {issue.classificationResult ? (
                  <div className="space-y-3 text-xs mb-4">
                    <div>
                      <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Classification</span>
                      <p className="font-bold text-white">{issue.classificationResult.category}</p>
                      <p className="text-[#20A779] font-semibold mt-0.5">
                        {issue.classificationResult.confidence ? Math.round(issue.classificationResult.confidence * 100) + '% Confidence Match' : 'N/A'}
                      </p>
                    </div>
                    {issue.classificationResult.matchedKeywords?.length > 0 && (
                      <div>
                        <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Detected Signals</span>
                        <p className="text-[#747982] break-words">{issue.classificationResult.matchedKeywords.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#747982] mb-4">No AI classification metadata stored.</p>
                )}

                {issue.priorityData && (
                  <div className="pt-3 border-t border-[#292D32] space-y-2 text-xs mb-4">
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider">Priority Scoring</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white">Calculated Score</span>
                      <span className="font-bold text-[#FF8A3D]">{issue.priorityData.score}/100</span>
                    </div>
                    {issue.priorityData.factors && (
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#747982] pt-1">
                        <span>Severity: {issue.priorityData.factors.severity}</span>
                        <span>Urgency: {issue.priorityData.factors.urgency}</span>
                        <span>Impact: {issue.priorityData.factors.publicImpact}</span>
                        <span>Nearby: {issue.priorityData.factors.nearbyReports}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[#292D32] space-y-1 text-xs mb-4">
                  <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider">Department Routing</span>
                  <p className="text-gray-200">{issue.routingReason || 'Standard category triage'}</p>
                  <p className="text-[11px] text-[#747982]">Recommended Dept ID: {issue.recommendedDepartmentId || 'None'}</p>
                </div>

                <div className="pt-3 border-t border-[#292D32] text-xs">
                  <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-1">Duplicate Deduplication</span>
                  {issue.duplicateInfo?.isDuplicate ? (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-[#E45757]">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Possible Duplicate Found</span>
                      </p>
                      <p className="text-[11px] mt-0.5">Similarity: {issue.duplicateInfo.duplicateScore}%</p>
                    </div>
                  ) : (
                    <p className="text-[#20A779] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>No duplicates detected in vicinity</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Assignment Summary Card */}
              <div className="civic-card p-5 sm:p-6 space-y-3">
                <div className="pb-3 border-b border-[#E2E4E7]">
                  <h2 className="text-sm font-bold text-[#202226]">Current Assignment Summary</h2>
                </div>
                <div className="text-xs space-y-2.5">
                  <div>
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Department</span>
                    <p className="font-semibold text-[#202226]">{issue.assignedDepartmentId || 'Not assigned yet'}</p>
                  </div>
                  <div>
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Assigned Officer</span>
                    <p className="font-semibold text-[#202226]">{issue.assignedOfficerId || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Assigned Field Worker</span>
                    <p className="font-semibold text-[#202226]">{issue.assignedWorkerId || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E4E7]">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E45757] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-[#202226]">Delete Citizen Complaint</h3>
                <p className="text-xs text-[#747982] mt-0.5">
                  Are you sure you want to permanently delete this complaint?
                </p>
              </div>
            </div>

            <div className="bg-[#F4F5F6] p-3.5 rounded-xl border border-[#E2E4E7] mb-4 text-xs space-y-1">
              <p className="font-bold text-[#202226] truncate">{issue.title}</p>
              <p className="font-mono text-[10px] text-[#747982]">ID: {issue.id}</p>
              <p className="text-[#747982]">
                Category: <span className="font-semibold text-[#202226]">{issue.category}</span> &bull; Status: <span className="font-semibold text-[#202226]">{issue.status}</span>
              </p>
            </div>

            <p className="text-xs text-[#E45757] bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4">
              This action cannot be undone. All audit trails, resolution logs, worker assignments, and remarks for this complaint will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="btn-white-outline text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteIssue}
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

export default MunicipalIssueDetails;
