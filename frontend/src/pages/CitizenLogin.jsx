import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Landmark, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const CitizenLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  // If citizen is already logged in, redirect directly to their dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'citizen') {
        navigate('/citizen/dashboard', { replace: true });
      } else if (user.role === 'WORKER') {
        navigate('/municipal/tasks', { replace: true });
      } else {
        navigate('/municipal/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await login('citizen', { email: trimmedEmail, password });
      navigate('/citizen/dashboard', { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Unable to connect to the server. Please check your internet connection or try again later.'
          : 'Login failed. Please check your credentials.');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            to="/select-role"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Role Selection</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#E2E4E7]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#17191C] border border-[#292D32] shadow-sm mb-3">
              <Landmark className="w-6 h-6 text-[#FF8A3D]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#202226] tracking-tight">Citizen Login</h1>
            <p className="text-xs sm:text-sm text-[#747982] mt-1">
              Sign in to report civic problems and track live repair progress.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#E45757] p-3 rounded-xl mb-5 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="citizen-email" className="block text-xs font-semibold text-[#202226] mb-1.5">
                Email Address <span className="text-[#FF8A3D]">*</span>
              </label>
              <input
                id="citizen-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                className="form-input-clean"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>

            <div>
              <label htmlFor="citizen-password" className="block text-xs font-semibold text-[#202226] mb-1.5">
                Password <span className="text-[#FF8A3D]">*</span>
              </label>
              <div className="relative">
                <input
                  id="citizen-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="form-input-clean pr-14"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#747982] hover:text-[#202226] px-1 py-0.5 cursor-pointer disabled:opacity-50 select-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Link
                to="/forgot-password?portal=citizen"
                className="text-xs font-semibold text-[#FF8A3D] hover:text-[#F37B2B] transition"
              >
                Forgot Password?
              </Link>
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In as Citizen</span>
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-5 pt-4 border-t border-[#E2E4E7] space-y-2">
            <Link
              to="/citizen/register"
              className="block text-xs font-semibold text-[#FF8A3D] hover:text-[#F37B2B] transition"
            >
              Don't have an account? Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenLogin;
