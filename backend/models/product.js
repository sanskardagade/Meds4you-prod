import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  drugName: { type: String, required: true, trim: true, index: true },
  imageUrl: { type: String, trim: true },
  size: { type: String, trim: true },
  manufacturer: { type: String, required: true, trim: true, index: true },
  category: { type: String, trim: true },
  price: { type: Number, required: true, default: 0 },
  salt: { type: String, required: true, trim: true },
  // Main medicine fields for all variants
  ConditionTreated: { type: String, trim: true },
  Usage: { type: String, trim: true },
  CommonSideEffects: { type: String, trim: true },
  alternateMedicines: [{
    _id: false, // Disable _id for subdocuments
    name: { type: String, trim: true },
    size_1: { type: String, trim: true },
    manufacturerURL: { type: String, trim: true },
    price: { type: Number, default: 0 },
    mrp: { type: Number, required: true, default: 0 },
    Discount: { type: String, trim: true },
    imageUrl: { type: String, trim: true } // Optional URL field
  }],
  mrp: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true, // Add proper timestamps
  versionKey: false // Remove __v field
});

const Product = mongoose.model("Product", productSchema);
export default Product;
