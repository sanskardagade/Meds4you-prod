import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#fdd9e9] py-2 px-2 sm:py-2 ">
      <div className="container mx-auto max-w-screen-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-left px-4 sm:px-8">
        {/* Company Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3 ">Company</h3>
          <ul className="space-y-2 mt-2 text-sm">
            <a
              href="/best-online-pharmacy"
              className="text-gray-600 hover:text-blue-500 text-sm transition duration-200"
            >
              Best Online Pharmacy in India
            </a>
            <li>
              <a
                href="/buy-medicines-online"
                className="text-gray-600 hover:text-blue-500 text-sm transition duration-200"
              >
                Buy Medicines Online With Discount
              </a>
            </li>
            <li>
              <a
                href="/terms-condition"
                className="text-gray-600 hover:text-blue-500 text-sm transition duration-200"
              >
                Privacy Policy
              </a>
            </li>
            <li className="text-gray-600 hover:text-blue-500 transition duration-300">
              <a href="/terms-condition">Terms and Conditions</a>
            </li>
          </ul>
        </div>

        {/* Join Us Section - Clickable */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Join Us</h3>
          <a
            href="/register/referral"
            className="text-gray-600 text-sm hover:text-blue-500 transition duration-300"
          >
            Referral Program
          </a>
          <br />
          <a
            href="/register/partner"
            className="text-gray-600 text-sm hover:text-blue-500 transition duration-300"
          >
            Affiliates/ Partners
          </a>
        </div>

        {/* Contact Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Contact Us
          </h3>
          <p className="text-gray-600 text-sm">care@meds4you.in</p>
          <p className="text-gray-600 text-sm font-semibold pt-2">WhatsApp
            +91 7303039854
          </p>
          <p className="text-gray-600 text-sm pt-2">Available 24/7</p>
        </div>

        {/* Social Media Section - Clickable */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Follow Us On
          </h3>
          <div className="flex space-x-4 text-gray-600 text-2xl">
            {[
              {
                platform: "facebook",
                color: "hover:text-blue-500",
                link: "https://www.facebook.com/Meds4You",
              },
              {
                platform: "youtube",
                color: "hover:text-red-500",
                link: "https://www.youtube.com/Meds4You",
              },
              {
                platform: "instagram",
                color: "hover:text-pink-500",
                link: "https://www.instagram.com/Meds4You",
              },
              {
                platform: "twitter",
                color: "hover:text-blue-400",
                link: "https://x.com/Meds4You",
              },
            ].map((social, index) => (
              <a
                key={index}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.color} transition duration-300`}
              >
                <i className={`fab fa-${social.platform}`}></i>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="text-center text-gray-600 text-sm mt-2">
        <p>&copy; 2025 Meds4You. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
