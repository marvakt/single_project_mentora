import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { getProfile, listDocuments, listAvailability, addAvailability } from "../api/user";

export default function DashboardDoctor() {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [availability, setAvailability] = useState([]);

  const token = localStorage.getItem("access");
  const decoded = jwtDecode(token);
  const userId = decoded.user_id;

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const p = await getProfile(userId);
    const d = await listDocuments(userId);
    const a = await listAvailability(userId);

    setProfile(p.data);
    setDocuments(d.data);
    setAvailability(a.data);
  };

  if (!profile) return <div className="p-10">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-blue-600">Mentora</h1>

        <div className="space-y-4">
          <p className="text-gray-700 font-semibold">Dashboard</p>
          <p className="text-gray-700 font-semibold">Appointments</p>
          <p className="text-gray-700 font-semibold">Messages</p>
          <p className="text-gray-700 font-semibold">Settings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">

        {/* Status Banner */}
        {profile.onboarding_status < 100 && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500">
            <h2 className="font-semibold text-yellow-700">
              Your application is still under review.  
              You will gain full access once approved.
            </h2>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-6">Doctor Dashboard</h1>

        {/* Top Section: Profile + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Profile Summary</h2>
            <p><b>Name:</b> {profile.name}</p>
            <p><b>Email:</b> {profile.email}</p>
            <p><b>Phone:</b> {profile.phone || "Not added"}</p>
            <p><b>Specialization:</b> {profile.specialization || "Not set"}</p>
            <p><b>Status:</b> 
              <span className="ml-2 px-3 py-1 text-sm rounded bg-blue-100 text-blue-700">
                {profile.onboarding_status === 100 ? "Approved" : "Pending"}
              </span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Uploaded Documents</h2>

            {documents.length === 0 ? (
              <p className="text-gray-500">No documents uploaded</p>
            ) : (
              <ul className="list-disc ml-5">
                {documents.map((doc) => (
                  <li key={doc.id} className="mb-2">
                    <b>{doc.doc_type}:</b>  
                    <a
                      href={doc.file_url}
                      target="_blank"
                      className="text-blue-500 underline ml-2"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Availability Summary</h2>

            {availability.length === 0 ? (
              <p className="text-gray-500">No slots added</p>
            ) : (
              <ul className="text-gray-700">
                {availability.map((slot) => (
                  <li key={slot.id} className="mb-2">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][slot.day_of_week]}
                    {" — "}
                    {slot.start_time} to {slot.end_time}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <AvailabilityManager userId={userId} reload={loadAll} />

      </div>
    </div>
  );
}


/* ---------------------- Availability Manager ---------------------- */

function AvailabilityManager({ userId, reload }) {
  const [slot, setSlot] = useState({
    day_of_week: "",
    start_time: "",
    end_time: ""
  });

  const handleSubmit = async () => {
    await addAvailability(userId, slot);
    reload();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mt-10 max-w-xl">
      <h2 className="text-xl font-bold mb-4">Add Availability</h2>

      <select
        className="input mb-3 w-full"
        name="day_of_week"
        onChange={(e) => setSlot({ ...slot, day_of_week: e.target.value })}
      >
        <option value="">Select Day</option>
        <option value="0">Monday</option>
        <option value="1">Tuesday</option>
        <option value="2">Wednesday</option>
        <option value="3">Thursday</option>
        <option value="4">Friday</option>
        <option value="5">Saturday</option>
        <option value="6">Sunday</option>
      </select>

      <input
        type="time"
        className="input mb-3 w-full"
        onChange={(e) => setSlot({ ...slot, start_time: e.target.value })}
      />

      <input
        type="time"
        className="input mb-3 w-full"
        onChange={(e) => setSlot({ ...slot, end_time: e.target.value })}
      />

      <button className="btn-primary" onClick={handleSubmit}>
        Add Slot
      </button>
    </div>
  );
}