import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";
import { v4 as uuidv4 } from "uuid";
import Partner from "../models/partner.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

const router = express.Router();

// Aadhar Upload Route
router.post("/upload/aadhar", upload.single("aadhar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only PDF, JPEG, and PNG files are allowed." });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: "File size too large. Maximum size is 5MB." });
    }

    const domain = process.env.DOMAIN || "meds4you.in";
    const aadharUrl = `https://${domain}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "Aadhar uploaded successfully!",
      aadharUrl,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);
    return res.status(500).json({ error: "Error uploading Aadhar. Please try again." });
  }
});

// PAN Upload Route
router.post("/upload/pan", upload.single("pan"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only PDF, JPEG, and PNG files are allowed." });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: "File size too large. Maximum size is 5MB." });
    }

    const domain = process.env.DOMAIN || "meds4you.in";
    const panUrl = `https://${domain}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: "PAN uploaded successfully!",
      panUrl,
    });
  } catch (error) {
    console.error("❌ Error uploading PAN:", error);
    return res.status(500).json({ error: "Error uploading PAN. Please try again." });
  }
});

// Partner Registration Route
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      aadharUrl,
      panUrl,
      bankAccountNumber,
      ifscCode,
      bankName,
      accountHolderName,
      referralCode,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !aadharUrl ||
      !panUrl ||
      !bankAccountNumber ||
      !ifscCode ||
      !bankName ||
      !accountHolderName
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Phone number must be exactly 10 digits." });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character." 
      });
    }

    // Check if partner already exists
    const existingPartner = await Partner.findOne({ email });
    if (existingPartner) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new partner with retry logic for BPANumber generation
    let newPartner;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        newPartner = new Partner({
          name,
          email,
          phone,
          password: hashedPassword,
          aadharUrl,
          panUrl,
          bankDetails: {
            accountNumber: bankAccountNumber,
            ifscCode,
            bankName,
            accountHolderName,
          },
          referralCode: referralCode || uuidv4().slice(0, 8).toUpperCase(),
          isApproved: false, // Partner needs admin approval
        });

        await newPartner.save();
        break; // If save is successful, break the loop
      } catch (error) {
        if (error.code === 11000) {
          if (error.keyPattern.businessPartnerNumber || error.keyPattern.BPANumber) {
            retryCount++;
            if (retryCount === maxRetries) {
              return res.status(500).json({ 
                error: "Error generating partner number. Please try again in a few moments." 
              });
            }
            // Wait for a short time before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error; // Re-throw other unique key errors
          }
        } else {
          throw error; // Re-throw other errors
        }
      }
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: "Partner registered successfully. Awaiting admin approval.",
      partner: {
        id: newPartner._id,
        name: newPartner.name,
        email: newPartner.email,
        phone: newPartner.phone,
        referralCode: newPartner.referralCode,
        businessPartnerNumber: newPartner.businessPartnerNumber || newPartner.BPANumber
      }
    });
  } catch (error) {
    console.error("❌ Error registering partner:", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(400).json({ error: "Email already registered." });
      }
      if (error.keyPattern.referralCode) {
        return res.status(400).json({ error: "Referral code already exists." });
      }
      if (error.keyPattern.businessPartnerNumber || error.keyPattern.BPANumber) {
        return res.status(400).json({ error: "Error generating partner number. Please try again." });
      }
      return res.status(400).json({ error: "A unique field already exists. Please try again." });
    }
    
    res.status(500).json({ error: "Error registering partner. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login Request Body:", req.body);

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Only check the Partner collection
    const user = await Partner.findOne({ email });

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the account is verified
    if (!user.isApproved) {
      console.log("❌ User not verified!");
      return res
        .status(403)
        .json({ error: "Account not verified. Awaiting admin approval." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password does not match!");
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Generate JWT Token
    console.log("✅ Password matched, generating token...");
    const token = jwt.sign(
      { id: user._id, email: user.email, userType: "partner" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful!");

    // Send response with phone and cashback info
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      userType: "partner",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        cashback: user.cashback || 0,
        referralCode: user.referralCode || null,
      },
    });
  } catch (error) {
    console.error("❌ Error logging in:", error);
    res.status(500).json({ error: "Error logging in." });
  }
});

export default router;
