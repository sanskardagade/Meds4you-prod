import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FileText } from "lucide-react";
import axios from "axios";
import { loginSuccess, logout } from "../redux/slice/authSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManageReferrals from "./ManageReferrals";

const Profile = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    isPrimary: false,
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedSection, setSelectedSection] = useState("profileInfo");
  const [prescriptions, setPrescriptions] = useState([]);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderItems, setReorderItems] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/prescriptions/user`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPrescriptions(response.data);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      }
    };

    if (token) {
      fetchPrescriptions();
    }
  }, [token]);

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        dispatch(logout());
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
        setAddresses(response.data.addresses || []);
      } catch (error) {
        console.error("Authentication failed:", error);
        dispatch(logout());
      }
    };

    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/order-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrderHistory(response.data);
      } catch (error) {
        console.error("Error fetching order history:", error);
      }
    };

    verifyUser();
    fetchOrders();
  }, [token, dispatch]);

  const handleAddAddress = async () => {
    if (
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.zip ||
      !newAddress.country
    ) {
      toast.error("All fields are required to add an address.");
      return;
    }

    const addressData = {
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      zipCode: newAddress.zip,
      country: newAddress.country,
      isPrimary: newAddress.isPrimary,
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/address`,
        {
          userId: user._id,
          address: addressData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Address added successfully!", {
        position: "top-center",
        autoClose: 2000,
      });
      setAddresses([...response.data.addresses]);
      setNewAddress({
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        isPrimary: false,
      });
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Error adding address.");
    }
    setShowAddressForm(false);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/address/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses(response.data);
      toast.success("Address deleted successfully!", {
        position: "top-center",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Error deleting address.");
    }
  };

  const handleSetPrimaryAddress = async (addressId) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/address/${addressId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Ensure the primary address appears first
      const sortedAddresses = response.data
        .slice() // Create a copy to avoid modifying state directly
        .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)); // Sort: primary first

      setAddresses(sortedAddresses);

      // toast.success("Default address set successfully!", {
      //   position: "top-center",
      //   autoClose: 2000,
      // });
    } catch (error) {
      toast.error("Error setting primary address.");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleReorderClick = async (order) => {
    try {
      // Get the original order details
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${order._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Set the items for reordering
      setReorderItems(response.data.items.map(item => ({
        ...item,
        selected: true // Add a selected flag for each item
      })));
      setShowReorderModal(true);
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    }
  };

  const handleReorderSubmit = async () => {
    try {
      setIsReordering(true);
      // Filter only selected items and remove the selected flag
      const selectedItems = reorderItems
        .filter(item => item.selected)
        .map(({ selected, ...item }) => item);

      if (selectedItems.length === 0) {
        toast.error("Please select at least one item to reorder");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/reorder`,
        { items: selectedItems },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        toast.success("Order placed successfully!");
        setShowReorderModal(false);
        // Refresh order history
        const updatedOrders = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/order-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrderHistory(updatedOrders.data);
        navigate(`/order-summary`);
      }
    } catch (error) {
      console.error("Error reordering:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setIsReordering(false);
    }
  };

  const handlePaymentClick = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('paymentProof', file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${selectedOrder._id}/payment-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Payment proof uploaded successfully!');
        // Refresh order history
        const updatedOrders = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/order-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrderHistory(updatedOrders.data);
      }
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      toast.error(error.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setIsUploading(false);
      setShowPaymentModal(false);
    }
  };

  const handleAddressProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('addressProof', file);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/${selectedOrder._id}/address-proof`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success('Address proof uploaded successfully!');
        // Refresh order history
        const updatedOrders = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/order-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrderHistory(updatedOrders.data);
      }
    } catch (error) {
      console.error('Error uploading address proof:', error);
      toast.error(error.response?.data?.message || 'Failed to upload address proof');
    } finally {
      setIsUploading(false);
      setShowAddressModal(false);
    }
  };

  const handleAddressProofClick = (order) => {
    setSelectedOrder(order);
    setShowAddressModal(true);
  };

  return (
    <div className="min-h-screen p-4 md:p-36 flex flex-col md:flex-row mt-24 md:mt-0">
      {/* Sidebar */}
      <div className="w-full md:w-1/4 bg-pink-100 p-3 md:p-6 rounded-lg mb-4 md:mb-0 md:mr-4">
        {/* Header - Compact on mobile */}
        <div className="text-lg md:text-2xl font-roboto font-semibold mb-2 md:mb-6">
          Hello! {user ? user.name : "Not Logged In"}
        </div>

        {/* Navigation - Horizontal scroll on mobile, vertical on desktop */}
        <div className="md:hidden flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          {/* Mobile buttons */}

          <button
            onClick={() => setSelectedSection("profileInfo")}
            className={`whitespace-nowrap px-3 py-2 rounded-md text-sm transition ${
              selectedSection === "profileInfo"
                ? "bg-[#64c3ef] text-white"
                : "bg-[#e5eff5] hover:bg-[#a0d8f5]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setSelectedSection("manageAddress")}
            className={`whitespace-nowrap px-3 py-2 rounded-md text-sm transition ${
              selectedSection === "manageAddress"
                ? "bg-[#64c3ef] text-white"
                : "bg-[#e5eff5] hover:bg-[#a0d8f5]"
            }`}
          >
            Address
          </button>
          <button
            onClick={() => setSelectedSection("orderHistory")}
            className={`whitespace-nowrap px-3 py-2 rounded-md text-sm transition ${
              selectedSection === "orderHistory"
                ? "bg-[#64c3ef] text-white"
                : "bg-[#e5eff5] hover:bg-[#a0d8f5]"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setSelectedSection("managePrescriptions")}
            className={`whitespace-nowrap px-3 py-2 rounded-md text-sm transition ${
              selectedSection === "managePrescriptions"
                ? "bg-[#64c3ef] text-white"
                : "bg-[#e5eff5] hover:bg-[#a0d8f5]"
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setSelectedSection("manageReferrals")}
            className={`whitespace-nowrap px-3 py-2 rounded-md text-sm transition ${
              selectedSection === "manageReferrals"
                ? "bg-[#64c3ef] text-white"
                : "bg-[#e5eff5] hover:bg-[#a0d8f5]"
            }`}
          >
            Referrals
          </button>
        </div>
        <span className="md:hidden text-sm text-gray-600 italic pl-2">
          Swipe for more
        </span>

        {/* Desktop Navigation */}
        <div className="hidden md:grid md:grid-cols-1 gap-4">
          <button
            onClick={() => setSelectedSection("profileInfo")}
            className={`w-full p-3 rounded-md transition ${
              selectedSection === "profileInfo"
                ? "bg-[#3ab6ef] text-white"
                : "bg-[#fefdfd] hover:bg-[#a0d8f5]"
            }`}
          >
            User Profile
          </button>
          <button
            onClick={() => setSelectedSection("manageAddress")}
            className={`w-full p-3 rounded-md transition ${
              selectedSection === "manageAddress"
                ? "bg-[#3ab6ef] text-white"
                : "bg-[#fefdfd] hover:bg-[#a0d8f5]"
            }`}
          >
            Manage Address
          </button>
          <button
            onClick={() => setSelectedSection("orderHistory")}
            className={`w-full p-3 rounded-md transition ${
              selectedSection === "orderHistory"
                ? "bg-[#3ab6ef] text-white"
                : "bg-[#fefdfd] hover:bg-[#a0d8f5]"
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setSelectedSection("managePrescriptions")}
            className={`w-full p-3 rounded-md transition ${
              selectedSection === "managePrescriptions"
                ? "bg-[#3ab6ef] text-white"
                : "bg-[#fefdfd] hover:bg-[#a0d8f5]"
            }`}
          >
            My Prescriptions
          </button>
          <button
            onClick={() => setSelectedSection("manageReferrals")}
            className={`w-full p-3 rounded-md transition ${
              selectedSection === "manageReferrals"
                ? "bg-[#3ab6ef] text-white"
                : "bg-[#fefdfd] hover:bg-[#a0d8f5]"
            }`}
          >
            My Referrals
          </button>
          <button
            onClick={handleLogout}
            className="text-lg font-semibold w-32 p-2 transition bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#fff] p-4 md:p-6 rounded-lg  shadow-lg">
        {selectedSection === "profileInfo" && (
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              User Profile
            </h2>
            <div className="space-y-4 p-4">
              <p>
                <strong>Name:</strong> {user ? user.name : "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {user ? user.email : "N/A"}
              </p>
              <p>
                <strong>Phone Number:</strong> {user ? user.phoneNumber : "N/A"}
              </p>
              <p>
                <strong>BDA1:</strong> {user?.BDA1 || "N/A"}
              </p>
              <p>
                <strong>BDA2:</strong> {user?.BDA2 || "N/A"}
              </p>

              {/* Display Primary Address */}
              {user?.addresses?.length > 0 ? (
                user.addresses.map((address) =>
                  address.isPrimary ? (
                    <p key={address._id}>
                      <strong>Default Address:</strong>{" "}
                      {`${address.street}, ${address.city}, ${address.state}, ${address.zipCode}, ${address.country}`}
                    </p>
                  ) : null
                )
              ) : (
                <p>
                  <strong>Default Address:</strong> Not set. Please add an
                  address.
                </p>
              )}
            </div>
          </div>
        )}

        {selectedSection === "manageAddress" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Addresses</h2>
            <div className="space-y-4 p-4">
              {addresses.length === 0 ? (
                <div>
                  <p className="text-lg text-gray-600">
                    No addresses found. Add a new address.
                  </p>
                </div>
              ) : (
                addresses
                  .slice() // Create a copy to avoid mutating state directly
                  .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)) // Sort to keep the primary address on top
                  .map((address) => (
                    <div
                      key={address._id}
                      className="bg-gray-50 p-3 rounded-md shadow-md mb-3"
                    >
                      {/* Address Title */}
                      <p className="font-semibold text-xs sm:text-sm">
                        {address.isPrimary ? "Default Address" : ""}
                      </p>

                      {/* Address Details */}
                      <p className="text-xs sm:text-sm my-1">
                        {address.street}, {address.city}, {address.state} -{" "}
                        {address.zipCode}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 justify-between">
                        {!address.isPrimary && (
                          <button
                            onClick={() => handleSetPrimaryAddress(address._id)}
                            className="bg-blue-500 text-white py-1 px-3 rounded-md text-xs sm:text-sm hover:bg-blue-600"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address._id)}
                          className="bg-red-500 text-white py-1 px-3 rounded-md text-xs sm:text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="m-2 w-44 bg-blue-500 text-white py-2 rounded-md mt-4 hover:bg-blue-600"
            >
              {showAddressForm ? "Cancel" : "Add New Address"}
            </button>

            {showAddressForm && (
              <div className="mt-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Flat, House no., Building, Company, Apartment"
                  value={newAddress.street}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, street: e.target.value })
                  }
                  className="border p-3 rounded-md w-full"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, city: e.target.value })
                  }
                  className="border p-3 rounded-md w-full"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, state: e.target.value })
                  }
                  className="border p-3 rounded-md w-full"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={newAddress.zip}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, zip: e.target.value })
                  }
                  className="border p-3 rounded-md w-full"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={newAddress.country}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, country: e.target.value })
                  }
                  className="border p-3 rounded-md w-full"
                />
                <div className="col-span-2 flex justify-center sm:justify-start">
                  <button
                    onClick={handleAddAddress}
                    className="w-full sm:w-auto bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition"
                  >
                    Add Address
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedSection === "orderHistory" && (
          <div className="max-w-4xl bg-white">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Order History
            </h2>

            {orderHistory.length === 0 ? (
              <p className="text-gray-500">No orders found.</p>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto p-4">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                          Sr. No.
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                          Order ID
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                          Date
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                          Total
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderHistory.map((order, index) => (
                        <tr key={order._id} className="border-b border-gray-200">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {order._id}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            ₹{order.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {order.orderStatus}
                          </td>
                          <td className="py-3 px-4 text-sm text-center">
                            {order.orderStatus === 'processing' ? (
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleAddressProofClick(order)}
                                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                >
                                  Upload Address Proof
                                </button>
                                <button
                                  onClick={() => handleReorderClick(order)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                >
                                  Reorder
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleReorderClick(order)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                              >
                                Reorder
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden">
                  {orderHistory.map((order, index) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-lg shadow-sm mb-2 p-3 border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            order.orderStatus === "Delivered"
                              ? "bg-green-100 text-green-700"
                              : order.orderStatus === "Processing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <div className="truncate flex-1">
                          <div className="text-xs text-gray-500">Order ID:</div>
                          <div className="text-sm font-medium truncate">
                            {order._id}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-xs text-gray-500">Amount:</div>
                          <div className="text-sm font-semibold">
                            ₹{order.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>

                      <div className="mt-2 flex justify-end gap-2">
                        {order.orderStatus === 'processing' ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleAddressProofClick(order)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              Upload Address Proof
                            </button>
                            <button
                              onClick={() => handleReorderClick(order)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                            >
                              Reorder
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleReorderClick(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs transition-colors"
                          >
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {selectedSection === "managePrescriptions" && (
          <div className="max-w-4xl bg-white">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              My Prescriptions
            </h2>

            {prescriptions.length === 0 ? (
              <p className="text-gray-500 p-4">No prescriptions uploaded.</p>
            ) : (
              <div className="space-y-4">
                {/* Table for laptops and larger screens */}
                <div className="hidden lg:block">
                  <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Sr. No.</th>
                        <th className="px-4 py-2 text-left">
                          Prescription Link
                        </th>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((prescription, index) => {
                        return (
                          <tr key={prescription._id} className="border-b">
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">
                              <a
                                href={prescription.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Prescription
                              </a>
                            </td>
                            <td className="px-4 py-2">
                              {prescription.uploadedAt
                                ? new Date(
                                    prescription.uploadedAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2">
                              {prescription.status || "Pending"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Card view for mobile */}
                <div className="lg:hidden">
                  {prescriptions.map((prescription) => {
                    return (
                      <div
                        key={prescription._id}
                        className="flex flex-col sm:flex-row items-start p-4 border border-gray-200 rounded-lg shadow-sm space-y-4 sm:space-y-0 sm:space-x-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:space-x-4">
                          <p className="font-medium text-gray-900">
                            <strong>Uploaded:</strong>{" "}
                            {prescription.uploadedAt
                              ? new Date(
                                  prescription.uploadedAt
                                ).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p className="text-gray-700">
                            <strong>Status:</strong>{" "}
                            {prescription.status || "Pending"}
                          </p>
                        </div>

                        <a
                          href={prescription.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline mt-2 sm:mt-0"
                        >
                          View Prescription
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedSection === "manageReferrals" && (
          <ManageReferrals userReferralCode={user.referralCode} />
        )}
      </div>

      {showReorderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Reorder Items</h2>
              <button
                onClick={() => setShowReorderModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 border-b text-left">Select</th>
                    <th className="py-2 px-4 border-b text-left">Product</th>
                    <th className="py-2 px-4 border-b text-left">Quantity</th>
                    <th className="py-2 px-4 border-b text-right">Price</th>
                    <th className="py-2 px-4 border-b text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={(e) => {
                            const newItems = [...reorderItems];
                            newItems[index].selected = e.target.checked;
                            setReorderItems(newItems);
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-2 px-4 border-b">
                        <div>
                          <p className="font-medium">{item.productDetails?.drugName}</p>
                          <p className="text-sm text-gray-500">{item.productDetails?.manufacturer}</p>
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...reorderItems];
                            newItems[index].quantity = parseInt(e.target.value) || 1;
                            setReorderItems(newItems);
                          }}
                          className="w-20 border rounded px-2 py-1"
                          disabled={!item.selected}
                        />
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        ₹{item.price?.toFixed(2)}
                      </td>
                      <td className="py-2 px-4 border-b text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="4" className="py-2 px-4 border-b text-right font-bold">
                      Total Amount:
                    </td>
                    <td className="py-2 px-4 border-b text-right font-bold">
                      ₹{reorderItems
                        .filter(item => item.selected)
                        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowReorderModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReorderSubmit}
                disabled={isReordering || !reorderItems.some(item => item.selected)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isReordering ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Payment Options</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {/* QR Code Section */}
              <div className="border p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                <div className="flex justify-center mb-2">
                  <img
                    src="/qr-code.png"
                    alt="Payment QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Scan this QR code to make the payment
                </p>
              </div>

              {/* Payment Proof Upload Section */}
              <div className="border p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Upload Payment Proof</h3>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handlePaymentProofUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Proof Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Upload Address Proof</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please upload a document that confirms your delivery address (e.g., utility bill, bank statement, etc.)
            </p>
            <div className="mb-4">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleAddressProofUpload}
                className="w-full"
                disabled={isUploading}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddressModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isUploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <ToastContainer /> */}
    </div>
  );
};

export default Profile;
