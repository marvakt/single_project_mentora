
// ═══════════════════════════════════════════════════════════════
// FILE 2: src/pages/user/PaymentProcessing.jsx
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Loader, ArrowLeft, Shield, DollarSign } from 'lucide-react';
import { APPOINTMENT_API, apiCall } from '../../config/api';

const PaymentProcessing = ({ appointmentId, amount, onSuccess, onCancel, setCurrentView }) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [error, setError] = useState(null);

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
      key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'YOUR_RAZORPAY_KEY_ID',
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
        }, 2000);
      },
      prefill: {
        name: sessionStorage.getItem('user_name') || '',
        email: sessionStorage.getItem('user_email') || '',
      },
      theme: {
        color: '#9333ea'
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

  if (loading && !paymentStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600">Initializing secure payment...</p>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Your appointment is confirmed.</p>
        <p className="text-sm text-gray-500">Redirecting...</p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="text-center p-8">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
        <p className="text-red-600 mb-6">{error || 'Transaction could not be completed.'}</p>
        <button
          onClick={() => { setPaymentStatus(null); setError(null); }}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
        <Shield className="w-12 h-12 mx-auto mb-2 opacity-80" />
        <h2 className="text-2xl font-bold">Secure Payment</h2>
        <p className="opacity-90">Complete your booking</p>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
          <span className="text-gray-600">Consultation Fee</span>
          <span className="text-2xl font-bold text-gray-800">₹{amount}</span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2"
        >
          <CreditCard className="w-5 h-5" />
          <span>Pay Now</span>
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 text-sm hover:text-gray-700 font-medium"
          >
            Cancel and Go Back
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-xs text-gray-400">
          <Shield className="w-3 h-3" />
          <span>Secured by Razorpay</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessing;