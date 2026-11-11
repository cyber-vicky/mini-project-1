import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import MunicipalSidebar from '../components/MunicipalSidebar';
import MunicipalTopNav from '../components/MunicipalTopNav';
import { AuthContext } from '../context/AuthContext';
import { User, Shield, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const MunicipalProfile = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          email: res.data.email || ''
        });
      } catch (e) {
        console.error(e);
        setErr('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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
    <div className="municipal-layout bg-[#F4F5F6] font-sans">
      <MunicipalSidebar />

      <div className="municipal-main flex flex-col min-w-0">
        <MunicipalTopNav title="Staff Account Settings" breadcrumb="Profile" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-3xl">
          {/* Header */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A3D] block mb-0.5">
              Identity Management
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
              Municipal Staff Profile
            </h1>
            <p className="text-xs text-[#747982] mt-0.5">
              Review assigned municipal division credentials and update your contact records.
            </p>
          </div>

          {loading ? (
            <div className="civic-card p-12 text-center text-[#747982] text-sm">
              Loading staff profile...
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

              {/* Avatar + Main Info */}
              <div className="pb-5 border-b border-[#E2E4E7] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#17191C] border border-[#292D32] flex items-center justify-center text-xl font-black text-[#FF8A3D] shadow-sm shrink-0">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'M'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-lg font-bold text-[#202226] truncate">{profile.name}</h2>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#17191C] text-[#FF8A3D] border border-[#292D32]">
                      {profile.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#747982] font-mono">{profile.employeeId}</p>
                  {profile.departmentName && (
                    <p className="text-xs text-[#747982] mt-0.5 truncate">
                      Department: <strong className="text-[#202226]">{profile.departmentName}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Security info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F4F5F6] p-4 rounded-xl border border-[#E2E4E7] text-xs">
                <div>
                  <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Employee ID</span>
                  <p className="font-mono font-bold text-[#202226]">{profile.employeeId}</p>
                </div>
                <div>
                  <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Authorization Role</span>
                  <p className="font-bold text-[#202226]">{profile.role}</p>
                </div>
                <div>
                  <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Department Assignment</span>
                  <p className="font-semibold text-[#202226] break-words">{profile.departmentId || 'City-Wide Oversight (Admin)'}</p>
                </div>
                <div>
                  <span className="text-[#747982] block text-[10px] font-bold uppercase tracking-wider mb-0.5">Account Member Since</span>
                  <p className="font-semibold text-[#202226]">{new Date(profile.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Edit Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#747982]">
                  Update Personal Information
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
                  <label className="block text-xs font-semibold text-[#202226] mb-1.5">Official Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input-clean text-xs"
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
                      <span>Save Profile Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MunicipalProfile;
