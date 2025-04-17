import React from "react";
import { useSelector } from "react-redux";
import FAQReferral from "./FAQ-Referral";

const ReferralRegister = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated); // Get auth state from Redux

  return (
    <div className="min-h-scree pt-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Join Our Referral Program
          </h1>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Content */}
            <div>
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  How It Works
                </h2>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "Sign Up", desc: "Register as Customer" },
                    {
                      step: "2",
                      title: "Promote",
                      desc: "Share your referral link via social media, blog, or newsletter.",
                    },
                    {
                      step: "3",
                      title: "Earn",
                      desc: "Get 10% on generic and 2% on branded drugs for each sale.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {item.step}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div>
                <FAQReferral />
              </div>
            </div>

            {/* Right Column - Register or Profile Link */}
            <div className="p-4 bg-white">
              {isAuthenticated ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    You're already registered! Go to your profile to find and share your referral link.
                  </p>
                  <h2>
                    <a
                      href="/profile"
                      className="block w-full bg-green-600 text-white text-center text-lg font-medium py-3 rounded-lg hover:bg-green-700 transition-all duration-300"
                    >
                      Go to Profile
                    </a>
                  </h2>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    To avail this referral program, register as a customer using the link below. After registering, log in and share your referral code to start earning rewards!
                  </p>
                  <h2>
                    <a
                      href="/register"
                      className="block w-full bg-blue-600 text-white text-center text-lg font-medium py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
                    >
                      Register as Customer
                    </a>
                  </h2>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralRegister;
