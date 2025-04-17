import express from "express";
import upload from "../middlewares/uploadMiddleware.js";
import { uploadPrescription } from "../controllers/prescriptionController.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";
import Prescription from "../models/prescriptionModel.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router(); 

// Upload prescription route
router.post(
  "/upload", 
  authorizeRoles("user"),
  upload.single("prescription"),
  uploadPrescription
);

// Fetch All Prescriptions for Admin Dashboard
router.get("/admin", authorizeRoles("admin"), async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('userId', 'name email')
      .sort({ uploadedAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Error fetching prescriptions" });
  }
});

// Fetch All Prescriptions for User Dashboard
router.get("/user", authorizeRoles("user"), async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ userId: req.user.id })
      .select("fileUrl status uploadedAt")
      .sort({ uploadedAt: -1 });

    // Convert uploadedAt to ISO string before sending
    const formattedPrescriptions = prescriptions.map(prescription => ({
      ...prescription.toObject(),
      uploadedAt: prescription.uploadedAt.toISOString()
    }));

    res.status(200).json(formattedPrescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions." });
  }
});

router.put("/update-status/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } 
    );

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.status(200).json({ message: "Status updated successfully", prescription });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Error updating prescription status" });
  }
});

// Get single prescription by ID
router.get("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('userId', 'name email phoneNumber');
    
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Error fetching prescription" });
  }
});

// Get prescription file
router.get("/file/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Extract filename from the URL
    const filename = prescription.fileUrl.split('/').pop();
    
    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);
    
    // Try to serve the file from the local uploads directory
    const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
    const filePath = path.join(process.cwd(), uploadsDir, filename);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving local file:", err);
        // If local file not found, try to fetch from the URL
        fetch(prescription.fileUrl)
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch prescription');
            response.buffer().then(buffer => {
              res.send(buffer);
            });
          })
          .catch(error => {
            console.error("Error fetching from URL:", error);
            res.status(500).json({ error: "Failed to fetch prescription file" });
          });
      }
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    res.status(500).json({ error: "Failed to fetch prescription" });
  }
});

// Add medicine to prescription
router.post("/:id/medicines", authorizeRoles("admin"), async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    prescription.medicines.push({
      productId,
      quantity: quantity || 1,
      notes
    });

    await prescription.save();
    res.status(200).json(prescription);
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ error: "Failed to add medicine" });
  }
});

// Update medicine in prescription
router.put("/:id/medicines/:medicineId", authorizeRoles("admin"), async (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    const medicine = prescription.medicines.id(req.params.medicineId);
    if (!medicine) {
      return res.status(404).json({ error: "Medicine not found" });
    }

    medicine.quantity = quantity || medicine.quantity;
    medicine.notes = notes || medicine.notes;

    await prescription.save();
    res.status(200).json(prescription);
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ error: "Failed to update medicine" });
  }
});

// Remove medicine from prescription
router.delete("/:id/medicines/:medicineId", authorizeRoles("admin"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    prescription.medicines = prescription.medicines.filter(
      medicine => medicine._id.toString() !== req.params.medicineId
    );

    await prescription.save();
    res.status(200).json(prescription);
  } catch (error) {
    console.error("Error removing medicine:", error);
    res.status(500).json({ error: "Failed to remove medicine" });
  }
});

export default router;
