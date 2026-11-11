import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Landmark, CheckCircle2, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [tokenStatus, setTokenStatus] = useState('verifying'); // 'verifying', 'valid', 'invalid'
  const [tokenError, setTokenError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [userType, setUserType] = useState('citizen');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify token on mount
  useEffect(() => {
    let isMounted = true;
    const verifyToken = async () => {
      try {
        const res = await api.get(`/auth/verify-reset-token/${token}`);
        if (isMounted) {
          setMaskedEmail(res.data.maskedEmail || '');
          setUserType(res.data.userType || 'citizen');
          setTokenStatus('valid');
        }
      } catch (err) {
        if (isMounted) {
          setTokenStatus('invalid');
          setTokenError(err.response?.data?.message || 'Invalid or expired password reset link.');
        }
      }
    };

    if (token) {
      verifyToken();
    } else {
      setTokenStatus('invalid');
      setTokenError('No reset token was provided.');
    }

    return () => { isMounted = false; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword
      });

      setSuccess(true);
      // Auto redirect to appropriate login portal after 3 seconds
      const targetPortal = res.data.userType === 'municipal' ? '/municipal/login' : '/citizen/login';
      setTimeout(() => {
        navigate(targetPortal);
      }, 3500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reset password. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  const isMunicipal = userType === 'municipal';

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
              Create New Password
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#747982] leading-relaxed">
              {maskedEmail ? (
                <>Resetting password for <strong className="text-[#202226] break-all">{maskedEmail}</strong></>
              ) : (
                'Choose a secure new password for your account'
              )}
            </p>
          </div>

          {/* Verifying State */}
          {tokenStatus === 'verifying' && (
            <div className="py-12 text-center text-[#747982] space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#FF8A3D]" />
              <p className="text-sm font-medium">Validating your reset security token...</p>
            </div>
          )}

          {/* Invalid Token State */}
          {tokenStatus === 'invalid' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#E45757] shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-[#E45757]">
                    <p className="font-bold mb-1">Reset Link Invalid or Expired</p>
                    <p>{tokenError}</p>
                    <p className="mt-2 text-xs opacity-80">
                      For your security, reset tokens are single-use and expire within 60 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/forgot-password"
                  className="btn-orange-primary w-full py-2.5 text-sm font-bold shadow-sm"
                >
                  Request a New Reset Link
                </Link>
                <div className="mt-3">
                  <Link to="/select-role" className="text-xs text-[#747982] hover:text-[#202226] inline-block py-1">
                    Return to Role Selection
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {tokenStatus === 'valid' && success && (
            <div className="space-y-6">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center text-[#20A779]">
                <CheckCircle2 className="w-10 h-10 text-[#20A779] mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#20A779] mb-1">Password Changed Successfully!</h3>
                <p className="text-xs sm:text-sm">
                  Your account password has been updated. All previous sessions have been invalidated for security.
                </p>
                <p className="text-xs text-[#747982] mt-3 font-medium">
                  Redirecting to login portal in a few moments...
                </p>
              </div>

              <div>
                <Link
                  to={isMunicipal ? '/municipal/login' : '/citizen/login'}
                  className="btn-orange-primary w-full py-2.5 text-sm font-bold shadow-sm"
                >
                  <span>Proceed to {isMunicipal ? 'Municipal Staff Login' : 'Citizen Login'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {/* Reset Password Form */}
          {tokenStatus === 'valid' && !success && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-[#E45757]">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                  New Password <span className="text-[#FF8A3D]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input-clean pr-14"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#747982] hover:text-[#202226] px-1 py-0.5 cursor-pointer select-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                  Confirm New Password <span className="text-[#FF8A3D]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="form-input-clean pr-14"
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#747982] hover:text-[#202226] px-1 py-0.5 cursor-pointer select-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-orange-primary w-full py-2.5 text-sm font-bold shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
