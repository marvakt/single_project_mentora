// import React, { useState, useEffect } from 'react';
// import { ChevronRight } from 'lucide-react';
// import { USER_API } from '../../config/api';

// const DoctorProfile = ({ user, token, setCurrentView }) => {
//   const [profile, setProfile] = useState(null);
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [specialization, setSpecialization] = useState('');
//   const [experience, setExperience] = useState('');
//   const [fee, setFee] = useState('');
//   const [bio, setBio] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchProfile();
//   }, []);

//   const fetchProfile = async () => {
//     try {
//       const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
//         headers: { 'Authorization': `Bearer ${token}` }
//       });
//       if (response.ok) {
//         const data = await response.json();
//         setProfile(data);
//         setName(data.name || '');
//         setPhone(data.phone || '');
//         setSpecialization(data.doctor?.specialization || '');
//         setExperience(data.doctor?.experience_years || '');
//         setFee(data.doctor?.consultation_fee || '');
//         setBio(data.doctor?.bio || '');
//       }
//     } catch (err) {
//       console.error('Failed to fetch profile', err);
//     }
//   };

//   const handleUpdateProfile = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       await fetch(`${USER_API}/profile/${user.user_id}/update/`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ name, phone })
//       });

//       await fetch(`${USER_API}/doctor/${user.user_id}/profile/`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           specialization,
//           experience_years: parseInt(experience),
//           consultation_fee: parseInt(fee),
//           bio
//         })
//       });

//       alert('Profile updated successfully!');
//       fetchProfile();
//     } catch (err) {
//       alert('Failed to update profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen">
//       <nav className="bg-white shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <button 
//               onClick={() => setCurrentView('doctor-dashboard')} 
//               className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
//             >
//               <ChevronRight className="w-5 h-5 transform rotate-180" />
//               <span>Back to Dashboard</span>
//             </button>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-3xl mx-auto px-4 py-8">
//         <h1 className="text-3xl font-bold mb-8 text-gray-800">Doctor Profile</h1>

//         <div className="bg-white rounded-xl p-8 shadow-lg">
//           <form onSubmit={handleUpdateProfile} className="space-y-6">
//             <div className="grid md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
//                 <input
//                   type="text"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
//                 <input
//                   type="tel"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
//               <select
//                 value={specialization}
//                 onChange={(e) => setSpecialization(e.target.value)}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//               >
//                 <option value="">Select Specialization</option>
//                 <option value="Counselor">Counselor</option>
//                 <option value="Psychologist">Psychologist</option>
//                 <option value="Psychiatrist">Psychiatrist</option>
//               </select>
//             </div>

//             <div className="grid md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Experience (years)</label>
//                 <input
//                   type="number"
//                   value={experience}
//                   onChange={(e) => setExperience(e.target.value)}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)</label>
//                 <input
//                   type="number"
//                   value={fee}
//                   onChange={(e) => setFee(e.target.value)}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                 />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
//               <textarea
//                 value={bio}
//                 onChange={(e) => setBio(e.target.value)}
//                 rows={4}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
//                 placeholder="Tell patients about yourself..."
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50"
//             >
//               {loading ? 'Updating...' : 'Update Profile'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DoctorProfile;



// ═══════════════════════════════════════════════════════════════
// FILE: src/pages/doctor/DoctorProfile.jsx (WITH DOCUMENT UPLOAD)
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { ChevronRight, Upload, FileText, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { USER_API } from '../../config/api';

const DoctorProfile = ({ user, token, setCurrentView }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [fee, setFee] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Document states
  const [documents, setDocuments] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('license');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, []);

  const fetchProfile = async () => {
    try {
      const accessToken = sessionStorage.getItem('access_token');
      const response = await fetch(`${USER_API}/profile/${user.user_id}/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setSpecialization(data.doctor?.specialization || '');
        setExperience(data.doctor?.experience_years || '');
        setFee(data.doctor?.consultation_fee || '');
        setBio(data.doctor?.bio || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const accessToken = sessionStorage.getItem('access_token');
      const response = await fetch(`${USER_API}/doctor/${user.user_id}/documents/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(`${USER_API}/profile/${user.user_id}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone })
      });

      await fetch(`${USER_API}/doctor/${user.user_id}/profile/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          specialization,
          experience_years: parseInt(experience) || 0,
          consultation_fee: parseInt(fee) || 500,
          bio
        })
      });

      alert('Profile updated successfully!');
      fetchProfile();
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setUploadingDoc(true);

    try {
      // Convert file to base64 or upload to your storage
      // For demo, we'll use a placeholder URL
      // In production, upload to S3/Cloudinary/etc first
      
      const fileUrl = URL.createObjectURL(selectedFile); // Temporary URL for demo
      
      const response = await fetch(`${USER_API}/doctor/${user.user_id}/document/upload/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doc_type: selectedDocType,
          file_url: fileUrl // In production, this would be the uploaded file URL
        })
      });

      if (response.ok) {
        alert('Document uploaded successfully!');
        setSelectedFile(null);
        setSelectedDocType('license');
        fetchDocuments();
      } else {
        alert('Failed to upload document');
      }
    } catch (err) {
      alert('Error uploading document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const getDocumentStatusBadge = (doc) => {
    if (doc.verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
        <Clock className="w-3 h-3 mr-1" />
        Pending Review
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => setCurrentView('doctor-dashboard')} 
              className="text-purple-600 hover:text-purple-800 flex items-center space-x-2"
            >
              <ChevronRight className="w-5 h-5 transform rotate-180" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Doctor Profile Management</h1>

        {/* Status Alert */}
        {profile?.doctor?.doctor_status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl mb-6">
            <p className="font-semibold">⏳ Profile Completion Required</p>
            <p className="text-sm mt-1">Please complete your profile and upload all required documents for admin approval.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 border-b-2 font-semibold transition ${
                  activeTab === 'info'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`py-4 border-b-2 font-semibold transition ${
                  activeTab === 'documents'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Documents
                {documents.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                    {documents.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Basic Information Tab */}
            {activeTab === 'info' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    required
                  >
                    <option value="">Select Specialization</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Psychologist">Psychologist</option>
                    <option value="Psychiatrist">Psychiatrist</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (years) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consultation Fee (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Tell patients about your experience, approach, and specialties..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {/* Upload Form */}
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Upload New Document</h3>
                  <form onSubmit={handleDocumentUpload} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Type
                      </label>
                      <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="license">Medical License</option>
                        <option value="degree">Degree Certificate</option>
                        <option value="id_proof">ID Proof</option>
                        <option value="experience_certificate">Experience Certificate</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select File (Max 5MB)
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          onChange={handleFileSelect}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                        <button
                          type="submit"
                          disabled={!selectedFile || uploadingDoc}
                          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center space-x-2"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{uploadingDoc ? 'Uploading...' : 'Upload'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Accepted formats: PDF, JPG, PNG (Max 5MB)
                      </p>
                    </div>
                  </form>
                </div>

                {/* Uploaded Documents List */}
                <div>
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Uploaded Documents</h3>
                  {documents.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No documents uploaded yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Upload your license, degree, and ID proof to get verified
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="font-semibold text-gray-800 capitalize">
                                    {doc.doc_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getDocumentStatusBadge(doc)}
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Important Notes */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Required Documents</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Medical License - Valid registration certificate</li>
                    <li>Degree Certificate - Educational qualification proof</li>
                    <li>ID Proof - Government-issued ID (Aadhaar/PAN/Passport)</li>
                    <li>Experience Certificate (if applicable)</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-3">
                    All documents will be verified by our admin team before approval.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;