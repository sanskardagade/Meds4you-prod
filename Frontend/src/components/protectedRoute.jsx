import React,{ useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { logout } from "../redux/slice/authSlice"; // Adjust path as needed

const ProtectedRoute = ({ allowedRoles, publicOnly }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useDispatch();
  
  // Add login URL mapping
  const loginUrls = {
    user: '/',
    admin: '/api/auth/login',
    partner: '/api/partners/login'
  };

  useEffect(() => {
    validateAuth();
  }, []);

  const validateAuth = () => {
    const token = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("userType");

    // Handle public routes
    if (publicOnly && !token) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Handle no token
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Handle expired token
      if (decodedToken.exp < currentTime) {
        handleLogout();
        return;
      }

      // Enhanced role verification
      const userRole = decodedToken.role || decodedToken.userType || storedUserType;
      
      if (!userRole) {
        console.error("No user role found");
        handleLogout();
        return;
      }

      // Enhanced role verification for all user types
      if (['admin', 'user', 'partner'].includes(userRole)) {
        console.log(`${userRole} role verified`);
        if (allowedRoles && !allowedRoles.includes(userRole)) {
          console.error(`User role ${userRole} not authorized for this route`);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } else {
        console.error(`Invalid user role: ${userRole}`);
        handleLogout();
      }

    } catch (error) {
      console.error("Authentication Error:", error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Loading...</div>; // Replace with your loading component
  }

  if (!isAuthenticated) {
    const userType = localStorage.getItem("userType") || 'user';
    return <Navigate to={loginUrls[userType]} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
