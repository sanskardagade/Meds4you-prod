import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Partner from "../models/partner.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "Access token required" });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user is a partner
      if (decoded.role === "partner") {
        const partner = await Partner.findById(decoded.id);
        if (!partner) {
          return res.status(401).json({ error: "Partner not found" });
        }
        req.user = partner;
      } else {
        // Check if user is a regular user
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        req.user = user;
      }

      // Check if user's role is authorized
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      next();
    } catch (error) {
      console.error("Authorization Error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};
