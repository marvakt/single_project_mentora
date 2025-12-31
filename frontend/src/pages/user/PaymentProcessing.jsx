
import React, { useState, useEffect } from 'react';
import {
  CreditCard, CheckCircle, XCircle, Loader, ArrowLeft, Shield, DollarSign,
  Home, Calendar, Clock, Activity, Smile, FileText, User, Settings, LogOut, Menu, Heart
} from 'lucide-react';
import { APPOINTMENT_API, apiCall } from '../../config/api';

const PaymentProcessing = ({
  appointmentId,
  amount,
  onSuccess,
  onCancel,
  setCurrentView,
  user, // Added user prop for sidebar profile
  token
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'success', 'failed'
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Logic Preserved from Original ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createPaymentOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(
        `${APPOINTMENT_API}/appointments/${appointmentId}/payments/create/`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const data = await response.json();
      setRazorpayOrderId(data.razorpay_order_id);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  const handlePayment = async () => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      setError('Failed to load payment gateway. Please check your internet connection.');
      return;
    }

    const orderData = await createPaymentOrder();
    if (!orderData) return;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID',
      amount: parseFloat(orderData.amount) * 100,
      currency: orderData.currency,
      name: 'Mentora',
      description: 'Mental Health Consultation',
      order_id: orderData.razorpay_order_id,
      handler: function (response) {
        setPaymentStatus('success');
        setLoading(false);
        setTimeout(() => {
          if (onSuccess) onSuccess(response);
          // If onSuccess not provided, fallback redirect? 
          // (Usually parent handles this)
        }, 2000);
      },
      prefill: {
        name: sessionStorage.getItem('user_name') || '',
        email: sessionStorage.getItem('user_email') || '',
      },
      theme: {
        color: '#0d9488' // Teal-600
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          setError('Payment cancelled by user');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      setPaymentStatus('failed');
      setLoading(false);
      setError(response.error.description || 'Payment failed');
    });

    razorpay.open();
  };
  // -------------------------------------

  // Sidebar Nav Item Helper
  const NavItem = ({ icon: Icon, label, view, active }) => (
    <button
      onClick={() => { setCurrentView(view); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
        ? 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 font-semibold shadow-sm border border-teal-100'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
      <span>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
    </button>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar Navigation (Consistent Layout) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 shadow-xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Heart className="w-6 h-6 text-white text-bold" fill="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent tracking-tight">Mentora</h1>
              <p className="text-xs text-gray-400 font-medium">Patient Portal</p>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
            <NavItem icon={Home} label="Overview" view="user-dashboard" />
            <NavItem icon={Calendar} label="Appointments" view="my-appointments" />
            <NavItem icon={Clock} label="Book Session" view="book-appointment" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Wellness</p>
            <NavItem icon={Activity} label="Assessment" view="severity-assessment" />
            <NavItem icon={Smile} label="Mood Tracker" view="mood-tracker" />
            <NavItem icon={FileText} label="Treatment Plan" view="treatment-plan" />
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-8">Account</p>
            <NavItem icon={User} label="Profile" view="user-profile" />
            <NavItem icon={Settings} label="Settings" view="settings" />
          </nav>
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                {/* Fallback to user prop or 'User' */}
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name || sessionStorage.getItem('user_name') || 'User'}</p>
                <button onClick={() => { sessionStorage.clear(); setCurrentView('landing'); }} className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1">
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white" fill="white" /></div>
            <span className="font-bold text-gray-800">Mentora</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"><Menu className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative flex items-center justify-center">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none -z-10"></div>

          {/* Main Payment Card */}
          <div className="max-w-md w-full">

            {/* Back Link */}
            <button
              onClick={onCancel}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" /> Cancel Payment
            </button>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-90" />
                <h2 className="text-2xl font-bold tracking-tight">Secure Checkout</h2>
                <p className="text-teal-50 text-sm">Complete your session booking</p>
              </div>

              <div className="p-8">
                {loading && !paymentStatus ? (
                  <div className="text-center py-8">
                    <Loader className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Initializing secure gateway...</p>
                  </div>
                ) : paymentStatus === 'success' ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-500 text-sm">Redirecting you to your appointment status...</p>
                  </div>
                ) : paymentStatus === 'failed' ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                    <p className="text-rose-600 mb-6 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100 inline-block px-6">{error || 'Transaction could not be completed.'}</p>
                    <button
                      onClick={() => { setPaymentStatus(null); setError(null); }}
                      className="w-full bg-gray-900 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Total to Pay</p>
                        <h3 className="text-3xl font-bold text-gray-900">₹{amount}</h3>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-600 shadow-sm">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-700">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handlePayment}
                      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-teal-500/30 transition transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      Pay Securely Now
                    </button>

                    <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                      <Shield className="w-3 h-3" />
                      Secured by Razorpay
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentProcessing;