import { Schema, model } from "mongoose";

const referNumSchema = new Schema({
    number: {type: Number, default: 1000}
}, {timestamps: true});

export default model("ReferNum", referNumSchema);