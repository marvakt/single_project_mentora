
import React, { useState } from 'react';
import { Award, Mail, Lock, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { AUTH_API } from '../../config/api';

const DoctorRegisterPage = ({ setCurrentView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'doctor' })
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${AUTH_API}/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login and complete your doctor profile.');
        setCurrentView('login');
      } else {
        setError(data.detail || 'OTP verification failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition duration-300">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            {step === 1 ? 'Join as Specialist' : 'Verify Email'}
          </h2>
          <p className="text-gray-600 mt-2">
            {step === 1 ? 'Partner with Mentora to deliver care' : `We sent a code to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100/50 backdrop-blur-sm p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">
                After registration, you'll need admin approval to start practicing on the platform.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  placeholder="Professional Email"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  placeholder="Create Password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                'Sending OTP...'
              ) : (
                <>
                  Continue Registration
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <div className="relative group">
              <Key className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 tracking-widest text-center text-lg font-bold text-gray-700"
                placeholder="0 0 0 0 0 0"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3.5 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? 'Verifying...' : 'Verify & Complete'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => setCurrentView('landing')}
            className="text-gray-400 hover:text-teal-600 text-sm transition flex items-center justify-center gap-1 mx-auto"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegisterPage;