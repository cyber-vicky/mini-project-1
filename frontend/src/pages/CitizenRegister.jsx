import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Landmark, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const CitizenRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match. Please verify.");
    }

    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
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
            to="/citizen/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Login</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#E2E4E7]">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#17191C] border border-[#292D32] shadow-sm mb-3">
              <Landmark className="w-6 h-6 text-[#FF8A3D]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#202226] tracking-tight">Create Citizen Account</h1>
            <p className="text-xs sm:text-sm text-[#747982] mt-1">
              Join your community to report issues and improve local municipal services.
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
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Full Name <span className="text-[#FF8A3D]">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="form-input-clean"
                placeholder="e.g. Sarah Jenkins"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Email Address <span className="text-[#FF8A3D]">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                className="form-input-clean"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input-clean"
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                  Locality / Ward
                </label>
                <input
                  type="text"
                  name="address"
                  className="form-input-clean"
                  placeholder="e.g. Ward 12"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Password <span className="text-[#FF8A3D]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  className="form-input-clean pr-14"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label className="block text-xs font-semibold text-[#202226] mb-1.5">
                Confirm Password <span className="text-[#FF8A3D]">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  className="form-input-clean pr-14"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-5 pt-4 border-t border-[#E2E4E7]">
            <Link
              to="/citizen/login"
              className="text-xs font-semibold text-[#FF8A3D] hover:text-[#F37B2B] transition"
            >
              Already registered? Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenRegister;
