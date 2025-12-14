import { useState } from "react";
import { saveDoctorProfile, uploadDocument } from "../api/user";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function DoctorOnboarding() {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    specialization: "",
    experience_years: "",
    license_number: "",
    bio: ""
  });
  
  const [documents, setDocuments] = useState({
    license: null,
    degree: null,
    id_proof: null
  });
  
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentChange = (e, docType) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: e.target.files[0]
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("access");
      const decoded = jwtDecode(token);
      const userId = decoded.user_id;
      
      // Save doctor profile
      await saveDoctorProfile(userId, profile);
      toast.success("Profile saved successfully!");
      setActiveTab("documents");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const submitDocuments = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem("access");
      const decoded = jwtDecode(token);
      const userId = decoded.user_id;
      
      // Upload each document
      const docTypes = Object.keys(documents);
      for (let i = 0; i < docTypes.length; i++) {
        const docType = docTypes[i];
        const file = documents[docType];
        
        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("doc_type", docType);
          
          await uploadDocument(userId, formData);
        }
      }
      
      toast.success("Documents uploaded successfully!");
      navigate("/onboarding/doctor/pending");
    } catch (err) {
      console.error("Failed to upload documents:", err);
      toast.error("Failed to upload documents");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Doctor Onboarding</h1>
          <p className="mt-2 text-gray-600">
            Complete your profile and upload required documents
          </p>
        </div>
        
        {/* Progress Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "profile"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              1. Profile Information
            </button>
            <button
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === "documents"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("documents")}
              disabled={!profile.specialization}
            >
              2. Document Upload
            </button>
          </div>
        </div>
        
        {/* Profile Form */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Information</h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Specialization */}
              <div className="sm:col-span-3">
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                  Medical Specialization
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="specialization"
                    id="specialization"
                    value={profile.specialization}
                    onChange={handleProfileChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                </div>
              </div>
              
              {/* Experience */}
              <div className="sm:col-span-3">
                <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="experience_years"
                    id="experience_years"
                    value={profile.experience_years}
                    onChange={handleProfileChange}
                    min="0"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
              </div>
              
              {/* License Number */}
              <div className="sm:col-span-3">
                <label htmlFor="license_number" className="block text-sm font-medium text-gray-700">
                  Medical License Number
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="license_number"
                    id="license_number"
                    value={profile.license_number}
                    onChange={handleProfileChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                  />
                </div>
              </div>
              
              {/* Bio */}
              <div className="sm:col-span-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Professional Bio
                </label>
                <div className="mt-1">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profile.bio}
                    onChange={handleProfileChange}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Tell us about your professional background..."
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={saving || !profile.specialization}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Document Upload Form */}
        {activeTab === "documents" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Required Documents</h2>
            <p className="text-gray-600 mb-6">
              Please upload clear scans of the following documents for verification
            </p>
            
            <div className="space-y-6">
              {/* Medical License */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical License
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          onChange={(e) => handleDocumentChange(e, "license")}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 5MB
                    </p>
                    {documents.license && (
                      <p className="text-sm text-green-600 mt-2">
                        {documents.license.name} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Degree Certificate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Degree Certificate
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          onChange={(e) => handleDocumentChange(e, "degree")}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 5MB
                    </p>
                    {documents.degree && (
                      <p className="text-sm text-green-600 mt-2">
                        {documents.degree.name} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ID Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID Proof
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          onChange={(e) => handleDocumentChange(e, "id_proof")}
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 5MB
                    </p>
                    {documents.id_proof && (
                      <p className="text-sm text-green-600 mt-2">
                        {documents.id_proof.name} selected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-5">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitDocuments}
                  disabled={saving || (!documents.license && !documents.degree && !documents.id_proof)}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}