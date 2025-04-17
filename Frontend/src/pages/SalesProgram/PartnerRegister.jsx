import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FAQPartner from "./FAQ-Partner";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const PartnerRegister = () => {
  const navigate = useNavigate();
  const [captchaValue, setCaptchaValue] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    aadharUrl: "",
    panUrl: "",
    // Bank Details
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",
    accountHolderName: "",
    termsAccepted: false,
  });

  const [uploading, setUploading] = useState({
    aadhar: false,
    pan: false,
  });

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append(type, file);

    try {
      setUploading((prev) => ({ ...prev, [type]: true }));

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/partners/upload/${type}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }, // ✅ Add this header
        }
      );

      setFormData((prev) => ({
        ...prev,
        [`${type}Url`]: response.data[`${type}Url`],
      }));

      alert(`${type.toUpperCase()} uploaded successfully!`);
    } catch (error) {
      console.error(`❌ Error uploading ${type}:`, error);
      alert(`Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      toast.error("You must accept the Terms & Conditions", {
        position: "top-center",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!", {
        position: "top-center",
      });
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error("Phone number must be exactly 10 digits.", {
        position: "top-center",
      });
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error(
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
        { position: "top-center" }
      );
      return;
    }

    if (!formData.aadharUrl || !formData.panUrl) {
      toast.error("Please upload both Aadhar and PAN before submitting.", {
        position: "top-center",
      });
      return;
    }

    // Validate Bank Details
    if (
      !formData.bankAccountNumber ||
      !formData.ifscCode ||
      !formData.bankName ||
      !formData.accountHolderName
    ) {
      toast.error("Please fill in all bank details.", {
        position: "top-center",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/partners/register`,
        formData
      );
      
      toast.success(response.data.message, {
        position: "top-center",
      });

      // Clear form data
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        aadharUrl: "",
        panUrl: "",
        bankAccountNumber: "",
        ifscCode: "",
        bankName: "",
        accountHolderName: "",
        termsAccepted: false,
      });

      // Clear CAPTCHA
      setCaptchaValue(null);

      // Navigate to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.error || "Error submitting registration. Please try again.", {
        position: "top-center",
      });
    }
  };

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-6 sm:mb-8">
            Join Us as an Affiliate/Partner
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Section */}
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                How It Works
              </h2>
              <div className="space-y-6">
                {[
                  {
                    step: "1",
                    title: "Sign Up",
                    text: "Takes only 1 min. Approved within a day.",
                  },
                  {
                    step: "2",
                    title: "Promote",
                    text: "Share your affiliate link/coupon online.",
                  },
                  {
                    step: "3",
                    title: "Earn",
                    text: "Get commissions on sales by your referrals.",
                  },
                ].map(({ step, title, text }) => (
                  <div key={step} className="flex items-start">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {step}
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {title}
                      </h3>
                      <p className="text-gray-600 mt-1">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 sm:mt-12">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                  More Details
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>No joining fee</li>
                  <li>Earn more with high commissioned medicines</li>
                  <li>Promote generic drugs</li>
                  <li>Access to our dedicated support</li>
                  <li>Commissions paid weekly every Friday</li>
                  <li>
                    You will receive commissions for sales from Wednesday to
                    Tuesday, paid every Friday.
                  </li>
                </ul>
              </div>
            </div>
            {/* Right Section (Form) */}
            <div>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Register
                </h2>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 sm:space-y-6"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  {/* Bank Details Section */}
                  <div className="bg-gray-100 p-4 sm:p-6 rounded-lg border border-gray-300 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Bank Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Bank Account Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          name="bankAccountNumber"
                          value={formData.bankAccountNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>

                      {/* IFSC Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          name="ifscCode"
                          value={formData.ifscCode}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>

                      {/* Bank Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>

                      {/* Account Holder Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Account Holder Name
                        </label>
                        <input
                          type="text"
                          name="accountHolderName"
                          value={formData.accountHolderName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  {/* Aadhar & PAN Upload */}
                  {["aadhar", "pan"].map((type) => (
                    <div key={type}>
                      <label className="block text-sm font-medium text-gray-700">
                        Upload {type.toUpperCase()}
                      </label>
                      <input
                        type="file"
                        onChange={(e) => handleFileUpload(e, type)}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={uploading[type]}
                        required
                      />
                      {uploading[type] && (
                        <p className="text-blue-600 text-sm">Uploading...</p>
                      )}
                      {formData[`${type}Url`] && (
                        <p className="text-green-600 text-sm">
                          Uploaded successfully
                        </p>
                      )}
                    </div>
                  ))}
                  {/* CAPTCHA */}
                  <div className="mb-4 flex justify-center">
                    <ReCAPTCHA
                      sitekey={SITE_KEY}
                      onChange={handleCaptchaChange}
                    />
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="mb-4 flex items-center">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">
                      I accept the{" "}
                      <a
                        href="/terms-condition"
                        className="text-blue-600 hover:underline"
                      >
                        Terms & Conditions
                      </a>
                    </label>
                  </div>
                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Join Program
                  </button>
                </form>
              </div>
              <div>
                <button
                  onClick={() => navigate("/login/partner")}
                  className="text-blue-600 underline cursor-pointer bg-transparent border-none p-0 m-0"
                >
                  Login after Approval
                </button>
              </div>
            </div>
          </div>
          {/* FAQ Section */}
          <div className="mt-8">
            <FAQPartner />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegister;
