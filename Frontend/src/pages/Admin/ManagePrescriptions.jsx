import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEye, FaFilePdf, FaShoppingCart } from "react-icons/fa";

const ManagePrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescriptionUrl, setSelectedPrescriptionUrl] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("❌ No token found in localStorage!");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/prescriptions/admin`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setPrescriptions(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load prescriptions");
        console.error("❌ Error fetching prescriptions:", err);
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/prescriptions/update-status/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setPrescriptions((prev) =>
        prev.map((prescription) =>
          prescription._id === id
            ? { ...prescription, status: newStatus }
            : prescription
        )
      );
    } catch (err) {
      console.error("❌ Error updating prescription status:", err);
      toast.error("Failed to update status. Check console for errors.", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleViewPrescription = async (prescriptionId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/prescriptions/${prescriptionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.data.fileUrl) {
        toast.error("No prescription file found");
        return;
      }

      setSelectedPrescriptionUrl(response.data.fileUrl);
      setShowPrescriptionModal(true);
    } catch (error) {
      console.error("Error viewing prescription:", error);
      toast.error("Failed to view prescription");
    }
  };

  const handleCreateOrder = async (prescriptionId) => {
    try {
      setIsCreatingOrder(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/create-from-prescription/${prescriptionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Order created successfully!");
      // Update prescription status to completed
      handleStatusChange(prescriptionId, "Completed");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedPrescriptionUrl) {
        URL.revokeObjectURL(selectedPrescriptionUrl);
      }
    };
  }, [selectedPrescriptionUrl]);

  if (loading) return <p className="text-gray-600 text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">
        Uploaded Prescriptions
      </h2>

      {prescriptions.length === 0 ? (
        <p className="text-gray-500 text-center">
          No prescriptions uploaded yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map((prescription) => (
            <div
              key={prescription._id}
              className="bg-white shadow-lg rounded-lg p-4 border border-gray-200"
            >
              {/* User Info */}
              <div className="mb-2">
                <p className="text-lg font-semibold">
                  {prescription.userId?.name || "Unknown"}
                </p>
                <p className="text-gray-600 text-sm">
                  {prescription.userId?.phoneNumber || "N/A"}
                </p>
              </div>

              {/* Prescription Actions */}
              <div className="mb-2 flex gap-2">
                <button
                  onClick={() => handleViewPrescription(prescription._id)}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <FaEye /> View Prescription
                </button>
                {prescription.status !== "Completed" && (
                  <button
                    onClick={() => handleCreateOrder(prescription._id)}
                    disabled={isCreatingOrder}
                    className="text-green-600 hover:text-green-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    <FaShoppingCart /> {isCreatingOrder ? "Creating..." : "Create Order"}
                  </button>
                )}
              </div>

              {/* Uploaded Date */}
              <p className="text-sm text-gray-600">
                <strong>Uploaded At:</strong>{" "}
                {new Date(prescription.uploadedAt).toLocaleDateString()}
              </p>

              {/* Delivery Address */}
              <div className="mt-2 text-sm text-gray-700">
                <strong>Address:</strong> <br />
                {prescription.deliveryAddress
                  ? `${prescription.deliveryAddress.street}, ${prescription.deliveryAddress.city}, 
                    ${prescription.deliveryAddress.state}, ${prescription.deliveryAddress.zipCode}, 
                    ${prescription.deliveryAddress.country}`
                  : "N/A"}
              </div>

              {/* Instructions with Wrapping */}
              <div className="mt-2 text-sm text-gray-700">
                <strong>Instructions:</strong>
                <p className="break-words">
                  {prescription.instructions || "N/A"}
                </p>
              </div>

              {/* Status Dropdown */}
              <div className="mt-4">
                <label className="text-sm font-semibold">Update Status:</label>
                <select
                  className="border p-2 rounded w-full mt-1 text-sm"
                  value={prescription.status || "Pending"}
                  onChange={(e) =>
                    handleStatusChange(prescription._id, e.target.value)
                  }
                >
                  <option value="Pending">Pending</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedPrescriptionUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Prescription</h2>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setSelectedPrescriptionUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="relative w-full" style={{ paddingTop: '75%' }}>
              {selectedPrescriptionUrl.toLowerCase().endsWith('.pdf') ? (
                <embed
                  src={selectedPrescriptionUrl}
                  type="application/pdf"
                  className="absolute inset-0 w-full h-full"
                />
              ) : (
                <img
                  src={selectedPrescriptionUrl}
                  alt="Prescription"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <a
                href={selectedPrescriptionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePrescriptions;
