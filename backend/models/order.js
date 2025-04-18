import { Schema, model } from "mongoose";

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        gstPercentage: { type: Number, default: 0 },
        productDetails: {
          drugName: { type: String, required: true },
          imageUrl: { type: String, required: true },
          size: { type: String, required: true },
          manufacturer: { type: String, required: true },
          category: { type: String, required: true },
          salt: { type: String, required: true },
          mrp: { type: Number, required: true },
          margin: { type: Number, required: true },
        },
      },
    ],
    prescriptionUrl: { type: String },
    invoiceUrl: { type: String },
    invoicePublicId: { type: String },
    totalAmount: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    totalAmountWithDelivery: { type: Number },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalTotal: { type: Number },
    paymentStatus: {
      type: String,
      enum: ["pending", "failed", "paid", "refunded", "chargeback", "pending_verification"],
      default: "pending",
    },
    paymentId: { type: String },
    paymentProof: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date }
    },
    addressProof: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date }
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "on_hold",
        "processing",
        "confirmed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
        "failed",
      ],
      default: "pending",
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    orderNumber: { type: String, unique: true },
  },
  { timestamps: true }
);

// Pre-save hook to generate order number before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const orderType = "O1"; // Define order type dynamically if needed

    // Generate date in DDMMYY format
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(2)}`;

    // Fetch today's order count to generate a unique ID
    const count = await model("Order").countDocuments({
      createdAt: { 
        $gte: new Date().setHours(0, 0, 0, 0), 
        $lt: new Date().setHours(23, 59, 59, 999) 
      }
    });

    const uniqueId = String(count).padStart(6, '0'); // Start from 000000

    this.orderNumber = `ORD(${orderType})(${dateStr})(${uniqueId})`;
  }
  next();
});

export default model("Order", orderSchema);
