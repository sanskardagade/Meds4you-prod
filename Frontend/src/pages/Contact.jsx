import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import the styles

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    message: "",
  }); 

  const [isSending, setIsSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSending(true);

    // Sending the message to the company using EmailJS
    emailjs
      .sendForm(
        "service_9pwipj9", // Replace with your service ID
        "template_n4typ6k", // Replace with your template ID
        e.target, // Form data
        "84pCoLWLQZntzOwQh" // Replace with your public key
      )
      .then(
        (result) => {
          toast.success("Message sent successfully!",{
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
          }); // Success notification
          setIsSending(false);
          setFormData({
            firstName: "",
            lastName: "",
            phoneNumber: "",
            email: "",
            message: "",
          }); // Reset form
        },
        (error) => {
          toast.error("Failed to send message. Please try again.",{
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined
          }); // Error notification
          setIsSending(false);
        }
      );
  };

  return (
    <div className="flex mt-14 sm:mt-32 flex-col items-center justify-center w-full h-full py-10 shadow-lg">
      <h1 className=" text-xl sm:text-3xl font-bold text-gray-700 mb-5">
        We Deliver Happiness! ❤
      </h1>
      <div className="flex flex-wrap bg-white shadow-lg rounded-lg overflow-hidden w-11/12 md:w-3/4 lg:w-2/3">
        {/* Contact Information */}
        <div className="w-full md:w-1/2 bg-[#d9327a] text-white p-8">
          <h2 className="text-xl font-bold mb-4">Contact Information</h2>
          <p className="mb-2">
            📞 <span className="ml-2 text-base">+91 8484883367</span>
          </p>
          <p className="mb-2">
            📧 <span className="ml-2 text-base">care@meds4you.in</span>
          </p>
        </div>

        {/* Contact Form */}
        <div className="w-full md:w-1/2 p-8 bg-[#e5edf7]">
          <h2 className="text-xl font-bold mb-4">
            We are happy to hear from you
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex space-x-4">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                placeholder="First Name"
                className="w-1/2 p-2 border border-gray-300 rounded"
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                placeholder="Last Name"
                className="w-1/2 p-2 border border-gray-300 rounded"
                onChange={handleChange}
              />
            </div>
            <div className="flex space-x-4">
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                placeholder="Phone Number"
                className="w-1/2 p-2 border border-gray-300 rounded"
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="Email"
                className="w-1/2 p-2 border border-gray-300 rounded"
                onChange={handleChange}
              />
            </div>
            <textarea
              name="message"
              value={formData.message}
              placeholder="Write your message"
              className="w-full p-2 border border-gray-300 rounded"
              rows="4"
              onChange={handleChange}
            ></textarea>
            <button
              type="submit"
              className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Submit"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default ContactUs;
