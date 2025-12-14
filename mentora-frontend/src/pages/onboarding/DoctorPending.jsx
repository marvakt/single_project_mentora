export default function DoctorPending() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-xl w-full text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
            ⏳
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Your Application Is Under Review
        </h1>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed mb-6">
          Our verification team is reviewing your submitted documents. 
          This process typically takes <span className="font-semibold text-gray-800">24–48 hours</span>.
          You will receive an email and in-app notification once your account is approved.
        </p>

        {/* Waiting Box */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 mb-6">
          Please keep your phone and email accessible for any follow-up verification requests.
        </div>

        {/* Loader */}
        <div className="flex justify-center">
          <span className="animate-pulse text-blue-600 font-semibold text-lg">
            Processing…
          </span>
        </div>
      </div>
    </div>
  );
}
