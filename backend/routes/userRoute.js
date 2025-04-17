import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import {authorizeRoles} from '../middlewares/authMiddleware.js'; // Import the auth middleware
import { getReferredUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", authorizeRoles('user'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add Address
// Add Address
router.post("/address", authorizeRoles('user'), async (req, res) => {
    try {
      const { userId, address } = req.body; // Expecting userId and address object in the body
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      user.addresses.push(address); // Add new address (address is an object now)
      await user.save(); // Save the updated user
  
      res.status(200).json({ message: "Address added successfully", addresses: user.addresses });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to add address" });
    }
  });
  
  
  
  // Delete Address
  router.delete("/address/:addressId",authorizeRoles('user'), async (req, res) => {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      user.addresses = user.addresses.filter((addr) => addr.id !== addressId);
      await user.save();
      res.status(200).json(user.addresses);
    } catch (err) {
      res.status(500).json({ message: "Error deleting address" });
    }
  });
  
  // Set Primary Address
  router.put("/address/:addressId",authorizeRoles('user'), async (req, res) => {
    try {
      const { addressId } = req.params;
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      // Set isPrimary for the selected address
      user.addresses = user.addresses.map((address) =>
        address.id === addressId
          ? { ...address, isPrimary: true }
          : { ...address, isPrimary: false }
      );
      await user.save();
      res.status(200).json(user.addresses);
    } catch (err) {
      res.status(500).json({ message: "Error setting primary address" });
    }
  });

  router.get('/addresses',authorizeRoles('user'), async (req, res) => {
    try {
      const user = await User.findById(req.user.id);  // Assuming user ID is in req.user.id after token verification
      if (!user) return res.status(404).json({ message: "User not found" });
  
      res.json({ addresses: user.addresses });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  router.get("/referrals/:referralCode", getReferredUsers);
  

export default router;
