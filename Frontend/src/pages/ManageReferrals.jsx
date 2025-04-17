import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import axios from "axios";

const ManageReferrals = ({ userReferralCode }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const token = localStorage.getItem("token"); // Get the token from storage
        if (!token) {
          console.error("No token found. Please log in.");
          return;
        }

        const response = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/users/referrals/${userReferralCode}`,
          {
            headers: { Authorization: `Bearer ${token}` }, // Attach token
          }
        );

        setReferrals(response.data.referredUsers);
      } catch (error) {
        console.error(
          "Error fetching referrals",
          error.response?.data || error
        );
      } finally {
        setLoading(false);
      }
    };

    if (userReferralCode) {
      fetchReferrals();
    }
  }, [userReferralCode]);

  // Function to copy referral code to clipboard
  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2s
      })
      .catch((err) => console.error("Failed to copy:", err));
  };

  const signupLink = `https://meds4you.in/register?referral=${userReferralCode}`;

  return (
    <div className="max-w-3xl rounded-xl p-3 mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">My Referrals</h2>

      {/* Signup Link Section */}
      <div className="flex flex-col sm:flex-row items-center gap-2 p-2 mt-3 bg-white rounded-md shadow-sm">
        <h2 className="text-xs sm:text-sm">Referral link to share</h2>
        <input
          type="text"
          value={signupLink}
          readOnly
          className="flex-1 text-sm text-gray-700 bg-gray-100 p-2 border rounded-md truncate"
        />
        <button
          onClick={() => copyToClipboard(signupLink, setCopiedLink)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
        >
          {copiedLink ? <Check size={16} /> : <Copy size={16} />}
          {copiedLink ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Referrals List */}
      <div className="mt-3 p-2">
        <h1 className="font-semibold text-sm">My Referral Customer List</h1>
        {loading ? (
          <p className="text-gray-500 text-center text-sm">
            Loading referrals...
          </p>
        ) : referrals.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto p-2">
              <table className="min-w-full table-auto text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-3 text-left font-medium text-gray-700">
                      Sr. No.
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700">
                      Name
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700">
                      Email
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700">
                      Phone Number
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700">
                      Date
                    </th>
                    <th className="py-2 px-3 text-left font-medium text-gray-700">
                      Last Transaction Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((user, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      {console.log(user)}
                      <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                      <td className="py-2 px-3 text-gray-600">{user.name}</td>
                      <td className="py-2 px-3 text-gray-600">{user.email}</td>
                      <td className="py-2 px-3 text-gray-600">
                        {user.phoneNumber}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {user.updatedAt
                          ? new Date(user.updatedAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              }
                            )
                          : "N/A"}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {user.lastTransactionDate
                          ? new Date(
                              user.lastTransactionDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {referrals.map((user, index) => (
                <div
                  key={index}
                  className="bg-white rounded-md shadow-sm mb-2 p-2 border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div className="truncate flex-1">
                      <div className="text-xs text-gray-500">Name:</div>
                      <div className="text-sm font-medium truncate">
                        {user.name}
                      </div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="text-xs text-gray-500">Email:</div>
                      <div className="text-sm font-semibold">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline mt-2">
                    <div className="text-xs text-gray-500">Phone:</div>
                    <div className="text-sm font-semibold">
                      {user.phoneNumber}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    Date:{" "}
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                        })
                      : "N/A"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last Transaction:{" "}
                    {user.lastTransactionDate
                      ? new Date(user.lastTransactionDate).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center text-sm">
            No referrals found.
          </p>
        )}
      </div>
    </div>
  );
};

export default ManageReferrals;
