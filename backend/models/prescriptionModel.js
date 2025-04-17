import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileUrl: { type: String, required: true }, // Cloudinary secure URL
  cloudinaryPublicId: { type: String, required: true }, // Cloudinary public ID for future reference
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Reviewed", "Completed"], default: "Pending" },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
  },
  instructions: { type: String, trim: true },
  medicines: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    notes: { type: String, trim: true }
  }]
});

export default mongoose.model("Prescription", prescriptionSchema);