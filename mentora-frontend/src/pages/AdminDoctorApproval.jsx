import React, { useEffect, useState } from "react";
import { getUserList, approveDoctor, rejectDoctor, listDocuments } from "../api/user";
import { Search, CheckCircle, XCircle, Eye, FileText } from "lucide-react";
import { toast } from "react-toastify";

export default function AdminDoctorApproval() {
  const [doctors, setDoctors] = useState([]);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [showDocuments, setShowDocuments] = useState(null);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await getUserList({
        search: filters.search,
        role: "doctor",
        status: "all",
      });
      
      // Filter only pending doctors
      const pendingDoctors = res.data.filter(doctor => doctor.onboarding_status < 100);
      setDoctors(pendingDoctors);
    } catch (err) {
      console.error("Failed to load doctors:", err);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await approveDoctor(userId);
      toast.success("Doctor approved successfully!");
      loadDoctors(); // Reload the list
    } catch (err) {
      console.error("Failed to approve doctor:", err);
      toast.error("Failed to approve doctor");
    }
  };

  const handleReject = async (userId) => {
    try {
      await rejectDoctor(userId);
      toast.success("Doctor rejected!");
      loadDoctors(); // Reload the list
    } catch (err) {
      console.error("Failed to reject doctor:", err);
      toast.error("Failed to reject doctor");
    }
  };

  const loadDocuments = async (userId) => {
    try {
      const res = await listDocuments(userId);
      setDocuments(prev => ({
        ...prev,
        [userId]: res.data
      }));
      setShowDocuments(userId);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents");
    }
  };

  const toggleDocuments = (userId) => {
    if (showDocuments === userId) {
      setShowDocuments(null);
    } else {
      if (documents[userId]) {
        setShowDocuments(userId);
      } else {
        loadDocuments(userId);
      }
    }
  };

  if (loading) return <div className="p-10 text-center">Loading doctors...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Approval</h1>
          <p className="mt-2 text-gray-600">
            Review and approve pending doctor applications
          </p>
        </div>
        
        {/* FILTERS */}
        <div className="bg-white p-5 rounded-lg shadow mb-6 flex items-center gap-4 flex-wrap">
          <div className="flex items-center border px-3 rounded-lg bg-gray-50">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search doctors..."
              className="p-2 bg-transparent outline-none"
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          
          <button
            onClick={loadDoctors}
            className="btn-primary whitespace-nowrap"
          >
            Apply Filters
          </button>
        </div>
        
        {/* DOCTORS TABLE */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Approvals ({doctors.length})
            </h2>
          </div>
          
          {doctors.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
              <p className="mt-1 text-sm text-gray-500">
                All doctors have been reviewed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {doctors.map((doctor) => (
                    <React.Fragment key={doctor.user_id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {doctor.name ? doctor.name.charAt(0) : 'D'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {doctor.name || "Unnamed Doctor"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doctor.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {doctor.specialization || "Not specified"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.experience_years ? `${doctor.experience_years} years` : "Not specified"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doctor.license_number || "Not provided"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => toggleDocuments(doctor.user_id)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {showDocuments === doctor.user_id ? "Hide" : "View"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleApprove(doctor.user_id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(doctor.user_id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* DOCUMENTS ROW */}
                      {showDocuments === doctor.user_id && (
                        <tr className="bg-gray-50">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="border border-gray-200 rounded-lg p-4">
                              <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                              
                              {documents[doctor.user_id] && documents[doctor.user_id].length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {documents[doctor.user_id].map((doc) => (
                                    <div key={doc.id} className="border border-gray-200 rounded-md p-3 bg-white">
                                      <div className="flex items-center">
                                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                        <div>
                                          <p className="text-sm font-medium text-gray-900 capitalize">
                                            {doc.doc_type.replace('_', ' ')}
                                          </p>
                                          <a 
                                            href={doc.file_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                          >
                                            View Document
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No documents uploaded</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}