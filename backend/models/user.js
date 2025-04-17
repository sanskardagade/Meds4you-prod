import { Schema, model } from "mongoose";

// Define the user schema
const userSchema = new Schema(
  {
    email: { type: String, required: true }, // Ensure email is unique or indexed if necessary
    password: { type: String, required: true }, // Make sure to hash this password before saving
    name: { type: String, required: true, ref: "User" }, // Name of the user
    phoneNumber: { type: String, required: true }, // Phone number should be unique if that's your use case
    referralCode: { type: String }, // Unique referral code for each user
    referredBy: { type: String, ref: "User" }, // Reference to the user who referred this user
    role: { type: String, enum: ["user", "admin"], required: true },
    isApproved: { type: Boolean, default: true },
    BDA1: { type: String, default: null },
    BDA2: { type: String, default: null },
    addresses: [
      {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    customerNumber: { type: String, unique: true },
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt timestamps

// Add the pre-save hook first
userSchema.pre("save", async function (next) {
  if (!this.customerNumber) {
    const customerType = "C1";
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(2)}`;
    
    // Use this.constructor instead of User model
    const count = await this.constructor.countDocuments({
      createdAt: { 
        $gte: new Date().setHours(0, 0, 0, 0), 
        $lt: new Date().setHours(23, 59, 59, 999) 
      }
    });

    const uniqueId = String(count).padStart(6, '0');
    this.customerNumber = `CUS(${customerType})(${dateStr})(${uniqueId})`;
  }
  next();
});

// Create a singleton instance
let User;
try {
  User = model("User", userSchema);
} catch (error) {
  // If the model already exists, get it
  User = model("User");
}

export default User;
