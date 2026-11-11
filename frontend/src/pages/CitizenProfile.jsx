import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const CitizenProfile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [complaintCount, setComplaintCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, issuesRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/issues/my-issues').catch(() => ({ data: [] }))
        ]);
        setProfile(meRes.data);
        setComplaintCount(Array.isArray(issuesRes.data) ? issuesRes.data.length : 0);
        setFormData({
          name: meRes.data.name || '',
          phone: meRes.data.phone || '',
          address: meRes.data.address || ''
        });
      } catch (e) {
        console.error(e);
        setErr('Failed to load citizen profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await api.put('/auth/profile', formData);
      setProfile(prev => ({ ...prev, ...res.data }));
      setMsg('Profile contact details updated successfully!');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F6]">
      <Navbar />

      <main className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        {/* Back link */}
        <div className="mb-4">
          <Link
            to="/citizen/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D] block mb-0.5">
            Account Management
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
            Citizen Profile Settings
          </h1>
        </div>

        {loading ? (
          <div className="civic-card p-12 text-center text-[#747982] text-sm">
            Loading profile...
          </div>
        ) : profile ? (
          <div className="civic-card p-5 sm:p-8 space-y-6">
            {msg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#20A779] text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{msg}</span>
              </div>
            )}
            {err && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-[#E45757] text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{err}</span>
              </div>
            )}

            {/* Avatar & Summary */}
            <div className="pb-5 border-b border-[#E2E4E7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-[#17191C] border border-[#292D32] flex items-center justify-center text-xl font-black text-[#FF8A3D] shadow-sm shrink-0">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-[#202226] truncate">{profile.name}</h2>
                  <p className="text-xs text-[#747982] truncate">{profile.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#20A779]/15 text-[#20A779] border border-[#20A779]/30">
                    Verified Citizen Account
                  </span>
                </div>
              </div>

              <div className="bg-[#F4F5F6] p-3 rounded-xl border border-[#E2E4E7] text-center w-full sm:w-auto">
                <p className="text-2xl font-black text-[#FF8A3D]">{complaintCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#747982]">Complaints Lodged</p>
              </div>
            </div>

            {/* Readonly info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F5F6] p-4 rounded-xl border border-[#E2E4E7] text-xs">
              <div>
                <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Email</span>
                <p className="font-semibold text-[#202226] break-all">{profile.email}</p>
              </div>
              <div>
                <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Contact Phone</span>
                <p className="font-semibold text-[#202226]">{profile.phone || 'Not recorded'}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Registered Locality</span>
                <p className="font-semibold text-[#202226]">{profile.address || 'Not recorded'}</p>
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#747982]">
                Update Contact Information
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input-clean text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input-clean text-xs"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">Residential Locality / Ward</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input-clean text-xs"
                  placeholder="Street name, landmark, or apartment"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-orange-primary text-xs py-2.5 px-4 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Contact Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default CitizenProfile;
