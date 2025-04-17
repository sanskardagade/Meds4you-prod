import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQPartner = () => {
  const faqs = [
    {
      question: "What is direct sales?",
      answer:
        "Direct Selling is a dynamic marketing approach where products and services are sold directly to consumers through Independent Distributors, also known as 'Direct Sellers'.",
    },
    {
      question: "How is direct selling different from Ponzi or pyramid schemes?",
      answer:
        "Direct Sellers earn money by selling high-quality products, with no earnings for recruitment. Pyramid/Ponzi schemes involve multi-layered networks that benefit from enrolling others, which is illegal.",
    },
    {
      question: "What does Meds4You sell?",
      answer: "We sell all branded and generic medicines.",
    },
    {
      question: "Does one need to stock inventory?",
      answer: "No. Meds4You Direct Sellers are not required to stock.",
    },
    {
      question: "Is there a registration fee?",
      answer: "No registration fee.",
    },
    {
      question: "Are there any training charges?",
      answer:
        "No, all training sessions, webinars, and learning tools are provided free of cost.",
    },
    {
      question: "Do I necessarily need to recruit people to earn money?",
      answer:
        "No, you can earn through retail profits by selling medicines without recruiting anyone.",
    },
    {
      question: "How will I get paid?",
      answer:
        "Commissions are paid every Friday for sales made from Wednesday to Tuesday of the previous week.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 lg:min-w-full">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Frequently Asked Questions
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

export default FAQPartner;
