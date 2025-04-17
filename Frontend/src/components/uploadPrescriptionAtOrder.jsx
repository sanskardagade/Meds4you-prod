import React, { useState } from "react";
import { toast } from "react-hot-toast";

const UploadPrescriptionAtUpload = ({ onFileSelect }) => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setUploading(true);
      try {
        await onFileSelect(selectedFile);
        setFileUploaded(true);
      } catch (error) {
        console.error("Error handling file:", error);
        setFileUploaded(false);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="w-full sm:max-w-4xl max-w-md mx-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="prescription"
            className="block text-sm font-bold text-gray-700 sm:text-base"
          >
            Upload Prescription
          </label>
        </div>

        {/* Upload Area */}
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <div className="w-full relative">
              <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <input
                  type="file"
                  id="prescription"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-900 focus:outline-none file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0 file:text-sm file:font-semibold
                    file:bg-red-50 file:text-red-700 hover:file:bg-red-100
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {/* Show loading or success state */}
                {uploading ? (
                  <span className="ml-2 text-blue-600 font-semibold text-lg">⌛</span>
                ) : fileUploaded ? (
                  <span className="ml-2 text-green-600 font-semibold text-lg">✔</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPrescriptionAtUpload;
