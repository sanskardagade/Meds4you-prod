import cloudinary from "../utils/cloudinary.js";
import Prescription from "../models/prescriptionModel.js";
import fs from "fs";

export const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(400).json({ error: "User information missing." });
    }

    console.log("Upload started for user:", {
      userId: req.user.id,
      userName: req.user.name,
      file: req.file.path
    });

    const userId = req.user.id;
    const userName = req.user.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    // Parse address from request body
    let deliveryAddress;
    try {
      deliveryAddress = typeof req.body.address === 'string' 
        ? JSON.parse(req.body.address) 
        : req.body.address;
    } catch (error) {
      console.error("Error parsing address:", error);
      return res.status(400).json({ error: "Invalid address format" });
    }

    // Upload to Cloudinary in user-specific folder
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `users/${userName}/${userId}/prescriptions`,
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "pdf", "heic"],
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ]
      });

      console.log("Cloudinary upload successful:", {
        publicId: result.public_id,
        url: result.secure_url
      });

      // Create new prescription
      const prescription = new Prescription({
        userId: req.user.id,
        fileUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        deliveryAddress: deliveryAddress,
        instructions: req.body.instructions
      });

      await prescription.save();
      console.log("Prescription saved to database:", prescription._id);

      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });

      res.status(201).json({
        message: "Prescription uploaded successfully",
        prescription
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      return res.status(500).json({ 
        error: "Failed to upload to cloud storage",
        details: cloudinaryError.message
      });
    }
  } catch (error) {
    console.error("Error in prescription upload:", error);
    res.status(500).json({ 
      error: "Failed to upload prescription",
      details: error.message
    });
  }
};
