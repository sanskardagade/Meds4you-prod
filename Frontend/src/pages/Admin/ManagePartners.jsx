import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const ManagePartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized access! Please log in again.");
        return;
      }
  
      console.log("Fetching partners...");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/partners/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log("Partners response:", response.data);
      setPartners(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching partners:", error);
      if (error.response?.status === 401) {
        toast.error("Unauthorized! Only admins can access this section.");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch partners.");
      }
      setLoading(false);
    }
  };

  const approvePartner = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized access! Please log in again.");
        return;
      }
  
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/partners/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      toast.success(response.data.message);
      // Refresh the partners list
      fetchPartners();
    } catch (error) {
      console.error("Error approving partner:", error);
      toast.error("Failed to approve partner request.");
    }
  };

  const rejectPartner = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized access! Please log in again.");
        return;
      }
  
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/partners/${id}/reject`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      toast.success(response.data.message);
      // Refresh the partners list
      fetchPartners();
    } catch (error) {
      console.error("Error rejecting partner:", error);
      toast.error("Failed to reject partner request.");
    }
  };

  const viewDocument = async (partnerId, type) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized access! Please log in again.");
        return;
      }

      // Use our backend API to serve the file
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/partners/${partnerId}/${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob'
        }
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      // Open the PDF in a new window
      window.open(url, '_blank');
    } catch (error) {
      console.error(`Error viewing ${type}:`, error);
      toast.error(`Failed to view ${type.toUpperCase()}`);
    }
  };

  if (loading) {
    return <div className="p-6">Loading partners...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Partners</h2>
      {partners.length === 0 ? (
        <p className="text-gray-500">No partners found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Aadhar</th>
                <th className="px-4 py-2">PAN</th>
                <th className="px-4 py-2">Bank Details</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((partner) => (
                <tr key={partner._id} className="border-t">
                  <td className="px-4 py-2">{partner.name}</td>
                  <td className="px-4 py-2">{partner.email}</td>
                  <td className="px-4 py-2">{partner.phone}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded ${
                      partner.isApproved 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {partner.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => viewDocument(partner._id, 'aadhar')}
                      className="text-blue-500 hover:underline"
                    >
                      View Aadhar
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => viewDocument(partner._id, 'pan')}
                      className="text-blue-500 hover:underline"
                    >
                      View PAN
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setExpanded(expanded === partner._id ? null : partner._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      {expanded === partner._id ? "Hide" : "View"} Bank Details
                    </button>

                    {expanded === partner._id && (
                      <div className="mt-2 bg-gray-100 p-3 rounded shadow-md">
                        <p><strong>Account Holder:</strong> {partner.bankDetails?.accountHolderName}</p>
                        <p><strong>Bank Name:</strong> {partner.bankDetails?.bankName}</p>
                        <p><strong>Account Number:</strong> {partner.bankDetails?.accountNumber}</p>
                        <p><strong>IFSC Code:</strong> {partner.bankDetails?.ifscCode}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {!partner.isApproved && (
                      <>
                        <button 
                          onClick={() => approvePartner(partner._id)} 
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2"
                        >
                      Approve
                    </button>
                        <button 
                          onClick={() => rejectPartner(partner._id)} 
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                      Reject
                    </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagePartners;
