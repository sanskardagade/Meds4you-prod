import React, { useEffect, useState } from "react";
import axios from "axios";

const ManageUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized access! Please log in again.");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPendingUsers(response.data);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      if (error.response?.status === 401) {
        alert("Unauthorized! Only admins can access this section.");
      }
    }
  };

  const approveUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized access! Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      setPendingUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Error approving user:", error);
      alert("Failed to approve user.");
    }
  };

  const rejectUser = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Unauthorized access! Please log in again.");
        return;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${id}/reject`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      setPendingUsers((prev) => prev.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("Failed to reject user.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage User Approvals</h2>
      {pendingUsers.length === 0 ? (
        <p className="text-gray-500">No pending user approvals.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Phone</th>
                  {/* <th className="px-4 py-2 text-left">Referral Code</th> */}
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user._id} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{user.phoneNumber}</td>
                    {/* <td className="px-4 py-2">{user.referralCode || "N/A"}</td> */}
                    <td className="px-4 py-2">
                      <button
                        onClick={() => approveUser(user._id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectUser(user._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
