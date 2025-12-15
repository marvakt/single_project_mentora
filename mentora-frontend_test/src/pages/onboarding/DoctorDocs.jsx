import { useState } from "react";
import { updateProfile } from "../../api/user";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function DoctorDocs() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [docs, setDocs] = useState({
    license: null,
    degree: null,
    id_proof: null,
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const field = e.target.name;

    setDocs((prev) => ({ ...prev, [field]: file }));
  };

  // Mock upload (replace with S3 later)
  const uploadToServer = async (file, type) => {
    // TODO: Implement actual document upload
    // For now, we'll just return a mock URL
    return `http://example.com/${type}_${Date.now()}.pdf`;
  };

  const handleSubmit = async () => {
    if (!docs.license || !docs.degree || !docs.id_proof) {
      return toast.error("All documents are required");
    }

    try {
      setLoading(true);

      // Upload all docs
      await uploadToServer(docs.license, "license");
      await uploadToServer(docs.degree, "degree");
      await uploadToServer(docs.id_proof, "id_proof");

      // Update onboarding status
      await updateProfile(userId, {
        onboarding_status: 80,
      });

      localStorage.setItem("onboarding_status", 80);

      toast.success("Documents uploaded successfully!");
      navigate(`/onboarding/doctor/pending`);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 bg-white rounded-xl shadow-xl p-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Upload Verification Documents
      </h1>

      <p className="text-gray-500 mb-8">
        Please upload the required documents to verify your identity and qualifications.
      </p>

      {/* Document List */}
      <div className="space-y-6">

        {/* License */}
        <UploadBlock
          label="Medical License"
          name="license"
          file={docs.license}
          handleFileChange={handleFileChange}
        />

        {/* Degree */}
        <UploadBlock
          label="Degree Certificate"
          name="degree"
          file={docs.degree}
          handleFileChange={handleFileChange}
        />

        {/* ID Proof */}
        <UploadBlock
          label="Government ID Proof"
          name="id_proof"
          file={docs.id_proof}
          handleFileChange={handleFileChange}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-10 w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition"
      >
        {loading ? "Uploading..." : "Submit Documents →"}
      </button>
    </div>
  );
}

/* ------------------------------
   Extracted Upload Component
--------------------------------*/
function UploadBlock({ label, name, file, handleFileChange }) {
  return (
    <div className="border rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition">
      <label className="block text-lg font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <input
          type="file"
          name={name}
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          className="hidden"
          id={name}
        />
        <label
          htmlFor={name}
          className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Upload File
        </label>

        {file ? (
          <p className="text-gray-700">{file.name}</p>
        ) : (
          <p className="text-gray-400">No file selected</p>
        )}
      </div>
    </div>
  );
}