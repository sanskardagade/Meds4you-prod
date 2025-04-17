import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const referrerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  referralCode: { type: String, unique: true }, // Unique referral code for others to use
  earnedPoints: { type: Number, default: 0 }, // Reward points
  redeemedPoints: { type: Number, default: 0 } // Redeemed points
}, {timestamps: true});

// Hash password before saving
referrerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("Referrer", referrerSchema);
