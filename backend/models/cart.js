import { Schema , model } from "mongoose";

const cartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    items: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Changed from medicineId to productId
            quantity: { type: Number, default: 1 },
        },
    ],
}, { timestamps: true });

export default model("Cart", cartSchema);