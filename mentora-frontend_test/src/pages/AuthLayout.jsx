export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <div className="bg-white w-full max-w-5xl shadow-xl rounded-xl overflow-hidden flex">

        {/* LEFT PANEL */}
        <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center p-10">
          <img
            src="https://images.pexels.com/photos/416751/pexels-photo-416751.jpeg"
            className="w-80 h-80 rounded-full object-cover mb-6"
          />
          <p className="text-gray-600 text-center text-sm mt-4">
            Your Personal Guide to Mental Wellness.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-1/2 p-12">{children}</div>
      </div>
    </div>
  );
}
