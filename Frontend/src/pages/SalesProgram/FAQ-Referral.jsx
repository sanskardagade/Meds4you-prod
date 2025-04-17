import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQReferral = () => {
  const faqs = [
    {
      question: "Why join our referral program?",
      answer: "You can help others save money and earn commission in return.",
    },
    {
      question: "What's the difference between referral & affiliate?",
      answer: "Both earn the same, but affiliates get cashback while referrals get wallet credits.",
    },
    {
      question: "Will I earn multiple times from a referral?",
      answer: "Yes! You'll continue earning if your referral keeps purchasing.",
    },
    {
      question: "How do I track referred purchases?",
      answer: "You'll be able to track their purchases after payment confirmation.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 lg:min-w-full">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Common Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
          >
            <button
              className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 transition duration-200"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium text-gray-800 text-left">
                {faq.question}
              </span>
              {openIndex === index ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openIndex === index && (
              <div className="p-4 bg-white text-gray-700">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQReferral;