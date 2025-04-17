import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <h1 className="text-7xl md:text-8xl font-bold text-gray-800">404</h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 mt-4">
        Page Not Found
      </h2>
      <p className="text-gray-500 mt-2 max-w-md">
        Oops! The page you are looking for does not exist. It might have been
        moved or deleted.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
