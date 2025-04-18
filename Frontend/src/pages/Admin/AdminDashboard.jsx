import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaEye, FaFilePdf, FaUserTie, FaPlus, FaSave, FaEnvelope } from "react-icons/fa";

// ✅ Redux Imports for Auth State Management
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slice/authSlice";
import ManagePrescriptions from "./ManagePrescriptions";
import ManagePartners from "./ManagePartners";
import ManageUsers from "./ManageUsers";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("manageProducts");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [authState, setAuthState] = useState(isAuthenticated);

  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Add this state for prescription preview
  const [selectedPrescriptionUrl, setSelectedPrescriptionUrl] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Move handleClosePrescription here, before it's used
  const handleClosePrescription = () => {
    if (selectedPrescriptionUrl) {
      window.URL.revokeObjectURL(selectedPrescriptionUrl);
      setSelectedPrescriptionUrl(null);
    }
  };

  // Add Gmail redirect function
  const handleGmailRedirect = (order) => {
    const subject = `Order #${order._id} - ${order.orderStatus}`;
    const body = `Hello ${order.userId?.name || 'Customer'},\n\nThis email is regarding your order #${order._id}.\n\nOrder Details:\n- Order Date: ${new Date(order.createdAt).toLocaleDateString()}\n- Total Amount: ₹${order.totalAmount?.toFixed(2)}\n- Order Status: ${order.orderStatus}\n- Payment Status: ${order.paymentStatus}\n\nThank you for choosing our service.\n\nBest regards,\nMeds4U Team`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 1,
    gstPercentage: 0
  });

  // Add new state for Add Medicine Modal
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    drugName: "",
    manufacturer: "",
    category: "",
    mrp: "",
    price: "",
    salt: "",
    size: "",
    ConditionTreated: "",
    Usage: "",
    CommonSideEffects: "",
    imageUrl: "",
    alternateMedicines: [{
      name: "",
      size_1: "",
      manufacturerURL: "",
      price: "",
      mrp: "",
      Discount: "",
      imageUrl: ""
    }]
  });

  useEffect(() => {
    setAuthState(isAuthenticated);
  }, [isAuthenticated]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!authState) return;
      try {
        const productResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/products/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Clean up the data before setting to state
        const cleanedProducts = productResponse.data.map(product => {
          // Keep _id but remove other MongoDB specific fields
          const { __v, createdAt, ...cleanProduct } = product;

          // Clean up alternate medicines
          const cleanedAlternates = product.alternateMedicines?.map(alt => {
            const { __v, createdAt, ...cleanAlt } = alt;
            return cleanAlt;
          }) || [];

          return {
            ...cleanProduct,
            _id: product._id, // Ensure _id is preserved
            alternateMedicines: cleanedAlternates,
            // Ensure these fields have values
            ConditionTreated: product.ConditionTreated || "",
            Usage: product.Usage || "",
            CommonSideEffects: product.CommonSideEffects || ""
          };
        });

        console.log("Cleaned Products:", cleanedProducts);
        setProducts(Array.isArray(cleanedProducts) ? cleanedProducts : []);
        setLoadingProducts(false);
      } catch (error) {
        console.error(
          "Error fetching products:",
          error.response?.data || error.message
        );
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, [authState]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!authState) return;
      try {
        const orderResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // console.log("Fetched Orders:", orderResponse.data);

        setOrders(orderResponse.data || []); // Update state with the fetched data
        setLoadingOrders(false);
      } catch (error) {
        console.error(
          "Error fetching orders:",
          error.response?.data || error.message
        );
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [authState]);

  useEffect(() => {
    const fetchPartners = async () => {
      if (!authState) return;
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/partners`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setPartners(response.data || []);
        setLoadingPartners(false);
      } catch (error) {
        console.error("Error fetching partners:", error);
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, [authState]);

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "token" && !event.newValue) {
        dispatch(logout());
        navigate("/login");
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, [dispatch, navigate]);

  const handleLogout = () => {
    dispatch(logout()); // ✅ Update Redux auth state
    setAuthState(false); // ✅ Force component to recognize logout
    navigate("/login"); // ✅ Redirect after logout
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/products/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== id)
      );
      toast.success("Product deleted successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const updateOrderStatus = async (orderId, status, paymentStatus) => {
    try {
      const response = await axios.put(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/admin/orders/${orderId}/status`,
        { orderStatus: status, paymentStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, orderStatus: status, paymentStatus }
            : order
        )
      );
      toast.success("Order Status updated successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error(
        "Error updating order status:",
        error.response?.data || error.message
      );
    }
  };

  const handleOrderClick = async (order) => {
    try {
      // Fetch additional details for the selected order (including user and product details)
      const orderResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${
          order._id
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Ensure you're using the orderResponse data properly by extracting properties
      const orderDetails = orderResponse.data;

      setSelectedOrderDetails(orderDetails); // Set the selected order details
      // console.log("Selected Order Details:", orderDetails);
    } catch (error) {
      console.error("Error fetching order details:", error);
    }
  };

  const handleQuantityChange = async (item, newQuantity) => {
    try {
      // Ensure newQuantity is a valid number and at least 1
      newQuantity = Math.max(1, parseInt(newQuantity) || 1);
      
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}/items/${item._id}/quantity`,
        { quantity: newQuantity },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSelectedOrderDetails(response.data);
      toast.success("Quantity updated successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity", {
        position: "top-center",
      });
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}/items/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Fetch the updated order details to ensure we have all the data
      const updatedOrderResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update the local state with the complete order details
      setSelectedOrderDetails(updatedOrderResponse.data);
      toast.success("Item deleted successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(error.response?.data?.message || "Failed to delete item", {
        position: "top-center",
      });
    }
  };

  const handleDeliveryChargeChange = async (newCharge) => {
    try {
      if (!selectedOrderDetails) return;

      const updatedOrder = {
        ...selectedOrderDetails,
        deliveryCharge: parseFloat(newCharge) || 0,
        totalAmountWithDelivery: selectedOrderDetails.totalAmount + (parseFloat(newCharge) || 0)
      };

      setSelectedOrderDetails(updatedOrder);

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}/delivery-charge`,
        { deliveryCharge: parseFloat(newCharge) || 0 },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setOrders(orders.map(order => 
        order._id === selectedOrderDetails._id ? response.data : order
      ));

      toast.success("Delivery charge updated successfully");
    } catch (error) {
      console.error("Error updating delivery charge:", error);
      toast.error("Failed to update delivery charge");
    }
  };

  const handleGenerateInvoice = async (orderId) => {
    try {
      setIsGeneratingInvoice(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}/generate-invoice`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: 'blob',
        }
      );

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);

      // Refresh order details to get the new invoice URL
      const orderResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSelectedOrderDetails(orderResponse.data);

      toast.success('Invoice generated and saved successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleViewInvoice = (invoiceUrl) => {
    if (!invoiceUrl) {
      toast.error('No invoice available. Please generate one first.');
      return;
    }
    window.open(invoiceUrl, '_blank');
  };

  // Update the handleViewPrescription function
  const handleViewPrescription = async (orderId) => {
    try {
      // Get the order details to get the prescription URL
      const orderResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const prescriptionUrl = orderResponse.data.prescriptionUrl;
      
      if (!prescriptionUrl) {
        toast.error("No prescription found for this order");
        return;
      }

      setSelectedPrescriptionUrl(prescriptionUrl);
      setShowPrescriptionModal(true);
    } catch (error) {
      console.error("Error fetching prescription:", error);
      toast.error("Failed to load prescription");
    }
  };

  const handleViewDocument = async (partnerId, type) => {
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

  const handleApprovePartner = async (partnerId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized access! Please log in again.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/partners/${partnerId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the partners list
      setPartners(partners.map(partner => 
        partner._id === partnerId 
          ? { ...partner, isApproved: !partner.isApproved }
          : partner
      ));

      toast.success(response.data.message || "Partner status updated successfully!");
    } catch (error) {
      console.error("Error updating partner status:", error);
      toast.error(error.response?.data?.message || "Failed to update partner status");
    }
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.productId) {
        toast.error("Please select a product", {
          position: "top-center",
        });
        return;
      }

      console.log("New Item:", newItem);
      console.log("All Products:", products);

      // Parse the product ID and check if it's an alternate medicine
      const [productId, isAlt, altIndex] = newItem.productId.split('|');
      console.log("Parsed Product ID:", productId);
      console.log("Is Alternate:", isAlt);
      console.log("Alt Index:", altIndex);
      
      // Find the base product
      const selectedProduct = products.find(p => p._id === productId);
      console.log("Selected Product:", selectedProduct);

      if (!selectedProduct) {
        toast.error("Please select a valid product", {
          position: "top-center",
        });
        return;
      }

      // If it's an alternate medicine, use the alternate medicine details
      const finalProduct = isAlt === 'alt' && selectedProduct.alternateMedicines?.[parseInt(altIndex)]
        ? {
            ...selectedProduct.alternateMedicines[parseInt(altIndex)],
            _id: selectedProduct._id, // Use the base product ID
            isAlternate: true,
            baseProductId: selectedProduct._id,
            alternateIndex: parseInt(altIndex) // Add the alternate index
          }
        : selectedProduct;

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}/items`,
        {
          productId: selectedProduct._id, // Always send the base product ID
          quantity: parseInt(newItem.quantity),
          price: parseFloat(finalProduct.price),
          gstPercentage: parseFloat(newItem.gstPercentage || 0),
          isAlternate: !!isAlt,
          alternateIndex: isAlt ? parseInt(altIndex) : undefined // Send the alternate index instead
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update the order details with the new item
      setSelectedOrderDetails(response.data);
      setShowAddItemModal(false);
      
      // Reset the form
      setNewItem({
        productId: "",
        quantity: 1,
        gstPercentage: 0
      });

      toast.success("Item added successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error(error.response?.data?.message || "Failed to add item", {
        position: "top-center",
      });
    }
  };

  // Add function to handle discount percentage updates
  const handleDiscountChange = async (newDiscountPercentage) => {
    try {
      // Ensure newDiscountPercentage is a valid number and between 0 and 100
      newDiscountPercentage = Math.min(100, Math.max(0, parseFloat(newDiscountPercentage) || 0));
      
      // Calculate the new total with discount
      const subtotal = selectedOrderDetails.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = (subtotal * newDiscountPercentage) / 100;
      const finalTotal = subtotal - discountAmount + (selectedOrderDetails.deliveryCharge || 0);
      
      // Update the order with the new discount and final total 
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}/discount`,
        { 
          discountPercentage: newDiscountPercentage,
          discountAmount: discountAmount,
          finalTotal: finalTotal
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSelectedOrderDetails(response.data);
      toast.success("Discount updated successfully!", {
        position: "top-center",
      });
    } catch (error) {
      console.error("Error updating discount:", error);
      toast.error(error.response?.data?.message || "Failed to update discount", {
        position: "top-center",
      });
    }
  };

  // Add function to handle GST percentage updates
  const handleGSTPercentageChange = async (item, newGSTPercentage) => {
    try {
      // Ensure newGSTPercentage is a valid number and between 0 and 100
      newGSTPercentage = Math.min(100, Math.max(0, parseFloat(newGSTPercentage) || 0));
      
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${selectedOrderDetails._id}/items/${item._id}`,
        { 
          quantity: item.quantity,
          price: item.price,
          gstPercentage: newGSTPercentage
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSelectedOrderDetails(response.data);
      toast.success("GST percentage updated successfully!");
    } catch (error) {
      console.error("Error updating GST percentage:", error);
      toast.error("Failed to update GST percentage");
    }
  };

  // Add function to handle alternate medicine changes
  const handleAlternateMedicineChange = (index, field, value) => {
    const updatedAlternates = [...newMedicine.alternateMedicines];
    updatedAlternates[index] = {
      ...updatedAlternates[index],
      [field]: value
    };
    setNewMedicine({
      ...newMedicine,
      alternateMedicines: updatedAlternates
    });
  };

  // Add function to add new alternate medicine
  const addAlternateMedicine = () => {
    setNewMedicine({
      ...newMedicine,
      alternateMedicines: [
        ...newMedicine.alternateMedicines,
        {
          name: "",
          size_1: "",
          manufacturerURL: "",
          price: "",
          mrp: "",
          Discount: "",
          imageUrl: ""
        }
      ]
    });
  };

  // Add function to remove alternate medicine
  const removeAlternateMedicine = (index) => {
    const updatedAlternates = newMedicine.alternateMedicines.filter((_, i) => i !== index);
    setNewMedicine({
      ...newMedicine,
      alternateMedicines: updatedAlternates
    });
  };

  // Add new function to handle adding medicine
  const handleAddMedicine = async () => {
    try {
      // Structure alternate medicines as a flat array without IDs
      const alternatesData = newMedicine.alternateMedicines.map(alt => ({
        name: alt.name || "",
        size_1: alt.size_1 || "",
        manufacturerURL: alt.manufacturerURL || "",
        price: alt.price || "0",
        mrp: alt.mrp || "0",
        Discount: alt.Discount || "0",
        imageUrl: alt.imageUrl || ""
      }));

      // Prepare main medicine data
      const medicineData = {
        drugName: newMedicine.drugName || "",
        manufacturer: newMedicine.manufacturer || "",
        category: newMedicine.category || "",
        mrp: newMedicine.mrp || "0",
        price: newMedicine.price || "0",
        salt: newMedicine.salt || "",
        size: newMedicine.size || "",
        ConditionTreated: newMedicine.ConditionTreated || "",
        Usage: newMedicine.Usage || "",
        CommonSideEffects: newMedicine.CommonSideEffects || "",
        imageUrl: newMedicine.imageUrl || "",
        alternateMedicines: alternatesData
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/products/createProduct`,
        medicineData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Clean up the response data
      const cleanedData = {
        ...response.data,
        id: response.data._id,
        alternateMedicines: response.data.alternateMedicines || []
      };

      // Remove MongoDB specific fields
      delete cleanedData._id;
      delete cleanedData.__v;
      delete cleanedData.createdAt;
      
      setProducts([...products, cleanedData]);
      setShowAddMedicineModal(false);
      setNewMedicine({
        drugName: "",
        manufacturer: "",
        category: "",
        mrp: "",
        price: "",
        salt: "",
        size: "",
        ConditionTreated: "",
        Usage: "",
        CommonSideEffects: "",
        imageUrl: "",
        alternateMedicines: [{
          name: "",
          size_1: "",
          manufacturerURL: "",
          price: "",
          mrp: "",
          Discount: "",
          imageUrl: ""
        }]
      });
      toast.success("Medicine added successfully!");
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast.error(error.response?.data?.message || "Failed to add medicine");
    }
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <nav className="mt-8">
          <button
            onClick={() => setActiveSection("manageProducts")}
            className={`w-full mb-4 px-4 py-2 rounded-md font-medium text-white ${
              activeSection === "manageProducts"
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            Manage Products
          </button>
          <button
            onClick={() => {
              // console.log("Setting active section to manageOrders");
              setActiveSection("manageOrders");
            }}
            className={`w-full mb-4 px-4 py-2 rounded-md font-medium text-white ${
              activeSection === "manageOrders"
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            Manage Orders
          </button>
          <button
            onClick={() => {
              // console.log("Setting active section to manageOrders");
              setActiveSection("managePrescription");
            }}
            className={`w-full mb-4 px-4 py-2 rounded-md font-medium text-white ${
              activeSection === "managePrescription"
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => {
              // console.log("Setting active section to manageOrders");
              setActiveSection("manageUsers");
            }}
            className={`w-full mb-4 px-4 py-2 rounded-md font-medium text-white ${
              activeSection === "manageUsers"
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => {
              // console.log("Setting active section to manageOrders");
              setActiveSection("managePartner");
            }}
            className={`w-full mb-4 px-4 py-2 rounded-md font-medium text-white ${
              activeSection === "managePartner"
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            Manage Partners
          </button>
          <button
            onClick={() => setActiveSection("partnersList")}
            className={`w-full mb-4 px-4 py-2 rounded-md font-medium text-white ${
              activeSection === "partnersList"
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            Partners List
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-4 px-4 py-2 rounded-md font-medium text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto bg-white">
        {/* Manage Products Section */}
        {activeSection === "manageProducts" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-lg font-semibold">Manage Products</h1>
              <button
                onClick={() => setShowAddMedicineModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <FaPlus /> Add Medicine
              </button>
            </div>
            {loadingProducts ? (
              <div>Loading products...</div>
            ) : products.length === 0 ? (
              <div>No products available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-xs text-left">
                      <th className="py-2 px-3 border-b">Image</th>
                      <th className="py-2 px-3 border-b">
                        Drug Name & Manufacturer
                      </th>
                      <th className="py-2 px-3 border-b">Category</th>
                      <th className="py-2 px-3 border-b">MRP (₹)</th>
                      <th className="py-2 px-3 border-b">Selling Price (₹)</th>
                      <th className="py-2 px-3 border-b">Salt Composition</th>
                      <th className="py-2 px-3 border-b">Size</th>
                      <th className="py-2 px-3 border-b">Condition Treated</th>
                      <th className="py-2 px-3 border-b">Usage</th>
                      <th className="py-2 px-3 border-b">Side Effects</th>
                      <th className="py-2 px-3 border-b">Recommended</th>
                      <th className="py-2 px-3 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id} className="text-xs border-b">
                        <td className="py-2 px-3">
                          <img
                            src={product.imageUrl || "default-image.jpg"}
                            alt={product.drugName}
                            className="w-12 h-12 object-cover mx-auto"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <p className="font-medium">{product.drugName}</p>
                          <p className="text-gray-500 text-xs">
                            {product.manufacturer}
                          </p>
                        </td>
                        <td className="py-2 px-3">{product.category}</td>
                        <td className="py-2 px-3">{(product.mrp||0).toFixed(2)}</td>
                        <td className="py-2 px-3">
                          {(product.price||0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3">{product.salt}</td>
                        <td className="py-2 px-3">{product.size || 'N/A'}</td>
                        <td className="py-2 px-3">{product.ConditionTreated || 'N/A'}</td>
                        <td className="py-2 px-3">{product.Usage || 'N/A'}</td>
                        <td className="py-2 px-3">{product.CommonSideEffects || 'N/A'}</td>
                        <td className="py-2 px-3">
                          {product.alternateMedicines.length > 0 ? (
                            <ul className="text-left space-y-1">
                              {product.alternateMedicines.map((alt, index) => (
                                <li key={index} className="border-b pb-1">
                                  <p className="font-medium">{alt.name}</p>
                                  <p className="text-gray-500 text-xs">
                                    {alt.manufacturer}
                                  </p>
                                  <p className="text-green-600 text-xs">
                                    MRP: ₹{(alt.mrp||0).toFixed(2)}
                                  </p>
                                  <p className="text-green-600 text-xs">
                                    Price: ₹{(alt.price||0).toFixed(2)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400">
                              No Alternatives
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => deleteProduct(product._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Manage Orders Section */}
        {activeSection === "manageOrders" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Manage Orders</h1>
            {loadingOrders ? (
              <div>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div>No orders available</div>
            ) : (
              <div className="overflow-x-auto px-6">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 pr-6 border-b">Order ID</th>
                      <th className="py-2 pr-6 border-b">Customer Name</th>
                      <th className="py-2 pr-6 border-b">Date</th>
                      <th className="py-2 pr-28 border-b">Order Status</th>
                      <th className="py-2 pr-24 border-b">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        onClick={() => handleOrderClick(order)}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        <td className="py-2 px-6 border-b">{order._id}</td>
                        <td className="py-2 px-6 border-b">{order.userId?.name || 'N/A'}</td>
                        <td className="py-2 px-6 border-b">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-10 border-b">
                          <select
                            value={order.orderStatus}
                            onChange={(e) =>
                              updateOrderStatus(
                                order._id,
                                e.target.value,
                                order.paymentStatus
                              )
                            }
                            className="border p-2 ml-8 rounded"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-2 px-14 border-b">
                          <select
                            value={order.paymentStatus}
                            onChange={(e) =>
                              updateOrderStatus(
                                order._id,
                                order.orderStatus,
                                e.target.value
                              )
                            }
                            className="border p-2 rounded"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {selectedOrderDetails && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <div className="flex gap-2">

                    <button
                        onClick={() => handleViewPrescription(selectedOrderDetails._id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        View Prescription
                      </button>


                    
                      <button
                        onClick={() => handleGenerateInvoice(selectedOrderDetails._id)}
                        disabled={isGeneratingInvoice}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2 disabled:bg-gray-400"
                      >
                        <FaFilePdf /> {isGeneratingInvoice ? 'Generating...' : 'Generate Invoice'}
                      </button>

                      <button
                        onClick={() => handleViewInvoice(selectedOrderDetails.invoiceUrl)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                      >
                        <FaEye /> View Invoice
                      </button>
                      
                      {selectedOrderDetails.paymentProof?.url && (
                        <button
                          onClick={() => window.open(selectedOrderDetails.paymentProof.url, '_blank')}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                        >
                          <FaFilePdf /> View Payment Proof
                        </button>
                      )}
                      
                      {selectedOrderDetails.addressProof?.url && (
                        <button
                          onClick={() => window.open(selectedOrderDetails.addressProof.url, '_blank')}
                          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 flex items-center gap-2"
                        >
                          <FaFilePdf /> View Address Proof
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleGmailRedirect(selectedOrderDetails)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                      >
                        <FaEnvelope /> Send Email
                      </button>
                      <button
                        onClick={() => setSelectedOrderDetails(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  {/* User Information Table */}
                  <div className="mb-8">
                    <h3 className="text-xl mb-4">User Information</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border">
                        <tbody>
                          <tr>
                            <td className="py-2 px-4 border-b font-medium">Name</td>
                            <td className="py-2 px-4 border-b">{selectedOrderDetails.userId?.name}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 border-b font-medium">Phone Number</td>
                            <td className="py-2 px-4 border-b">{selectedOrderDetails.userId?.phoneNumber}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 border-b font-medium">Order Number</td>
                            <td className="py-2 px-4 border-b">{selectedOrderDetails.orderNumber}</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 border-b font-medium">Order Date</td>
                            <td className="py-2 px-4 border-b">
                              {new Date(selectedOrderDetails.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2 px-4 border-b font-medium">Total Amount</td>
                            <td className="py-2 px-4 border-b">₹{selectedOrderDetails.totalAmount?.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-8">
                    <h3 className="text-xl mb-4">Delivery Address</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border">
                        <tbody>
                          <tr>
                            <td className="py-2 px-4 border-b font-medium">Address</td>
                            <td className="py-2 px-4 border-b">
                              {[
                                selectedOrderDetails.userId?.addresses?.[0]?.street,
                                selectedOrderDetails.userId?.addresses?.[0]?.city,
                                selectedOrderDetails.userId?.addresses?.[0]?.state,
                                selectedOrderDetails.userId?.addresses?.[0]?.zipCode
                              ].filter(Boolean).join(", ") || "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl">Order Items</h3>
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                      >
                        <FaPlus /> Add Item
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-2 px-4 border-b text-center">#</th>
                            <th className="py-2 px-4 border-b text-left">Product</th>
                            <th className="py-2 px-4 border-b text-left">Manufacturer</th>
                            <th className="py-2 px-4 border-b text-center">Quantity</th>
                            <th className="py-2 px-4 border-b text-right">Price</th>
                            <th className="py-2 px-4 border-b text-center">GST %</th>
                            <th className="py-2 px-4 border-b text-right">GST Amount</th>
                            <th className="py-2 px-4 border-b text-right">Item Total</th>
                            <th className="py-2 px-4 border-b text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrderDetails.items.map((item, index) => {
                            const subtotal = item.price * item.quantity;
                            const gstAmount = subtotal * (item.gstPercentage || 0) / 100;
                            const itemTotal = subtotal + gstAmount;
                            
                            return (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                                <td className="py-2 px-4 border-b">
                                  <div>
                                    <p className="font-medium">{item.productDetails?.drugName}</p>
                                    <p className="text-sm text-gray-500">{item.productDetails?.salt}</p>
                                  </div>
                                </td>
                                <td className="py-2 px-4 border-b">{item.productDetails?.manufacturer}</td>
                                <td className="py-2 px-4 border-b text-center">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleQuantityChange(item, e.target.value);
                                      }}
                                      className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </td>
                                <td className="py-2 px-4 border-b text-right">
                                  ₹{item.price?.toFixed(2)}
                                </td>
                                <td className="py-2 px-4 border-b text-center">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={item.gstPercentage || 0}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleGSTPercentageChange(item, e.target.value);
                                      }}
                                      className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="ml-1">%</span>
                                  </div>
                                </td>
                                <td className="py-2 px-4 border-b text-right">
                                  ₹{gstAmount.toFixed(2)}
                                </td>
                                <td className="py-2 px-4 border-b text-right">
                                  ₹{itemTotal.toFixed(2)}
                                </td>
                                <td className="py-2 px-4 border-b text-center">
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteItem(item);
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Summary rows */}
                          <tr>
                            <td colSpan="5" className="py-2 px-4 border-b text-right font-medium">
                              Subtotal
                            </td>
                            <td className="py-2 px-4 border-b text-right font-medium">
                              ₹{selectedOrderDetails.items.reduce((sum, item) => {
                                const subtotal = item.price * item.quantity;
                                const gstAmount = subtotal * (item.gstPercentage || 0) / 100;
                                return sum + subtotal + gstAmount;
                              }, 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-4 border-b"></td>
                          </tr>
                          <tr>
                            <td colSpan="5" className="py-2 px-4 border-b text-right font-medium">
                              Discount
                            </td>
                            <td className="py-2 px-4 border-b text-right font-medium">
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={selectedOrderDetails.discountPercentage || 0}
                                  onChange={(e) => handleDiscountChange(e.target.value)}
                                  className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="ml-1">%</span>
                                <span className="ml-2">
                                  (₹{selectedOrderDetails.discountAmount?.toFixed(2)})
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-4 border-b"></td>
                          </tr>
                          <tr>
                            <td colSpan="5" className="py-2 px-4 border-b text-right font-medium">
                              Delivery Charge
                            </td>
                            <td className="py-2 px-4 border-b text-right font-medium">
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={selectedOrderDetails.deliveryCharge || 0}
                                  onChange={(e) => handleDeliveryChargeChange(e.target.value)}
                                  className="w-16 px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="ml-1">₹</span>
                              </div>
                            </td>
                            <td className="py-2 px-4 border-b"></td>
                          </tr>
                          <tr>
                            <td colSpan="5" className="py-2 px-4 border-b text-right font-bold">
                              Final Total
                            </td>
                            <td className="py-2 px-4 border-b text-right font-bold">
                              ₹{(selectedOrderDetails.items.reduce((sum, item) => {
                                const subtotal = item.price * item.quantity;
                                const gstAmount = subtotal * (item.gstPercentage || 0) / 100;
                                return sum + subtotal + gstAmount;
                              }, 0) - (selectedOrderDetails.discountAmount || 0) + (selectedOrderDetails.deliveryCharge || 0)).toFixed(2)}
                            </td>
                            <td className="py-2 px-4 border-b"></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeSection === "managePrescription" && <ManagePrescriptions />}
        {activeSection === "manageUsers" && <ManageUsers />}
        {activeSection === "managePartner" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Manage Partners</h2>
            <ManagePartners />
          </div>
        )}

        {/* Partners List Section */}
        {activeSection === "partnersList" && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Partners List</h1>
            {loadingPartners ? (
              <div>Loading partners...</div>
            ) : partners.length === 0 ? (
              <div>No partners found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-4 border-b text-left">Partner ID</th>
                      <th className="py-3 px-4 border-b text-left">Name</th>
                      <th className="py-3 px-4 border-b text-left">Email</th>
                      <th className="py-3 px-4 border-b text-left">Phone</th>
                      <th className="py-3 px-4 border-b text-left">Bank Details</th>
                      <th className="py-3 px-4 border-b text-left">Status</th>
                      <th className="py-3 px-4 border-b text-left">Registration Date</th>
                      <th className="py-3 px-4 border-b text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 border-b">{partner.businessPartnerNumber || partner.BPANumber}</td>
                        <td className="py-3 px-4 border-b">{partner.name}</td>
                        <td className="py-3 px-4 border-b">{partner.email}</td>
                        <td className="py-3 px-4 border-b">{partner.phone}</td>
                        <td className="py-3 px-4 border-b">
                          <div className="text-sm">
                            <p><span className="font-medium">Bank:</span> {partner.bankDetails?.bankName || 'N/A'}</p>
                            <p><span className="font-medium">Account:</span> {partner.bankDetails?.accountNumber || 'N/A'}</p>
                            <p><span className="font-medium">IFSC:</span> {partner.bankDetails?.ifscCode || 'N/A'}</p>
                            <p><span className="font-medium">Holder:</span> {partner.bankDetails?.accountHolderName || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 border-b">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            partner.isApproved 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {partner.isApproved ? "Approved" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3 px-4 border-b">
                          {new Date(partner.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 border-b text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleViewDocument(partner._id, 'aadhar')}
                              className="text-blue-600 hover:text-blue-800"
                              title="View Aadhar"
                            >
                              <FaEye />
                            </button>
                            <button
                              onClick={() => handleViewDocument(partner._id, 'pan')}
                              className="text-blue-600 hover:text-blue-800"
                              title="View PAN"
                            >
                              <FaFilePdf />
                            </button>
                            <button
                              onClick={() => handleApprovePartner(partner._id)}
                              className={`${
                                partner.isApproved 
                                  ? "text-red-600 hover:text-red-800" 
                                  : "text-green-600 hover:text-green-800"
                              }`}
                              title={partner.isApproved ? "Revoke Approval" : "Approve Partner"}
                            >
                              <FaUserTie />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

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

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Item</h3>
            <div className="mb-4">
              <label className="block mb-2">Select Medicine</label>
              <select
                value={newItem.productId}
                onChange={(e) =>
                  setNewItem({ ...newItem, productId: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select a medicine</option>
                {/* {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.drugName} - ₹{product.price}
                  </option>
                ))} */}

                {products.map((product) => (
                  <React.Fragment key={product._id}>
                    <option value={product._id}>
                      {product.drugName} - ₹{product.price}
                    </option>
                    {product.alternateMedicines?.map((alt, index) => (
                      <option
                        key={`${product._id}-alt-${index}`}
                        value={`${product._id}|alt|${index}`}
                      >
                        {alt.name} (Alt) - ₹{alt.price}
                      </option>
                    ))}
                  </React.Fragment>
                ))}

              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2">Quantity</label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: parseInt(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">GST Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newItem.gstPercentage}
                onChange={(e) =>
                  setNewItem({ ...newItem, gstPercentage: parseFloat(e.target.value) })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Medicine</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block mb-2">Drug Name</label>
                <input
                  type="text"
                  value={newMedicine.drugName}
                  onChange={(e) => setNewMedicine({ ...newMedicine, drugName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter drug name"
                />
              </div>
              <div>
                <label className="block mb-2">Manufacturer</label>
                <input
                  type="text"
                  value={newMedicine.manufacturer}
                  onChange={(e) => setNewMedicine({ ...newMedicine, manufacturer: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter manufacturer"
                />
              </div>
              <div>
                <label className="block mb-2">Category</label>
                <input
                  type="text"
                  value={newMedicine.category}
                  onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block mb-2">Size</label>
                <input
                  type="text"
                  value={newMedicine.size}
                  onChange={(e) => setNewMedicine({ ...newMedicine, size: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter size"
                />
              </div>
              <div>
                <label className="block mb-2">MRP (₹)</label>
                <input
                  type="number"
                  value={newMedicine.mrp}
                  onChange={(e) => setNewMedicine({ ...newMedicine, mrp: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter MRP"
                />
              </div>
              <div>
                <label className="block mb-2">Selling Price (₹)</label>
                <input
                  type="number"
                  value={newMedicine.price}
                  onChange={(e) => setNewMedicine({ ...newMedicine, price: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter selling price"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-2">Salt Composition</label>
                <input
                  type="text"
                  value={newMedicine.salt}
                  onChange={(e) => setNewMedicine({ ...newMedicine, salt: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter salt composition"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-2">Condition Treated</label>
                <input
                  type="text"
                  value={newMedicine.ConditionTreated}
                  onChange={(e) => setNewMedicine({ ...newMedicine, ConditionTreated: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter conditions treated"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-2">Usage</label>
                <input
                  type="text"
                  value={newMedicine.Usage}
                  onChange={(e) => setNewMedicine({ ...newMedicine, Usage: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter usage instructions"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-2">Common Side Effects</label>
                <input
                  type="text"
                  value={newMedicine.CommonSideEffects}
                  onChange={(e) => setNewMedicine({ ...newMedicine, CommonSideEffects: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter common side effects"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-2">Image URL (Optional)</label>
                <input
                  type="text"
                  value={newMedicine.imageUrl}
                  onChange={(e) => setNewMedicine({ ...newMedicine, imageUrl: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter image URL (optional)"
                />
              </div>
            </div>

            {/* Alternate Medicines Section */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold">Alternate Medicines</h4>
                <button
                  onClick={addAlternateMedicine}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <FaPlus /> Add Alternate
                </button>
              </div>
              {newMedicine.alternateMedicines.map((alt, index) => (
                <div key={index} className="border rounded p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium">Alternate Medicine {index + 1}</h5>
                    <button
                      onClick={() => removeAlternateMedicine(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block mb-2">Name</label>
                      <input
                        type="text"
                        value={alt.name}
                        onChange={(e) => handleAlternateMedicineChange(index, 'name', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter alternate medicine name"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Size</label>
                      <input
                        type="text"
                        value={alt.size_1}
                        onChange={(e) => handleAlternateMedicineChange(index, 'size_1', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter size"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Manufacturer URL</label>
                      <input
                        type="text"
                        value={alt.manufacturerURL}
                        onChange={(e) => handleAlternateMedicineChange(index, 'manufacturerURL', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter manufacturer URL"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Price (₹)</label>
                      <input
                        type="number"
                        value={alt.price}
                        onChange={(e) => handleAlternateMedicineChange(index, 'price', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter price"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">MRP (₹)</label>
                      <input
                        type="number"
                        value={alt.mrp}
                        onChange={(e) => handleAlternateMedicineChange(index, 'mrp', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter MRP"
                      />
                    </div>
                    <div>
                      <label className="block mb-2">Discount</label>
                      <input
                        type="text"
                        value={alt.Discount}
                        onChange={(e) => handleAlternateMedicineChange(index, 'Discount', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter discount"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block mb-2">Image URL (Optional)</label>
                      <input
                        type="text"
                        value={alt.imageUrl}
                        onChange={(e) => handleAlternateMedicineChange(index, 'imageUrl', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Enter image URL (optional)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddMedicineModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedicine}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Medicine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
