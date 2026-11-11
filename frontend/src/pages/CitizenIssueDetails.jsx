import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { resolveMediaUrl } from '../services/api';
import Navbar from '../components/Navbar';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Shield,
  Clock,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';

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

const CitizenIssueDetails = () => {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const refreshIssue = async () => {
    const res = await api.get(`/issues/${id}`);
    setIssue(res.data);
  };

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        await refreshIssue();
      } catch (err) {
        console.error('Failed to load issue details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleVerify = async () => {
    setVerifying(true);
    setActionMsg('');
    setActionErr('');
    try {
      await api.post(`/issues/${id}/verify`, { isResolved: true, remarks: 'Verified by citizen' });
      setActionMsg('Thank you! The complaint has been verified and marked as CLOSED.');
      await refreshIssue();
    } catch (err) {
      setActionErr('Failed to verify resolution. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      setActionErr('Please provide a specific reason for reopening the complaint.');
      return;
    }
    setVerifying(true);
    setActionMsg('');
    setActionErr('');
    try {
      await api.post(`/issues/${id}/verify`, { isResolved: false, remarks: reopenReason.trim() });
      setActionMsg('Complaint has been REOPENED. Municipal department will be notified for corrective action.');
      setShowReopenForm(false);
      await refreshIssue();
    } catch (err) {
      setActionErr('Failed to reopen complaint. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F6]">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center text-[#747982] text-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF8A3D] mb-3" />
          <p>Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-[#F4F5F6]">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <div className="civic-card p-8">
            <AlertCircle className="w-10 h-10 text-[#E45757] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-[#202226] mb-1">Complaint Not Found</h2>
            <p className="text-xs text-[#747982] mb-4">The requested civic complaint ID could not be retrieved.</p>
            <Link to="/citizen/issues" className="btn-orange-primary text-xs py-2 px-4">
              Back to Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <Navbar />

      <main className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/citizen/issues"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Complaints</span>
          </Link>
        </div>

        {/* Action feedback alerts */}
        {actionMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#20A779] text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}

        {actionErr && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-[#E45757] text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionErr}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="civic-card p-5 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-5 border-b border-[#E2E4E7]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[10px] font-bold text-[#747982] bg-[#F4F5F6] px-2 py-0.5 rounded border border-[#E2E4E7]">
                  {issue.id}
                </span>
                <span className="text-xs text-[#747982]">&bull;</span>
                <span className="text-xs font-semibold text-[#202226]">{issue.category}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] break-words tracking-tight">
                {issue.title}
              </h1>
            </div>
            <div className="shrink-0">
              <span className={`badge-status text-xs ${getStatusBadge(issue.status)}`}>
                {issue.status}
              </span>
            </div>
          </div>

          {/* Key metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F4F5F6] p-4 rounded-xl border border-[#E2E4E7] text-xs">
            <div>
              <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Priority</span>
              <span className="font-bold text-[#202226]">{issue.priority}</span>
            </div>
            <div>
              <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Reported On</span>
              <span className="font-semibold text-[#202226]">{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Category</span>
              <span className="font-semibold text-[#202226]">{issue.category}</span>
            </div>
            <div>
              <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">GPS Pin</span>
              <span className="font-mono text-[11px] text-[#202226]">
                {issue.latitude ? `${issue.latitude}, ${issue.longitude}` : 'Manual Location'}
              </span>
            </div>
          </div>

          {/* Location detail */}
          <div className="p-3.5 rounded-xl bg-white border border-[#E2E4E7] flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#FF8A3D] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#747982]">Recorded Address</p>
              <p className="text-xs sm:text-sm font-semibold text-[#202226] break-words">
                {issue.address || 'Address provided via device GPS coordinates.'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#747982] mb-2">Description</h2>
            <div className="bg-[#F4F5F6] p-4 rounded-xl border border-[#E2E4E7] text-xs sm:text-sm text-[#202226] whitespace-pre-wrap leading-relaxed">
              {issue.description}
            </div>
          </div>

          {/* Attached Citizen Media */}
          {issue.media && issue.media.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#747982] mb-2">
                Attached Citizen Photos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {issue.media.map((path, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-[#E2E4E7] bg-black aspect-video">
                    <img
                      src={resolveMediaUrl(path)}
                      alt="Citizen submission photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Proof (From Municipal Workers) */}
          {issue.resolutionProof && issue.resolutionProof.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2 text-[#20A779]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold">Field Resolution Proof</h3>
              </div>
              <p className="text-xs text-[#20A779] mb-3">
                Municipal workers uploaded the following evidence upon repair completion:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {issue.resolutionProof.map((path, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-emerald-300 bg-black aspect-video">
                    <img
                      src={resolveMediaUrl(path)}
                      alt="Field resolution proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {issue.resolutionDetails && (
                <div className="mt-3 p-3 rounded-lg bg-white border border-emerald-200 text-xs text-[#202226]">
                  <strong>Worker Resolution Notes:</strong> {issue.resolutionDetails}
                </div>
              )}
            </div>
          )}

          {/* Verification Panel for RESOLVED issues */}
          {issue.status === 'RESOLVED' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-[#FFF3EB] border border-[#FF8A3D]/40">
              <h2 className="text-base sm:text-lg font-bold text-[#202226] mb-1">
                Citizen Resolution Verification Required
              </h2>
              <p className="text-xs text-[#747982] mb-4">
                The municipal team has reported this complaint as resolved. Please inspect the resolution evidence above and confirm whether the work meets your satisfaction.
              </p>

              {!showReopenForm ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    id="verify-btn"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="btn-orange-primary text-xs py-2.5 px-4"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>YES — Confirm &amp; Close Complaint</span>
                      </>
                    )}
                  </button>
                  <button
                    id="reopen-btn"
                    onClick={() => setShowReopenForm(true)}
                    className="btn-graphite-secondary text-xs py-2.5 px-4 hover:border-red-400"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#E45757]" />
                    <span>NO — Issue Incomplete / Reopen</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 p-4 bg-white rounded-xl border border-[#E2E4E7] space-y-3">
                  <label className="block text-xs font-bold text-[#202226]">
                    Reason for Reopening <span className="text-[#E45757]">*</span>
                  </label>
                  <textarea
                    id="reopen-reason"
                    rows="3"
                    value={reopenReason}
                    onChange={e => setReopenReason(e.target.value)}
                    placeholder="Describe what was left incomplete or why further repair work is required..."
                    className="form-input-clean"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      id="submit-reopen-btn"
                      onClick={handleReopen}
                      disabled={verifying}
                      className="btn-graphite-secondary text-xs py-2 px-4 hover:bg-red-600"
                    >
                      {verifying ? 'Submitting...' : 'Submit Reopen Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowReopenForm(false); setReopenReason(''); }}
                      className="btn-white-outline text-xs py-2 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Timeline History */}
          <div className="pt-4 border-t border-[#E2E4E7]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#747982] mb-4">
              Status Lifecycle Timeline
            </h2>

            <div className="space-y-4">
              {issue.history && issue.history.length > 0 ? (
                issue.history.map((h, i) => (
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
              ) : (
                <p className="text-xs text-[#747982]">No transition history recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CitizenIssueDetails;
