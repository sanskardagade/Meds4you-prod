import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast} from "react-toastify";

const OrderMedicine = () => {
  const [file, setFile] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

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
        })
        .catch((err) => console.error("Failed to fetch addresses:", err));
    }
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileUploaded(true);
      setMessage("");

      // Create preview URL for image files
      if (selectedFile.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(selectedFile);
        setPreview(previewUrl);
      } else {
        setPreview(null);
      }

      // Reset prescription items when new file is selected
      setPrescriptionItems([]);
    }
  };

  // Cleanup preview URL when component unmounts or when preview changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleUpload = async () => {
    if (!isAuthenticated) {
      setMessage("Please log in to upload a prescription.");
      return;
    }
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }
    if (!selectedAddress) {
      setMessage("Please select a delivery address.");
      return;
    }

    setIsUploading(true);
    setMessage("");

    try {
      // Instead of doing the Cloudinary upload directly from frontend,
      // we'll send the file to our backend and let it handle the Cloudinary upload
      const formData = new FormData();
      formData.append("prescription", file);
      formData.append("address", JSON.stringify(selectedAddress));
      formData.append("instructions", instructions);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/prescriptions/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.items) {
        setPrescriptionItems(response.data.items);
      }

      setMessage(
        "Prescription uploaded successfully! Review your medicines below."
      );
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddToCart = async (item, isRecommended = false) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/add`,
        {
          productId: isRecommended ? item.recommendedMedicine.id : item.id,
          quantity: item.quantity || 1,
          isRecommended,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Added to cart successfully!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      toast.error("Failed to add to cart", {
        position: "top-right",
      });
      console.error("Error adding to cart:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-[#e3ecf8] rounded-2xl p-6 sm:p-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Order Medicine by Prescription
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-2">
            Please log in to upload your prescription and place an order.
          </p>

          <div className="flex justify-center mt-6">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="Login Illustration"
              className="w-32 sm:w-40 md:w-48"
            />
          </div>

          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full bg-[#FF007F] text-white font-semibold text-sm sm:text-base px-5 py-3 rounded-lg shadow-lg transform transition duration-300 hover:bg-[#E60072] hover:scale-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Log In to Continue
          </button>

          <p className="text-xs sm:text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <span
              className="text-blue-600 font-semibold cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-28 items-center justify-center min-h-screen bg-gradient-to-br bg-[#FFF0F5] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl space-y-6 p-6 sm:p-8 bg-white shadow-xl rounded-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
          Order Medicine by Prescription
        </h1>
        <p className="text-gray-600 text-center text-sm sm:text-base">
          Follow these steps to place your order:
        </p>
        <ul className="list-decimal list-inside space-y-2 text-gray-700 text-sm sm:text-base">
          <li>Upload prescription.</li>
          <li>Select delivery address.</li>
          <li>Provide special instructions (if any).</li>
          <li>Review medicines and add to cart.</li>
          <li>Proceed to checkout.</li>
        </ul>

        <div className="relative">
          <label
            htmlFor="prescription"
            className="block text-sm font-bold text-gray-700 mb-2"
          >
            Upload Prescription
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
            <input
              type="file"
              id="prescription"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 focus:outline-none"
            />
            {fileUploaded && (
              <span className="ml-2 text-green-600 font-semibold text-lg">
                ✔
              </span>
            )}
          </div>
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Prescription preview"
                className="max-w-xs rounded-lg shadow-md"
              />
            </div>
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mt-4">
          Select Delivery Address
        </h2>

        {addresses.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500">
            No saved addresses. Add from profile section.
          </p>
        ) : (
          <div className="space-y-2">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`border p-3 rounded-lg cursor-pointer transition ${
                  selectedAddress?._id === address._id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedAddress(address)}
              >
                <p className="font-semibold">
                  {address.street}, {address.city}, {address.state}
                </p>
                <p className="text-sm text-gray-600">
                  {address.zipCode}, {address.country}
                </p>
                {address.isPrimary && (
                  <span className="text-xs text-green-600 font-medium">
                    Default Address
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <label
          htmlFor="instructions"
          className="block text-sm font-medium text-gray-700 mt-4"
        >
          Special Instructions (Optional)
        </label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e.g., Preferred delivery time, medicine dosage details"
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        ></textarea>

        {message && (
          <p
            className={`text-sm sm:text-base font-medium text-center ${
              message.includes("successfully")
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`w-full text-white font-semibold text-sm sm:text-base px-4 py-2 rounded-lg shadow transition ${
            isUploading
              ? "bg-red-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
        >
          {isUploading ? "Uploading..." : "Upload Prescription"}
        </button>

        {prescriptionItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Prescribed Medicines</h2>
            <div className="bg-white rounded-lg shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-left">No.</th>
                    <th
                      colSpan="3"
                      className="py-2 px-3 text-left border-r border-gray-200"
                    >
                      Regular Medicine
                    </th>
                    <th colSpan="3" className="py-2 px-3 text-left">
                      Recommended Alternative
                    </th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-3 text-left">Sr.no.</th>
                    <th className="py-3 px-3 text-left">Name</th>
                    <th className="py-3 px-3 text-left">Price</th>
                    <th className="py-3 px-3 text-left border-r border-gray-200">
                      Action
                    </th>
                    <th className="py-3 px-3 text-left">Name</th>
                    <th className="py-3 px-3 text-left">Price</th>
                    <th className="py-3 px-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-4 px-3">{index + 1}</td>
                      <td className="py-4 px-3">{item.name}</td>
                      <td className="py-4 px-3">₹{item.price}</td>
                      <td className="py-4 px-3 border-r border-gray-200">
                        <button
                          onClick={() => handleAddToCart(item, false)}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Add to Cart
                        </button>
                      </td>
                      <td className="py-4 px-3">
                        {item.recommendedMedicine?.name || "N/A"}
                      </td>
                      <td className="py-4 px-3">
                        {item.recommendedMedicine
                          ? `₹${item.recommendedMedicine.price}`
                          : "N/A"}
                      </td>
                      <td className="py-4 px-3">
                        {item.recommendedMedicine && (
                          <button
                            onClick={() => handleAddToCart(item, true)}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            Add to Cart
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderMedicine;
