import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaPlus, FaSave } from "react-icons/fa";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [products, setProducts] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newItem, setNewItem] = useState({
    productId: "",
    quantity: 1,
  });

  // Add state for delivery charge
  const [editingDeliveryCharge, setEditingDeliveryCharge] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load orders");
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/products`
      );
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/orders/${orderId}/status`,
        { orderStatus: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
      toast.success("Order status updated successfully");
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error("Failed to update order status");
    }
  };

  const handleQuantityChange = async (orderId, itemId, newQuantity) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}/items/${itemId}`,
        { quantity: newQuantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders(); // Refresh orders to get updated amounts
      toast.success("Quantity updated successfully");
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Failed to update quantity");
    }
  };

  const handleDeleteItem = async (orderId, itemId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}/items/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders(); // Refresh orders to get updated amounts
      toast.success("Item deleted successfully");
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item");
    }
  };

  const handleAddItem = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}/items`,
        newItem,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders(); // Refresh orders to get updated amounts
      setShowAddItemModal(false);
      setNewItem({ productId: "", quantity: 1 });
      toast.success("Item added successfully");
    } catch (err) {
      console.error("Error adding item:", err);
      toast.error("Failed to add item");
    }
  };

  const handleEditItem = (orderId, item) => {
    setEditingItem({ orderId, ...item });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${editingItem.orderId}/items/${editingItem._id}`,
        { 
          quantity: editingItem.quantity,
          price: editingItem.price
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders(); // Refresh orders to get updated amounts
      setEditingItem(null);
      toast.success("Item updated successfully");
    } catch (err) {
      console.error("Error updating item:", err);
      toast.error("Failed to update item");
    }
  };

  const handleDeliveryChargeChange = async (orderId, newCharge) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/orders/admin/orders/${orderId}/delivery-charge`,
        { deliveryCharge: parseFloat(newCharge) || 0 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchOrders(); // Refresh orders to get updated amounts
      setEditingDeliveryCharge(null);
      toast.success("Delivery charge updated successfully");
    } catch (err) {
      console.error("Error updating delivery charge:", err);
      toast.error("Failed to update delivery charge");
    }
  };

  if (loading) return <p className="text-gray-600 text-center">Loading...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-center sm:text-left">
        Manage Orders
      </h2>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Order ID</th>
                <th className="px-4 py-2 border">Customer</th>
                <th className="px-4 py-2 border">Items</th>
                <th className="px-4 py-2 border">Delivery Charge</th>
                <th className="px-4 py-2 border">Total Amount</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{order._id}</td>
                  <td className="px-4 py-2 border">
                    {order.userId?.name || "Unknown"}
                  </td>
                  <td className="px-4 py-2 border">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-2 py-1">Medicine</th>
                          <th className="px-2 py-1">Quantity</th>
                          <th className="px-2 py-1">Price</th>
                          <th className="px-2 py-1">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item) => (
                          <tr key={item._id}>
                            <td className="px-2 py-1">
                              {item.productDetails?.drugName || "Unknown"}
                            </td>
                            <td className="px-2 py-1">
                              {editingItem?._id === item._id ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={editingItem.quantity}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      quantity: parseInt(e.target.value),
                                    })
                                  }
                                  className="w-16 border rounded px-1"
                                />
                              ) : (
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      order._id,
                                      item._id,
                                      parseInt(e.target.value)
                                    )
                                  }
                                  className="w-16 border rounded px-1"
                                />
                              )}
                            </td>
                            <td className="px-2 py-1">
                              {editingItem?._id === item._id ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingItem.price}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      price: parseFloat(e.target.value),
                                    })
                                  }
                                  className="w-20 border rounded px-1"
                                />
                              ) : (
                                `₹${item.price}`
                              )}
                            </td>
                            <td className="px-2 py-1">
                              {editingItem?._id === item._id ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <FaSave />
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditItem(order._id, item)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteItem(order._id, item._id)
                                    }
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowAddItemModal(true);
                      }}
                      className="mt-2 text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      <FaPlus /> Add Item
                    </button>
                  </td>
                  <td className="px-4 py-2 border">
                    {editingDeliveryCharge === order._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={deliveryCharge}
                          onChange={(e) => setDeliveryCharge(e.target.value)}
                          className="w-20 border rounded px-2 py-1"
                        />
                        <button
                          onClick={() => handleDeliveryChargeChange(order._id, deliveryCharge)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaSave />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        ₹{order.deliveryCharge || 0}
                        <button
                          onClick={() => {
                            setEditingDeliveryCharge(order._id);
                            setDeliveryCharge(order.deliveryCharge || 0);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 border">₹{order.totalAmount}</td>
                  <td className="px-4 py-2 border">
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleStatusChange(order._id, e.target.value)
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border">
                    <button
                      onClick={() => window.open(`/admin/orders/${order._id}`, "_blank")}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.drugName} - ₹{product.price}
                  </option>
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
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddItem(selectedOrder._id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;