import React, { useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

const JoinAsStorePartner = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    storeDetails: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/partner`, formData);
      toast.success("Form submitted successfully!",{
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        storeDetails: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit the form. Please try again.",{
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <Toaster />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-lg rounded-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          Join as Store Partner
        </h2>
        <input
          name="name"
          type="text"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          name="email"
          type="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <input
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
        />
        <textarea
          name="storeDetails"
          placeholder="Details about your store"
          value={formData.storeDetails}
          onChange={handleChange}
          required
          className="block w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
        ></textarea>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default JoinAsStorePartner;
