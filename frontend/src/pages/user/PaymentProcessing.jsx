
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
        ondismiss: function() {
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

  // ... (Rest of the component as provided in the artifact)
};

export default PaymentProcessing;