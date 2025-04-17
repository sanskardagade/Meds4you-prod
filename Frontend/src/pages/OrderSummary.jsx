import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const OrderSummary = () => {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/orders/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        // console.log("Order Data:", response.data);
        setOrder(response.data);
      })
      .catch((err) => {
        setError("Failed to fetch order summary");
        console.error("Error fetching order summary:", err);
      });
  }, [token]);

  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!order) return <div className="text-center mt-10">Loading...</div>;

  const OrderItem = ({ item, index }) => {
    const product = item?.productDetails || {}; // Ensure safe access

    return (
      <li className="py-2 sm:py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b">
        <div>
          <span className="font-semibold text-sm sm:text-base">#{index + 1}</span>
          <p className="text-gray-900 font-medium text-sm sm:text-base">
            {product.drugName || "Unknown Product"}
          </p>
          <p className="text-gray-500 text-sm">
            Qty: {item.quantity} x ₹{item.price?.toFixed(2) || "0.00"}
          </p>
        </div>
        <p className="text-gray-900 font-semibold text-sm sm:text-base">
          ₹{(item.price * item.quantity).toFixed(2)}
        </p>
      </li>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 mt-24 mb-20 sm:mt-28 shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
        Order Summary
      </h2>
      <div className="border-b pb-3 sm:pb-4 mb-3 sm:mb-4 space-y-1 sm:space-y-2">
        <p className="text-base sm:text-lg text-gray-700">
          <strong>Order ID:</strong> {order._id}
        </p>
        <p className="text-base sm:text-lg text-gray-700">
          <strong>Total Amount:</strong> ₹
          {order.totalAmount ? order.totalAmount.toFixed(2) : "0.00"}
        </p>
        <p className="text-base sm:text-lg text-gray-700">
          <strong>Payment Status:</strong>{" "}
          <span
            className={`px-2 py-1 rounded ${
              order.paymentStatus === "paid"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {order.paymentStatus}
          </span>
        </p>
        <p className="text-base sm:text-lg text-gray-700">
          <strong>Order Status:</strong>{" "}
          <span
            className={`px-2 py-1 rounded ${
              order.orderStatus === "shipped"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {order.orderStatus}
          </span>
        </p>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-3">
        Items Ordered
      </h3>
      <ul className="divide-y divide-gray-200">
        {order.items.map((item, index) => (
          <OrderItem key={index} item={item} index={index} />
        ))}
      </ul>
      <button
        onClick={() => navigate("/")}
        className="mt-5 sm:mt-6 w-full sm:w-auto bg-red-500 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-red-600 text-lg font-medium"
      >
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderSummary;
