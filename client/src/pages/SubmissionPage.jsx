import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function SubmissionPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, upload to cloud storage (S3, Firebase, etc.)
    // For now, we'll store the filename as a placeholder
    setUploadedFileName(file.name);
    setFileUrl(`https://storage.example.com/${file.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submissionNotes.trim() && !fileUrl) {
      setError("Please add submission notes or upload a file");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(`/submissions/${taskId}/submit`, {
        submissionNotes,
        fileUrl,
      });

      alert("Deliverables submitted successfully!");
      navigate(`/task/${taskId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit deliverables");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6 fade-in max-w-2xl">
      <div className="card">
        <h1 className="text-2xl font-semibold">Submit Deliverables</h1>
        <p className="text-sm text-text/60 mt-1">Upload your work and add completion notes</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <form onSubmit={handleSubmit} className="card space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Upload Files</label>
          <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-neon/40 transition bg-white/5">
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.jpg,.png"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              {uploadedFileName ? (
                <div>
                  <p className="text-neon font-medium">✓ {uploadedFileName}</p>
                  <p className="text-xs text-text/60 mt-1">Click to change</p>
                </div>
              ) : (
                <div>
                  <p className="text-text/60">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted mt-1">PDF, DOC, ZIP, Images, etc.</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Submission Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">Completion Notes *</label>
          <textarea
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            placeholder="Describe what you've completed, any challenges, and additional notes..."
            className="w-full h-40 px-3 py-2 border border-white/10 rounded-lg text-sm bg-surface/80 text-text focus:outline-none focus:ring-2 focus:ring-neon/50"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "Submitting..." : "Submit Deliverables"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/task/${taskId}`)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="card bg-white/5 border border-white/10">
        <p className="text-sm text-text">
          <strong>Note:</strong> Once you submit your deliverables, the task creator will review your work.
          They can approve or request revisions. Keep your submission notes clear and comprehensive.
        </p>
      </div>
    </section>
  );
}
