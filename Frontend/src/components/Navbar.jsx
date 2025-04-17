import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import cartImage from "../assets/cart.png";
import companyicon from "../assets/CompanyLogo.png";
import { Home, Search, ShoppingCart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slice/authSlice";
import { useLocation } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import SearchBar from "./SearchBar";

function Navbar({ isScrolled }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [authState, setAuthState] = useState(isAuthenticated);

  const showSearchInNavbar = location.pathname !== "/" || isScrolled;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".mobile-menu-container")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    setAuthState(isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === "token" && event.newValue === null) {
        dispatch(logout());
      }
    };

    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, [dispatch]);

  return (
    <nav className="bg-[#cde8ec] p-4 fixed top-0 left-0 w-full z-50 shadow-md">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        <Link to="/">
          <img
            src={companyicon}
            alt="Icon"
            className="w-24 ml-[-10px] sm:mr-2 h-8 sm:w-32 sm:h-12"
          />
        </Link>

        {/* Search Bar */}
        {/* <div className="flex-grow mr-2 relative">
          <form>
            <input
              type="text"
              placeholder="Search your Medicines"
              className="w-full px-8 py-1 sm:py-2 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 transition-all duration-300 ease-in-out placeholder:text-xs sm:placeholder:p-4 sm:placeholder:text-base"
              onClick={() => {
                // Scroll to the main search bar when clicked
                document.getElementById("main-search-bar").scrollIntoView({
                  behavior: "smooth",
                });
              }}
            />
          </form>
        </div> */}
        <div className="mt-[-80px] sm:ml-[-40px] sm:w-[800px]">
        {showSearchInNavbar && <SearchBar />}
        </div>

        {/* Hamburger Menu Button */}
        <div className="flex items-center space-x-1 ">
          {/* Home Icon */}
          <div className="flex items-center space-x-2">
            {/* Home Icon - Visible only on Small Screens (Mobile) */}
            <div className="sm:hidden">
              <Link to="/" className="text-[#d9337b] hover:text-blue-600">
                <Home className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* Cart Icon (Only if authenticated) */}
          {isAuthenticated && (
            <Link
              to="/cart"
              className="text-[#d9337b] sm:hidden mb-[-2px] hover:text-blue-600 transition-colors duration-200 p-1 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="w-6 h-6" />
            </Link>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden rounded-md text-[#d9337b]  hover:text-blue-600 transition-colors duration-200 focus:outline-none"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <HiX className="w-6 h-6" />
            ) : (
              <HiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Improved Hamburger Menu Button */}
        <div
          className={`mobile-menu-container sm:hidden fixed top-[4rem] right-0 w-48 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex flex-col py-4">
            {/* <Link
              to="/"
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link> */}

            <Link
              to="/infoOrder"
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Order by prescription
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>

            {authState ? (
              <>
                <Link
                  to="/profile"
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>

                <div className="flex pl-4 pt-4">
                  <button
                    className="w-32 sm:w-auto px-8 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md shadow-md transition duration-200"
                    onClick={() => {
                      dispatch(logout());
                      localStorage.removeItem("token");
                      setIsMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Desktop Menu (unchanged) */}
        <div className="hidden sm:flex items-center space-x-6">
          {/* <Link
            to="/"
            className="text-black text-base hover:text-blue-600"
          >
            Home
          </Link> */}
          {/* Home Text - Visible only on Medium Screens and Above */}
          <div className="hidden sm:block">
            <Link
              to="/"
              className="text-black text-base hover:text-blue-600"
            >
              Home
            </Link>
          </div>
          <Link
            to="/infoOrder"
            className="text-black text-base hover:text-blue-600"
          >
            Order by prescription
          </Link>
          <Link
            to="/contact"
            className="text-black text-base hover:text-blue-600"
          >
            Contact
          </Link>

          {authState ? (
            <>
              <Link
                to="/profile"
                className="text-black text-base hover:text-blue-600"
              >
                Profile
              </Link>
              <Link
                to="/cart"
                className="text-black text-base hover:text-blue-600"
              >
                <div className="w-6 h-6 bg-white rounded-full flex justify-center items-center shadow-md">
                  <img className="w-4 h-4" src={cartImage} alt="Cart" />
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-black text-base hover:text-blue-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-black text-base hover:text-blue-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
