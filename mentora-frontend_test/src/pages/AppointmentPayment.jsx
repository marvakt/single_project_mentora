import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPaymentOrder } from "../api/appointment";
import { toast } from "react-toastify";
import { CreditCard, CheckCircle } from "lucide-react";

export default function AppointmentPayment() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCreatePayment = async () => {
    setLoading(true);

    try {
      const res = await createPaymentOrder(appointmentId);
      setPaymentData(res.data);

      // Initialize Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RXZGR8GHigCiEd", // Public key only
        amount: Math.round(parseFloat(res.data.amount) * 100), // Convert to paise
        currency: res.data.currency || "INR",
        name: "Mentora",
        description: "Appointment Consultation Fee",
        order_id: res.data.razorpay_order_id,
        handler: function (response) {
          // Payment successful - webhook will handle confirmation
          setPaymentSuccess(true);
          toast.success("Payment received! Awaiting confirmation...");
        },
        prefill: {
          // Optional: prefill user details if available
        },
        theme: {
          color: "#3B82F6", // Blue color matching the app
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error("Failed to create payment order:", err);
      
      // Handle different error types
      if (err.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
        sessionStorage.clear();
        navigate("/login");
      } else if (err.response?.status === 400) {
        const errorMsg = err.response.data?.error || "Invalid request. Please check your appointment.";
        toast.error(errorMsg);
      } else if (err.response?.status === 404) {
        toast.error("Appointment not found.");
        navigate("/appointments");
      } else {
        toast.error("Failed to initialize payment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Received</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been received and is being processed. 
            Your appointment will be confirmed shortly via webhook.
          </p>
          <button
            onClick={() => navigate("/appointments")}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <CreditCard className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
            <p className="text-gray-600">
              Secure payment via Razorpay
            </p>
          </div>

          {paymentData ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ₹{paymentData.amount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Currency:</span>
                <span className="text-gray-900">{paymentData.currency}</span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                Click the button below to initialize payment. You will be redirected to Razorpay's secure payment page.
              </p>
            </div>
          )}

          <button
            onClick={handleCreatePayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Initializing Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                {paymentData ? "Retry Payment" : "Pay Now"}
              </>
            )}
          </button>

          <p className="mt-4 text-center text-sm text-gray-500">
            Your payment is secure and encrypted. We do not store your payment details.
          </p>
        </div>
      </div>
    </div>
  );
}

