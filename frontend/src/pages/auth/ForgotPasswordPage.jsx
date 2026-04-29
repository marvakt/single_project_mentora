import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Heart, Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { AUTH_API } from '../../config/api';
import { setCurrentView } from '../../store/slices/uiSlice';

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'If an account with that email exists, we sent a password reset OTP.' });
        setTimeout(() => {
          dispatch(setCurrentView('reset-password'));
        }, 3000);
      } else {
        setStatus({ type: 'error', message: data.detail || data.email?.[0] || 'Failed to request password reset' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

      <div className="max-w-md w-full bg-white/60 backdrop-blur-xl border border-teal-100 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-8 h-8 text-white" fill="white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Forgot Password</h2>
          <p className="text-gray-600 mt-2">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {status.message && (
            <div className={`px-4 py-3 rounded-2xl text-sm flex items-center gap-2 ${
              status.type === 'error' ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-teal-50 border border-teal-100 text-teal-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.type === 'error' ? 'bg-red-500' : 'bg-teal-500'}`}></span>
              {status.message}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                placeholder="Email Address"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-medium py-3 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => dispatch(setCurrentView('login'))}
              className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
