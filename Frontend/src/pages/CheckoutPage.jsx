import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import UploadPrescriptionAtUpload from "../components/uploadPrescriptionAtOrder";

const CheckoutPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [prescriptionUrl, setPrescriptionUrl] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const selectedProducts = location.state?.selectedProducts || [];
  // console.log(selectedProducts);
  const totalAmount = location.state?.total || "0.00";

  const handlePrescriptionUpload = async (file) => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("prescription", file);

    try {
      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/upload-prescription`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Upload response:", response.data);

      if (response.data.success) {
        setPrescriptionUrl(response.data.fileUrl);
        toast.success("Prescription uploaded successfully!");
      } else {
        throw new Error(response.data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading prescription:", error);
      toast.error(error.response?.data?.error || error.message || "Failed to upload prescription");
      setPrescriptionUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (url) => {
    setPrescriptionUrl(url); // Set the prescription URL when it's selected
    setFile(url); // Also set the file state with the URL
  };

  useEffect(() => {
    if (token) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/users/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const sortedAddresses = response.data?.addresses
            ? [...response.data.addresses].sort(
                (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
              )
            : [];

          setAddresses(sortedAddresses);
          setSelectedAddress(
            sortedAddresses.find((addr) => addr.isPrimary) ||
              sortedAddresses[0] ||
              null
          );
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to fetch addresses");
          setLoading(false);
          console.error("Failed to fetch addresses:", err);
        });
    } else {
      setLoading(false);
      navigate("/login");
    }
  }, [token, navigate]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
  };

  const handlePlaceOrder = async () => {
    try {
      setError("");
      setIsUploading(true);

      if (!selectedAddress) {
        setError("Please select an address to proceed.");
        toast.error("Please select an address.", { position: "top-center" });
        return;
      }

      if (selectedProducts.length === 0) {
        setError("No products selected.");
        toast.error("No products selected.", { position: "top-center" });
        return;
      }

      if (!prescriptionUrl) {
        setError("Please upload a prescription.");
        toast.error("Please upload a prescription.", { position: "top-center" });
        return;
      }

      // Format products data
      const formattedProducts = selectedProducts.map(product => ({
        productId: {
          _id: product.productId._id,
          drugName: product.productId.drugName,
          price: product.productId.price,
          manufacturer: product.productId.manufacturer,
          alternateMedicines: product.productId.alternateMedicines || [],
        },
        quantity: product.quantity,
        selection: product.selection
      }));

      // Create order
      const orderResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/create`,
        {
          address: selectedAddress,
          products: formattedProducts,
          prescriptionUrl: prescriptionUrl,
          totalAmount: parseFloat(totalAmount)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (orderResponse.data.success) {
        toast.success("Order placed successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
        
        // Clear form and redirect
        setFile(null);
        setSelectedAddress(null);
        
        // Navigate to order summary after a short delay
        setTimeout(() => {
          navigate("/order-summary");
        }, 5000);
      }
    } catch (error) {
      console.error("Order placement error:", error);
      setError(error.response?.data?.error || "Failed to place order");
      toast.error(error.response?.data?.error || "Failed to place order", {
        position: "top-center",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    // Disable back navigation after order placement by intercepting the back button
    window.onpopstate = () => {
      window.history.go(1); // This prevents going back to the previous page
    };

    // Cleanup when component is unmounted or the user navigates away
    return () => {
      window.onpopstate = null;
    };
  }, []);

  // Mobile Order Summary Card Component
  const MobileOrderSummaryCard = ({ item, index }) => {
    const product = item?.productId;
    const alternate = product?.alternateMedicines?.[0];
    const selection = item.selection || "original";
    const isRecommended = selection === "recommended";

    const medicineToShow =
      isRecommended && alternate
        ? {
            name: alternate.name,
            manufacturer: alternate.manufacturer,
            price: alternate.price,
            isImage: true,
          }
        : {
            name: product?.drugName,
            manufacturer: product?.manufacturer,
            price: product?.price,
            isImage: false,
          };

    return (
      <div className=" px-3 py-2 rounded-md shadow-sm mb-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">#{index + 1}</span>
            <span
              className={`px-1.5 py-0.5 rounded ${
                isRecommended
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {isRecommended ? "R" : "S"}
            </span>
          </div>
          <div className="text-right font-medium">
            ₹{(medicineToShow.price * item.quantity).toFixed(2)}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="truncate flex-1">
            <span className="font-medium">{medicineToShow.name}</span>
            <span className="text-gray-500 ml-1">x{item.quantity}</span>
          </div>
        </div>
      </div>
    );
  };

  const DesktopOrderTable = () => (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="py-3 px-4 text-left border-b">No.</th>
            <th className="py-3 px-4 text-left border-b">Medicine Name</th>
            <th className="py-3 px-4 text-left border-b">Manufacturer</th>
            <th className="py-3 px-4 text-left border-b">Type</th>
            <th className="py-3 px-4 text-left border-b">Price/Unit (Rs.)</th>
            <th className="py-3 px-4 text-left border-b">Quantity</th>
            <th className="py-3 px-4 text-left border-b">Total (Rs.)</th>
          </tr>
        </thead>
        <tbody>
          {selectedProducts.map((item, index) => {
            const product = item?.productId;
            const alternate = product?.alternateMedicines?.[0];
            const selection = item.selection || "original";
            const isRecommended = selection === "recommended";

            const medicineToShow =
              isRecommended && alternate
                ? {
                    name: alternate.name,
                    manufacturer: alternate.manufacturer,
                    price: alternate.price,
                    isImage: true,
                  }
                : {
                    name: product?.drugName,
                    manufacturer: product?.manufacturer,
                    price: product?.price,
                    isImage: false,
                  };

            return (
              <tr key={index} className="border-b">
                <td className="py-4 px-4">{index + 1}</td>
                <td className="py-4 px-4">{medicineToShow.name}</td>
                <td className="py-4 px-4">{medicineToShow.manufacturer}</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      isRecommended
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isRecommended ? "Recommended" : "Selected"}
                  </span>
                </td>
                <td className="py-4 px-4">{medicineToShow.price}</td>
                <td className="py-4 px-4">{item.quantity}</td>
                <td className="py-4 px-4">
                  {(medicineToShow.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 font-semibold">
            <td colSpan="6" className="py-4 px-4 text-right">
              Total Amount:
            </td>
            <td className="py-4 px-4 text-green-600 font-bold">
              ₹ {totalAmount}
            </td>
          </tr>
        </tbody>
      </table>  
    </div>
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <p className="text-gray-500">Loading checkout details...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 py-10 px-6 sm:px-12 pt-28">
      <div className="max-w-8xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 sm:mb-8">
          Checkout
        </h1>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Address Selection Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            Select Shipping Address
          </h2>

          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((address) => (
                <div
                  key={address._id}
                  className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                    selectedAddress?._id === address._id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-400"
                  }`}
                  onClick={() => handleAddressSelect(address)}
                >
                  <div className="flex items-start sm:items-center">
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress?._id === address._id}
                      onChange={() => handleAddressSelect(address)}
                      className="w-4 h-4 mt-1 sm:mt-0 text-green-600"
                    />
                    <div className="ml-3 sm:ml-4">
                      <h3 className="font-semibold">{address.street}</h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {address.city}, {address.state}
                      </p>
                      <p className="text-sm sm:text-base text-gray-600">
                        {address.country}, {address.zipCode}
                      </p>
                      {address.isPrimary && (
                        <span className="text-xs sm:text-sm text-green-600 font-medium">
                          Default Address
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Warning message when no addresses are available
            <div className="text-center p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-600 font-semibold">
                No shipping address found. Please add an address from your
                profile.
              </p>
              <button
                onClick={() => (window.location.href = "/profile")} // Change URL as needed
                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Go to Profile
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <h2 className="text-lg sm:text-xl font-bold p-4 sm:p-6 border-b">
            Order Summary
          </h2>

          {/* Mobile View */}
          <div className="block lg:hidden p-4">
            {selectedProducts.map((item, index) => (
              <MobileOrderSummaryCard key={index} item={item} index={index} />
            ))}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center font-semibold">
                <span>Total Amount:</span>
                <span className="text-green-600">₹ {totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Desktop View */}
          <DesktopOrderTable />
        </div>

        <UploadPrescriptionAtUpload
          onFileSelect={handlePrescriptionUpload}
          token={token}
        />

        {/* Place Order Button */}
        <div className="flex justify-center px-4 sm:px-0">
          <button
            onClick={handlePlaceOrder}
            disabled={!selectedAddress || !prescriptionUrl}
            className={`
            w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg text-white text-base sm:text-lg font-semibold
            transition-all duration-300
            ${
              selectedAddress && prescriptionUrl
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }
          `}
          >
            Place Order: ₹ {totalAmount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
