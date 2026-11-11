import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Landmark, ArrowLeft, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const portalParam = searchParams.get('portal'); // 'citizen' or 'municipal' or null
  const [portal, setPortal] = useState(portalParam === 'municipal' ? 'municipal' : 'citizen');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(true);

  const isMunicipal = portal === 'municipal';

  const validateEmail = (val) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setDevResetUrl('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your registered email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address format (e.g. name@example.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        email: trimmedEmail,
        portal
      });

      setSuccessMessage(res.data.message || 'If an account exists for this email, password reset instructions will be sent.');
      setEmailConfigured(res.data.emailConfigured !== false);
      if (res.data.devResetUrl) {
        setDevResetUrl(res.data.devResetUrl);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response?.data?.message || 'Too many reset requests. Please wait a few minutes before trying again.');
      } else {
        setError(err.response?.data?.message || 'Unable to submit request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to={isMunicipal ? '/municipal/login' : '/citizen/login'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to {isMunicipal ? 'Municipal' : 'Citizen'} Login</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#E2E4E7]">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#17191C] border border-[#292D32] shadow-sm mb-3">
              <Landmark className="w-6 h-6 text-[#FF8A3D]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#202226] tracking-tight">
              Reset Password
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#747982] leading-relaxed">
              Enter your registered email address and we'll send you instructions to safely reset your password.
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex bg-[#F4F5F6] p-1 rounded-xl mb-6 border border-[#E2E4E7]">
            <button
              type="button"
              onClick={() => { setPortal('citizen'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition min-h-[38px] cursor-pointer ${
                !isMunicipal
                  ? 'bg-white text-[#202226] shadow-xs border border-[#E2E4E7]'
                  : 'text-[#747982] hover:text-[#202226]'
              }`}
            >
              Citizen Account
            </button>
            <button
              type="button"
              onClick={() => { setPortal('municipal'); setError(''); setSuccessMessage(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition min-h-[38px] cursor-pointer ${
                isMunicipal
                  ? 'bg-white text-[#202226] shadow-xs border border-[#E2E4E7]'
                  : 'text-[#747982] hover:text-[#202226]'
              }`}
            >
              Municipal Staff
            </button>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 mb-5 text-[#20A779]">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#20A779]">
                  <p className="font-bold mb-1">Request Received</p>
                  <p>{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dev / Local Testing Reset Link Card */}
          {devResetUrl && (
            <div className="rounded-xl bg-[#FFF3EB] border border-[#FF8A3D]/40 p-4 mb-5 text-[#202226] text-xs">
              <p className="font-bold text-[#FF8A3D] mb-1">Dev Environment Link Preview</p>
              <p className="mb-2 text-[#747982]">
                Email server simulation link for development testing:
              </p>
              <a
                href={devResetUrl}
                className="btn-orange-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
              >
                <span>Open Password Reset Link</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 mb-5 text-[#E45757] flex items-start gap-2 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#202226] mb-1.5">
                Registered Email Address <span className="text-[#FF8A3D]">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                className="form-input-clean"
                placeholder={isMunicipal ? 'staff@municipal.gov' : 'name@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-orange-primary w-full py-2.5 text-sm font-bold shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Instructions...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>

          <div className="text-center mt-5 pt-4 border-t border-[#E2E4E7]">
            <Link
              to="/select-role"
              className="text-xs text-[#747982] hover:text-[#202226] transition font-medium"
            >
              Return to Role Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
