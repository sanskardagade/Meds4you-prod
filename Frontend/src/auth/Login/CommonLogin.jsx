import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slice/authSlice";

const CommonLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState("partner"); // "partner" or "referral"

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleLoginType = () => setLoginType(loginType === "partner" ? "referral" : "partner");

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const apiUrl =
      loginType === "partner"
        ? `${import.meta.env.VITE_BACKEND_URL}/api/partners/login`
        : `${import.meta.env.VITE_BACKEND_URL}/api/referrers/login`;

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed");

      dispatch(loginSuccess({ token: result.token, userType: result.userType }));
      localStorage.setItem("token", result.token);
      localStorage.setItem("userType", result.userType);

      navigate(loginType === "partner" ? "/partner-dashboard" : "/referral-dashboard");
    } catch (error) {
      toast.error(error.message, { position: "top-center", autoClose: 3000 });
    } finally {
      setFormData({ email: "", password: "" });
    }
  };

  return (
    <div className="flex justify-center items-center bg-white pt-48 pb-36 sm:p-36">
      <div className="w-full max-w-sm sm:max-w-md bg-white p-6 sm:p-10 rounded-lg shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-gray-800">
          {loginType === "partner" ? "Affiliate/Partner Login" : "Referral Login"}
        </h2>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-6">
          <button
            onClick={toggleLoginType}
            className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-md hover:bg-gray-300 transition"
          >
            Switch to {loginType === "partner" ? "Referral" : "Affiliate/Partner"} Login
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Your email"
              className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4 relative">
            <FaLock className="absolute left-3 top-3 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Your password"
              className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={togglePasswordVisibility}>
              {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </span>
          </div>

          <button type="submit" className="w-full py-3 bg-[#48a8e3] text-white font-bold rounded-md hover:bg-[#565de3] transition">
            Login
          </button>
        </form>

        <ToastContainer />
      </div>
    </div>
  );
};

export default CommonLogin;
