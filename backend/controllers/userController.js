import User from "../models/user.js";
import bcrypt from "bcryptjs";
import Partner from "../models/partner.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const register = async (req, res) => {
  try {
    const { phoneNumber, password, email, name, referredBy } = req.body;

    if (!phoneNumber || !password || !email || !name) {
      return res.status(400).json({ message: "Please fill all required fields!" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

// Check if email is in admin allowlist (replace with your admin emails)
    const adminEmails = ['admin@meds4you.in', 'admin@example.com']; 
    const isAdmin = adminEmails.includes(email.toLowerCase());

    // Hash password for all users including admin
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      phoneNumber,
      password: hashedPassword, // Use hashed password for all users
      email,
      name,
      role: isAdmin ? "admin" : "user",
      isApproved: isAdmin,
      referralCode: !isAdmin ? uuidv4().slice(0, 8).toUpperCase() : null,
      referredBy: !isAdmin ? referredBy : null
    });

    await newUser.save();
    
    res.status(201).json({
      message: isAdmin ? "Admin registered successfully" : "User registered successfully",
      referralCode: !isAdmin ? newUser.referralCode : undefined
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal Server Error" });
      }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all required fields!" });
    }

    const user = await User.findOne({ email }).select('+password +role');
    //console.log("Inside userController",user.role)      

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use bcrypt compare for all users
  
    const isMatch = await bcrypt.compare(password, user.password);
      
    if (!isMatch) {
      return res.status(401).json({ 
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login successful:", {
      role: user.role,
      tokenGenerated: !!token
    });

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        isApproved: user.isApproved
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: err.message 
    });
  }
};

const getReferredUsers = async (req, res) => {
  try {
      const { referralCode } = req.params;
      const referredUsers = await User.find({ referredBy: referralCode });

      res.status(200).json({ referredUsers });
  } catch (error) {
      res.status(500).json({ message: "Error fetching referrals", error: error.message });
  }
};

export { register, login, getReferredUsers };
