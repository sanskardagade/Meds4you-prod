import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const partnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    referralCode: { type: String, unique: true, sparse: true },
    aadharUrl: { type: String, required: true },
    panUrl: { type: String, required: true },
    cashBack: { type: Number, default: 0 },
    isApproved: { type: Boolean, default: false },
    bankDetails: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
      accountHolderName: { type: String, required: true },
    },
    businessPartnerNumber: { type: String, unique: true, sparse: true },
    BPANumber: { type: String, unique: true, sparse: true }, // Temporary field for migration
  },
  { timestamps: true }
);

// Pre-save hook to generate business partner number before saving
partnerSchema.pre("save", async function (next) {
  if (!this.businessPartnerNumber) {
    try {
      const partnerType = "B1"; // Define partner type dynamically if needed

      // Generate date in DDMMYY format
      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, "0")}${String(
        now.getMonth() + 1
      ).padStart(2, "0")}${String(now.getFullYear()).slice(2)}`;

      let uniqueId;
      let isUnique = false;

      while (!isUnique) {
        // Fetch the current count of partners for the day
        const count = await this.constructor.countDocuments({
          createdAt: {
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999),
          },
        });

        uniqueId = String(count + 1).padStart(6, "0"); // Ensure uniqueness
        const newNumber = `BPA(${partnerType})(${dateStr})(${uniqueId})`;
        
        // Set both fields to ensure compatibility
        this.businessPartnerNumber = newNumber;
        this.BPANumber = newNumber;

        // Check if this number already exists
        const existingPartner = await this.constructor.findOne({
          $or: [
            { businessPartnerNumber: newNumber },
            { BPANumber: newNumber }
          ]
        });
        
        if (!existingPartner) {
          isUnique = true; // Found a unique business partner number
        }
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Migration hook to ensure BPANumber is set for existing documents
partnerSchema.pre("find", function(next) {
  if (this.businessPartnerNumber && !this.BPANumber) {
    this.BPANumber = this.businessPartnerNumber;
  }
  next();
});

export default mongoose.model("Partner", partnerSchema);
