import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedicines, setSelectedMedicines] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/cart/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setCart(response.data.items);
          setLoading(false);
        })
        .catch(() => {
          setError("Failed to fetch cart");
          setLoading(false);
        });
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleDelete = (productId) => {
    if (token) {
      axios
        .delete(`${import.meta.env.VITE_BACKEND_URL}/api/cart/remove`, {
          data: { userId: token, productId },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(() => {
          setCart(cart.filter((item) => item.productId._id !== productId));
          // Also remove from selected medicines
          const { [productId]: removed, ...rest } = selectedMedicines;
          setSelectedMedicines(rest);
        })
        .catch((err) => {
          setError("Failed to delete item");
          console.error("Failed to delete item:", err);
        });
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return;
    if (token) {
      axios
        .put(
          `${import.meta.env.VITE_BACKEND_URL}/api/cart/update`,
          { userId: token, productId, quantity },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then(() => {
          setCart((prevCart) =>
            prevCart.map((item) =>
              item.productId._id === productId ? { ...item, quantity } : item
            )
          );
        })
        .catch((err) => {
          setError("Failed to update quantity");
          console.error("Failed to update quantity:", err);
        });
    }
  };

  const handleSelectionChange = (productId, isRecommended) => {
    setSelectedMedicines((prev) => {
      const currentSelection = prev[productId];

      // Toggle selection: if already selected, uncheck it
      if (currentSelection === (isRecommended ? "recommended" : "original")) {
        return { ...prev, [productId]: null }; // Unselect
      }

      return {
        ...prev,
        [productId]: isRecommended ? "recommended" : "original",
      };
    });
  };
  const updateMedicineSelection = (productId, isRecommended) => {
    setSelectedMedicines((prev) => {
      return {
        ...prev,
        [productId]: isRecommended ? "recommended" : "original",
      };
    });
  };

  const calculateTotal = () => {
    return cart
      .reduce((total, item) => {
        const product = item?.productId;
        const alternate = product?.alternateMedicines?.[0];
        const selection = selectedMedicines[product._id] || "original"; // Default to original if not selected

        // If this item is set to recommended and has an alternate, use alternate price
        if (selection === "recommended" && alternate) {
          return total + alternate.price * item.quantity;
        }

        // Otherwise use original price
        return total + product?.price * item.quantity;
      }, 0)
      .toFixed(2);
  };

  const calculateMinimumSaving = () => {
    let totalMRP = 0;
    let totalPrice = 0;

    cart.forEach((item) => {
      const product = item?.productId;
      if (product) {
        totalMRP += (product.mrp || 0) * (item.quantity || 1);
        totalPrice += (product.price || 0) * (item.quantity || 1);
      }
    });

    return (totalMRP - totalPrice).toFixed(2);
  };

  const calculateMaximumSaving = () => {
    let totalLeftPrice = 0;
    let totalRecommendedPrice = 0;

    cart.forEach((item) => {
      const product = item?.productId;
      const alternate = product?.alternateMedicines?.[0]; // First alternative

      if (product) {
        totalLeftPrice += (product.price || 0) * (item.quantity || 1);
        totalRecommendedPrice += (alternate.price || 0) * (item.quantity || 1);
      }
    });

    return (totalLeftPrice - totalRecommendedPrice).toFixed(2);
  };

  const selectionSaving = () => {
    let totalMrp = 0;
    let totalPrice = 0;
    let allRecommendedSelected = true; // Flag to check if all recommended are selected

    cart.forEach((item) => {
      const product = item?.productId;
      const alternate = product?.alternateMedicines?.[0]; // First alternative
      const isRecommendedSelected =
        selectedMedicines[product._id] === "recommended";
      const quantity = item.quantity || 1;

      let mrp = 0;
      let price = 0;

      if (isRecommendedSelected && alternate) {
        // If recommended is selected, use alternate medicine prices
        mrp = parseFloat(alternate.mrp) || 0;
        price = parseFloat(alternate.price) || 0;
      } else {
        // If original medicine is selected, use its prices
        mrp = parseFloat(product?.mrp) || 0;
        price = parseFloat(product?.price) || 0;
        allRecommendedSelected = false; // If even one original medicine is selected, set flag to false
      }

      totalMrp += mrp * quantity;
      totalPrice += price * quantity;
    });

    let calculatedSaving = (totalMrp - totalPrice).toFixed(2);

    if (allRecommendedSelected) {
      // If all recommended medicines are selected, return the max saving
      calculatedSaving = calculateMaximumSaving();
    }

    console.log("Selection Saving:", calculatedSaving);

    return parseFloat(calculatedSaving);
  };

  const calculateMissingOutSaving = () => {
    let missingSaving = 0;

    cart.forEach((item) => {
      const product = item?.productId;
      const alternate = product?.alternateMedicines?.[0]; // First alternative
      const isRecommendedSelected =
        selectedMedicines[product._id] === "recommended";

      if (!isRecommendedSelected && alternate) {
        // If the original medicine is selected, calculate the potential savings
        const leftPrice = parseFloat(product.price) || 0;
        const recommendedPrice = parseFloat(alternate.price) || 0;
        const quantity = item.quantity || 1;

        missingSaving += (leftPrice - recommendedPrice) * quantity;
      }
    });

    return missingSaving.toFixed(2);
  };

  const handleCheckout = () => {
    const selectedProducts = cart.map((item) => ({
      ...item,
      selection: selectedMedicines[item.productId._id] || "original", // Default to original if not set
      isRecommended: selectedMedicines[item.productId._id] === "recommended",
    }));

    const total = cart
      .reduce((sum, item) => {
        const product = item.productId;
        const isRecommended = selectedMedicines[product._id] === "recommended";
        const price =
          isRecommended && product.alternateMedicines?.[0]
            ? product.alternateMedicines[0].price
            : product.price;

        return sum + price * item.quantity;
      }, 0)
      .toFixed(2);

    navigate("/checkout", {
      state: {
        selectedProducts,
        total: total,
      },
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center">
        <p className="text-gray-500">Loading your cart...</p>
      </div>
    );
  }

  const MobileCartItem = ({ item, index }) => {
    const product = item?.productId;
    const alternate = product?.alternateMedicines?.[0];
    const selection = selectedMedicines[product._id] || "original";
    const isOriginalSelected = selection === "original";
    const isRecommendedSelected = selection === "recommended";

    return (
      <div className="bg-white rounded-lg shadow-md mb-3 overflow-hidden">
        {/* Top row with item number and tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          {/* Sr. No. and delete button column */}
          <div className="flex flex-col items-center justify-center py-1 px-2 border-r border-gray-200">
            <div className="text-xs text-gray-700">Sr.{index + 1}</div>
            <button
              onClick={() => handleDelete(product._id)}
              className="text-red-500 flex items-center justify-center mt-1 hover:text-red-700"
              aria-label="Remove item"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Swapped Selection tabs */}
          <div
            className={`flex-1 py-2 text-center text-xs ${
              isRecommendedSelected ? "bg-green-100 font-medium" : ""
            }`}
            onClick={() => handleSelectionChange(product._id, true)}
          >
            Recommended Medicine
          </div>
          <div
            className={`flex-1 py-2 text-center text-xs ${
              isOriginalSelected ? "bg-blue-100 font-medium" : ""
            }`}
            onClick={() => handleSelectionChange(product._id, false)}
          >
            Selected Medicine
          </div>
        </div>

        {/* Medicine details */}
        <div className="p-3">
          {isRecommendedSelected ? (
            alternate ? (
              <div>
                <div className="text-sm font-medium">{alternate.name}</div>
                <div className="text-xs mt-1 text-gray-700">
                  (<span className="font-semibold">Mfr:</span> manufacturer,
                  <span className="font-semibold"> MRP:</span>{" "}
                  <span className="line-through">₹{alternate.mrp}</span>,
                  <span className="font-semibold text-green-600"> Price:</span>{" "}
                  ₹{alternate.price})
                </div>

                <div className="flex justify-between mt-2">
                  <div className="text-sm">Qty: {item.quantity}</div>
                  <div className="text-sm font-semibold">
                    Total: ₹{(alternate.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-2">
                No alternative available
              </div>
            )
          ) : (
            <div>
              <div className="text-sm font-medium">{product?.drugName}</div>
              <div className="text-xs mt-1 text-gray-700">
                (<span className="font-semibold">Mfr:</span>{" "}
                {product?.manufacturer},
                <span className="font-semibold"> MRP:</span>{" "}
                <span className="line-through">₹{product?.mrp}</span>,
                <span className="font-semibold text-green-600"> Price:</span> ₹
                {product?.price})
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(product._id, item.quantity - 1)
                    }
                    className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                    −
                  </button>
                  <span className="text-sm font-medium">
                    {item?.quantity || 0}
                  </span>
                  <button
                    onClick={() =>
                      handleQuantityChange(product._id, item.quantity + 1)
                    }
                    className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white"
                  >
                    +
                  </button>
                </div>

                <div className="text-sm font-semibold">
                  Total: ₹{(product?.price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main mobile cart component
  const MobileCart = ({ cart }) => {
    return (
      <div className="block lg:hidden">
        {/* Savings buttons - swapped order */}
        <div className="flex justify-between mb-3">
          <button
            className="bg-green-500 text-white text-xs px-3 py-2 rounded-md flex-1 mr-2"
            onClick={() => {
              cart.forEach((item) =>
                updateMedicineSelection(item.productId._id, true)
              );
            }}
          >
            Click for Max Savings: ₹{calculateMaximumSaving()}
          </button>

          <button
            className="bg-red-400 text-white text-xs px-3 py-2 rounded-md flex-1 ml-2"
            onClick={() => {
              cart.forEach((item) =>
                updateMedicineSelection(item.productId._id, false)
              );
            }}
          >
            Min Savings: ₹{calculateMinimumSaving()}
          </button>
        </div>

        {/* Cart items */}
        {cart.map((item, index) => (
          <MobileCartItem key={item.id} item={item} index={index} />
        ))}

        {/* Total row */}
        <div className="bg-gray-50 rounded-lg shadow-md p-3 flex justify-between items-center mt-3">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-green-800 font-bold">₹{calculateTotal()}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen py-10 px-4 pt-28">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 ">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 sm:mb-12">
          Your Cart
        </h1>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-12 text-center">
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <MobileCart cart={cart} />

            {/* Desktop View */}
            <div className="hidden lg:block">
              <div className="bg-white rounded-lg shadow">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-3 text-left">No.</th>
                      <th
                        colSpan="4"
                        className="py-2 px-6 text-left font-medium text-[16px] text-gray-600"
                      >
                        Recommended Medicine
                        <button
                          className="m-4 bg-green-400 text-white px-3 py-1 rounded-md"
                          onClick={() => {
                            cart.forEach((item) =>
                              updateMedicineSelection(item.productId._id, true)
                            );
                          }}
                        >
                          Click to get Maximum Saving: ₹
                          {calculateMaximumSaving()}
                        </button>
                      </th>
                      <th
                        colSpan="4"
                        className="py-2 px-3 text-left border-l border-gray-200 font-medium text-[16px]"
                      >
                        Selected Medicine
                        <button
                          className="m-4 bg-red-400 text-white px-3 py-1 rounded-md"
                          onClick={() => {
                            cart.forEach((item) =>
                              updateMedicineSelection(item.productId._id, false)
                            );
                          }}
                        >
                          Minimum Savings: ₹{calculateMinimumSaving()}
                        </button>
                      </th>
                    </tr>
                    <tr className="bg-gray-100">
                      <th className="py-3 px-3 text-left">Sr.no.</th>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-1 text-left">Price/Unit</th>
                      <th className="py-3 px-5 text-left">Quantity</th>
                      <th className="py-3 px-5 text-left border-r border-gray-200">
                        Total (Rs.)
                      </th>
                      <th className="py-3 px-8 text-left">Name</th>
                      <th className="py-3 px-10 text-left">Price/Unit</th>
                      <th className="py-3 px-10 text-left">Quantity</th>
                      <th className="py-3 px-6 text-left">Total (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, index) => {
                      const product = item?.productId;
                      const alternate = product?.alternateMedicines?.[0];
                      const selection =
                        selectedMedicines[product._id] || "original";
                      const isOriginalSelected = selection === "original";
                      const isRecommendedSelected = selection === "recommended";

                      return (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="py-2 px-4 text-[18px]">
                            {index + 1}
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-2 mt-2"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>

                          {/* Recommended Medicine Side */}
                          {alternate ? (
                            <>
                              <td
                                className={`py-2 px-4 text-[16px] ${
                                  isRecommendedSelected ? "bg-green-50" : ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div>
                                    <input
                                      type="radio"
                                      name={`medicine-${product._id}`}
                                      onChange={() =>
                                        handleSelectionChange(product._id, true)
                                      }
                                      checked={isRecommendedSelected}
                                    />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {alternate.name}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      manufacturer
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td
                                className={`py-2 px-2 ${
                                  isRecommendedSelected ? "bg-green-50" : ""
                                }`}
                              >
                                <div className="text-sm pb-2">
                                  MRP:{" "}
                                  <span className="line-through">
                                    ₹{alternate.mrp}
                                  </span>
                                </div>
                                <div className="text-green-600">
                                  Price:{" "}
                                  <span className="text-xl font-bold">
                                    ₹{alternate.price}
                                  </span>
                                </div>
                              </td>
                              <td
                                className={`py-2 px-10 text-[16px] ${
                                  isRecommendedSelected ? "bg-green-50" : ""
                                }`}
                              >
                                {item.quantity}
                              </td>
                              <td
                                className={`py-2 px-6 text-[16px] border-r border-gray-200 ${
                                  isRecommendedSelected ? "bg-green-50" : ""
                                }`}
                              >
                                {(alternate.price * item.quantity).toFixed(2)}
                              </td>
                            </>
                          ) : (
                            <td
                              colSpan="4"
                              className="py-2 px-3 text-center text-gray-500 border-r border-gray-200"
                            >
                              No alternative available
                            </td>
                          )}

                          {/* Selected Medicine Side */}
                          <td
                            className={`py-4 px-2 ${
                              isOriginalSelected ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div>
                                <input
                                  type="radio"
                                  name={`medicine-${product._id}`}
                                  onChange={() =>
                                    handleSelectionChange(product._id, false)
                                  }
                                  checked={isOriginalSelected}
                                  defaultChecked={true}
                                />
                              </div>
                              <div>
                                <div className="text-[16px] text-gray-900 font-medium">
                                  {product?.drugName}
                                </div>
                                <span className="text-xs text-gray-600">
                                  {product?.manufacturer}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td
                            className={`py-2 px-10 ${
                              isOriginalSelected ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="text-sm pb-2">
                              MRP:{" "}
                              <span className="line-through">
                                ₹{product?.mrp}
                              </span>
                            </div>
                            <div className="text-green-600">
                              Price:{" "}
                              <span className="text-lg font-bold">
                                ₹{product?.price}
                              </span>
                            </div>
                          </td>
                          <td
                            className={`py-2 px-6 text-[16px] ${
                              isOriginalSelected ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex items-center space-x-3 rounded-lg px-2 py-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product._id,
                                    item.quantity - 1
                                  )
                                }
                                className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                aria-label="Decrease quantity"
                              >
                                <span className="text-xs font-semibold">−</span>
                              </button>
                              <span className="text-xs font-medium text-gray-600">
                                <span className="text-gray-900 font-semibold pl-0">
                                  {item?.quantity || 0}
                                </span>
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    product._id,
                                    item.quantity + 1
                                  )
                                }
                                className="flex items-center justify-center w-6 h-6 bg-gray-200 text-gray-700 rounded-full hover:bg-green-500 hover:text-white transition-all"
                                aria-label="Increase quantity"
                              >
                                <span className="text-xs font-semibold">+</span>
                              </button>
                            </div>
                          </td>
                          <td
                            className={`py-2 px-5 w-32 text-[16px] ${
                              isOriginalSelected ? "bg-blue-50" : ""
                            }`}
                          >
                            {(product?.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="bg-gray-50 font-semibold">
                      <td colSpan="8" className="py-4 px-6 text-right">
                        Total Amount:
                      </td>
                      <td className="py-2 px-2 text-lg text-green-800">
                        ₹ {calculateTotal()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checkout Button */}

            <div className="mt-8 flex flex-col items-center sm:flex-row sm:justify-center gap-4 bg-white p-6 rounded-lg shadow-md">
              <div className="text-sm sm:text-base text-gray-600 font-semibold flex-1 text-center sm:text-left">
                <span className="text-green-500">*</span> Savings based on
                current selection:
                <span className="text-gray-800 font-bold">
                  {" "}
                  ₹{selectionSaving()}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 shadow-md ${
                  cart.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 active:scale-95"
                }`}
              >
                Proceed to Checkout: ₹{calculateTotal()}
              </button>

              <div className="text-sm sm:text-base text-gray-600 font-semibold flex-1 text-center sm:text-right">
                <span className="text-red-500">*</span> Missing out saving:
                <span className="text-gray-800 font-bold">
                  {" "}
                  ₹{calculateMissingOutSaving()}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
