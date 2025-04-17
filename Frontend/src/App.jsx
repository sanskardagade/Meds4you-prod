import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./auth/Login/Login";
import Signup from "./auth/Signup/Signup";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ContactUs from "./pages/Contact";
import Profile from "./pages/Profile";
import OrderMedicine from "./components/OrderMedicine";
import MedicineDetails from "./pages/MedicineDetails";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./components/protectedRoute";
import "react-toastify/dist/ReactToastify.css";
import OrderSummary from "./pages/OrderSummary";
import ScrollToTop from "./components/ScrollToTop";
import ReferralRegister from "./pages/SalesProgram/ReferralRegister";
import PartnerRegister from "./pages/SalesProgram/PartnerRegister";
import NotFound from "./pages/NotFound";
import CheckoutStepper from "./components/CheckOutStepper";
import TermsCondition from "./components/TermsCondition";
import PartnerDashboard from "./pages/PartnerDashboard";

function AppContent() {
  const location = useLocation();

  const handleSearch = (searchResults) => {
    setProducts(searchResults);
  };

  if (typeof window !== "undefined" && location.pathname.startsWith("/uploads/")) {
    window.location.replace(`https://meds4you.in${location.pathname}`);
    return null; // Prevents React from rendering anything
  }

  const noLayoutRoutes = ["/admin", "/uploads", "*", "/partner-dashboard"];
  const shouldShowLayout = !noLayoutRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // Define routes where stepper should be shown
  const stepperRoutes = ["/cart", "/checkout", "/payment", "/delivery"];
  const shouldShowStepper = stepperRoutes.includes(location.pathname);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = isMobile ? 150 : 50; // Set different thresholds for mobile and desktop
      if (window.scrollY > scrollThreshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const checkIfMobile = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true); // Mobile devices (screen width <= 768px)
      } else {
        setIsMobile(false);
      }
    };

    // Initialize on mount
    checkIfMobile();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkIfMobile); // To recheck on resize

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkIfMobile);
    };
  }, [isMobile]);

  return (
    <>
      {shouldShowLayout && (
        <Navbar onSearch={handleSearch} isScrolled={isScrolled} />
      )}
      {shouldShowStepper && <CheckoutStepper />}
      <ScrollToTop />
      <Routes>
        {/* Public Routes (accessible by non-logged-in users) */}
        <Route element={<ProtectedRoute publicOnly={true} />}>
          <Route path="/" element={<Home isScrolled={isScrolled} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Signup />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/products/:id" element={<MedicineDetails />} />
          <Route path="/medicine/:id" element={<MedicineDetails />} />
          <Route path="/infoOrder" element={<OrderMedicine />} />
          <Route path="/register/referral" element={<ReferralRegister />} />
          <Route path="/register/partner" element={<PartnerRegister />} />
          <Route path="/terms-condition" element={<TermsCondition />} />
        </Route>

        {/* Protected Routes for Admin */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Protected Routes for User */}
        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/order-summary" element={<OrderSummary />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        {/* Partner Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["partner"]} />}>
          <Route path="/partner-dashboard" element={<PartnerDashboard />} />
        </Route>

        {/* Other routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {shouldShowLayout && <Footer />}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        style={{ marginTop: "80px" }} // Add margin-top to avoid overlap with Navbar
      />
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
