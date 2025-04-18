import express from "express";
import mongoose from "mongoose";
import upload from "../middlewares/uploadMiddleware.js";
import Order from "../models/order.js";
import Cart from "../models/cart.js";
import { authorizeRoles } from "../middlewares/authMiddleware.js";
import { generateInvoice } from "../utils/invoiceGenerator.js";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";
import Prescription from "../models/prescriptionModel.js";
import Product from "../models/product.js";
import cloudinary from "../utils/cloudinary.js";
import User from "../models/user.js";

const router = express.Router();

router.get("/admin/orders", authorizeRoles("admin"), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email phoneNumber addresses")
      .populate("items.productId", "drugName manufacturer salt price mrp imageUrl")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/admin/orders/:orderId",
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId)
        .populate("userId", "name phoneNumber addresses")
        .populate(
          "items.productId",
          "drugName price imageUrl manufacturer alternateMedicines"
        )
        .lean(); // Converts Mongoose documents to plain JavaScript objects

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Format the order with null checks for productId
      const formattedOrder = {
        ...order,
        address: {
          street: order.address?.street || order.userId?.addresses?.[0]?.street || '',
          city: order.address?.city || order.userId?.addresses?.[0]?.city || '',
          state: order.address?.state || order.userId?.addresses?.[0]?.state || '',
          zipCode: order.address?.zipCode || order.userId?.addresses?.[0]?.zipCode || ''
        },
        items: order.items.map((item) => {
          const product = item.productId;

          // Check if productId is null or undefined
          if (!product) {
            return {
              ...item,
              productId: null,
              name: "Unknown Product",
              price: 0,
              manufacturer: "Unknown Manufacturer",
            };
          }

          const alternateMedicine = product?.alternateMedicines?.[0] || product; // Get the first alternate medicine if available

          return {
            ...item,
            productId: product._id,
            name: alternateMedicine.name || product.drugName,
            price: alternateMedicine.price || product.price,
            manufacturer:
              alternateMedicine.manufacturer || product.manufacturer,
          };
        }),
      };

      res.status(200).json(formattedOrder);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }
);

router.post("/create", authorizeRoles("user"), async (req, res) => {
  try {
    const { address, products, prescriptionUrl, totalAmount, deliveryCharge = 0 } = req.body;
    const userId = req.user.id;

    console.log("Order creation request:", {
      userId,
      address,
      productsCount: products?.length,
      prescriptionUrl,
      totalAmount,
      deliveryCharge
    });

    // Validate required fields
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    if (!prescriptionUrl) {
      return res.status(400).json({ error: "Prescription is required" });
    }
    if (!products || products.length === 0) {
      return res.status(400).json({ error: "No products selected" });
    }
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid total amount" });
    }

    // Validate each product
    for (const product of products) {
      if (!product.productId || !product.quantity || product.quantity <= 0) {
        return res.status(400).json({ error: "Invalid product data" });
      }
    }

    // Prepare order items
    const orderItems = products.map(({ productId, quantity, selection }) => {
      try {
        let selectedProduct = productId;

        if (selection === "recommended" && productId.alternateMedicines?.length) {
          selectedProduct = productId.alternateMedicines[0];
        }

        return {
          productId: selectedProduct._id || selectedProduct,
          quantity,
          price: selectedProduct.price,
          productDetails: {
            drugName: selectedProduct.drugName || selectedProduct.name,
            imageUrl: selectedProduct.imageUrl,
            size: selectedProduct.size || selectedProduct.size_1,
            manufacturer: selectedProduct.manufacturer,
            category: selectedProduct.category,
            salt: selectedProduct.salt,
            mrp: selectedProduct.mrp,
            margin: selectedProduct.mrp - selectedProduct.price,
          },
        };
      } catch (error) {
        console.error("Error processing product:", error);
        throw new Error(`Error processing product: ${error.message}`);
      }
    });

    // Create order with transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log("Creating order with items:", JSON.stringify(orderItems, null, 2)); // Debug log
      
      const order = await Order.create([{
        userId,
        items: orderItems,
        prescriptionUrl,
        totalAmount,
        deliveryCharge,
        totalAmountWithDelivery: totalAmount + deliveryCharge,
        finalTotal: totalAmount + deliveryCharge,
        address,
        orderStatus: "pending",
        paymentStatus: "pending",
      }], { session });

      // Clear user's cart
      await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },
        { session }
      );

      await session.commitTransaction();
      res.status(201).json({
        success: true,
        order: order[0],
        message: "Order placed successfully"
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create order", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post(
  "/payment-success",
  authorizeRoles("user"),
  async (req, res, next) => {
    const { paymentId, orderId } = req.body;
    const userId = req.user.id;
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // updating order status
      order.paymentStatus = "success";
      order.orderStatus = "confirmed";
      order.paymentId = paymentId;
      await order.save();

      // clearing cart after successful payment
      const cart = await Cart.findOne({ userId });
      cart.items = [];
      await cart.save();

      res.status(200).json({ message: "Payment successful" });
    } catch (err) {
      console.error("Error updating payment status:", err);
      next(err);
    }
  }
);

router.get("/latest", authorizeRoles("user"), async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    const userId = req.user.id;

    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name phoneNumber addresses")
      .populate(
        "items.productId",
        "drugName price imageUrl manufacturer alternateMedicines"
      ) // Populating item product details
      .select(
        "prescriptionUrl items totalAmount paymentStatus orderStatus createdAt"
      ) // Selecting prescriptionUrl from the order directly
      .exec();

    if (!latestOrder) {
      return res.status(404).json({ error: "No orders found" });
    }

    res.status(200).json(latestOrder);
  } catch (err) {
    console.error("Error fetching latest order:", err);
    res.status(500).json({ error: "Failed to fetch latest order" });
  }
});

router.put(
  "/orders/:orderId/status",
  authorizeRoles("admin"),
  async (req, res) => {
    // console.log("req.body", req.body);

    const { orderStatus, paymentStatus } = req.body;
    const { orderId } = req.params;
    const adminId = req.user.id; // Assuming req.user is set from auth middleware

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Validate order status
      const validOrderStatuses = [
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
      ];
      const validPaymentStatuses = [
        "pending",
        "failed",
        "paid",
        "refunded",
        "chargeback",
      ];

      if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({ error: "Invalid order status" });
      }

      if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ error: "Invalid payment status" });
      }

      // Update status and admin tracking
      order.orderStatus = orderStatus || order.orderStatus;
      order.paymentStatus = paymentStatus || order.paymentStatus;
      order.updatedBy = adminId;

      await order.save();

      res
        .status(200)
        .json({ message: "Order status updated successfully", order });
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

router.get("/order-history", authorizeRoles("user"), async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // Return stored product details from order instead of populating productId
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productId: item.productId, // Keeping reference
        quantity: item.quantity,
        price: item.price,
        productDetails: item.productDetails, // Use saved product details
      })),
    }));

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

router.post(
  "/upload-prescription",
  authorizeRoles("user"),
  upload.single("prescription"),
  async (req, res) => {
    try {
      if (!req.file) {
        console.error("No file in request:", req.file);
        return res.status(400).json({ error: "No file uploaded." });
      }

      if (!req.user || !req.user.id || !req.user.name) {
        console.error("Missing user info:", req.user);
        return res.status(400).json({ error: "User information missing." });
      }

      const userId = req.user.id;
      const userName = req.user.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      // Upload to Cloudinary in user's folder with prescription prefix
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `users/${userName}/${userId}`,
        public_id: `pres-${Date.now()}`,  // Using timestamp to ensure uniqueness
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "pdf", "heic"],
        transformation: [
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ]
      });

      // Clean up the temporary file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });

      res.status(200).json({
        success: true,
        fileUrl: result.secure_url,
        publicId: result.public_id
      });
    } catch (error) {
      console.error("Error uploading prescription:", error);
      
      // Clean up file if it exists
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting temporary file:", err);
        });
      }

      res.status(500).json({ 
        error: "Failed to upload prescription",
        details: error.message
      });
    }
  }
);

// Add new routes for managing order items
router.put('/admin/orders/:orderId/items/:itemId', authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity, price, gstPercentage } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const item = order.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update the item
    if (quantity) item.quantity = quantity;
    if (price) item.price = price;
    if (gstPercentage !== undefined) item.gstPercentage = gstPercentage;

    // Recalculate totals
    const subtotal = order.items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemGST = itemSubtotal * (item.gstPercentage || 0) / 100;
      return sum + itemSubtotal + itemGST;
    }, 0);

    // Calculate discount
    const discountAmount = (subtotal * (order.discountPercentage || 0)) / 100;
    order.discountAmount = discountAmount;

    // Calculate final total
    order.finalTotal = subtotal - discountAmount + (order.deliveryCharge || 0);

    await order.save();
    res.json(order);
  } catch (error) {
    console.error("Error updating order item:", error);
    res.status(500).json({ message: "Error updating order item" });
  }
});

router.delete("/admin/orders/:orderId/items/:itemId", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Remove the item from the items array
    order.items = order.items.filter(item => item._id.toString() !== itemId);

    // Recalculate total amount
    order.totalAmount = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Recalculate GST and total with GST
    order.gstAmount = order.totalAmount * (order.gstPercentage / 100);
    order.totalAmountWithGST = order.totalAmount + order.gstAmount;

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add route for updating GST
router.put("/admin/orders/:orderId/gst", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { gstPercentage } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update GST percentage
    order.gstPercentage = gstPercentage || 0;

    // Recalculate GST amount and total with GST
    order.gstAmount = order.totalAmount * (order.gstPercentage / 100);
    order.totalAmountWithGST = order.totalAmount + order.gstAmount;

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate and download invoice
router.post(
  "/admin/orders/:orderId/generate-invoice",
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId)
        .populate("userId", "name email phoneNumber")
        .populate("items.productId", "drugName manufacturer");

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Generate PDF invoice
      const pdfBuffer = await generateInvoice(order);

      // Create a temporary file path
      const tempFilePath = `temp-invoice-${orderId}.pdf`;
      fs.writeFileSync(tempFilePath, pdfBuffer);

      try {
        // Get user info for folder structure
        const userName = order.userId.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const userId = order.userId._id;

        // Upload to Cloudinary in user's folder with invoice prefix
        const result = await cloudinary.uploader.upload(tempFilePath, {
          folder: `users/${userName}/${userId}`,
          public_id: `invoice-${orderId}`,
          resource_type: "auto",
          pages: true,
          format: "png",
          transformation: [
            { width: 800, crop: "scale" },
            { quality: "auto" },
            { fetch_format: "auto" }
          ]
        });

        // Save invoice URL to order
        order.invoiceUrl = result.secure_url;
        order.invoicePublicId = result.public_id;
        await order.save();

        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=invoice-${orderId}.pdf`
        );

        // Send the PDF
        res.send(pdfBuffer);
      } catch (cloudinaryError) {
        console.error("Cloudinary upload error:", cloudinaryError);
        // Still send the PDF even if Cloudinary upload fails
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=invoice-${orderId}.pdf`
        );
        res.send(pdfBuffer);
      } finally {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempFilePath);
        } catch (unlinkError) {
          console.error("Error deleting temporary file:", unlinkError);
        }
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  }
);

// Route to get prescription file
router.get(
  "/admin/orders/:orderId/prescription",
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!order.prescriptionUrl) {
        return res.status(404).json({ error: "Prescription not found" });
      }

      // Extract filename from the URL
      const filename = order.prescriptionUrl.split('/').pop();
      
      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=${filename}`);
      
      // Try to serve the file from the local uploads directory first
      res.sendFile(`/var/www/uploads/${filename}`, (err) => {
        if (err) {
          console.error("Error serving local file:", err);
          // If local file not found, try to fetch from the URL
          fetch(order.prescriptionUrl)
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
  }
);

// Create order from prescription
router.post("/create-from-prescription/:prescriptionId", authorizeRoles("admin"), async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    // Find the prescription
    const prescription = await Prescription.findById(prescriptionId)
      .populate("userId", "name email phoneNumber addresses");
    
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Create order with prescription details
    const order = new Order({
      userId: prescription.userId._id,
      prescriptionUrl: prescription.fileUrl,
      totalAmount: 0, // Will be updated when items are added
      paymentStatus: "pending",
      orderStatus: "pending",
      address: prescription.deliveryAddress,
      items: [], // Will be populated when admin adds items
      gstPercentage: 18, // Default GST percentage
      gstAmount: 0,
      totalAmountWithGST: 0
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order._id
    });
  } catch (error) {
    console.error("Error creating order from prescription:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create order from prescription",
      details: error.message
    });
  }
});

// Add item to order
router.post("/admin/orders/:orderId/items", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, price, gstPercentage, isAlternate, alternateIndex } = req.body;

    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get the correct price based on whether it's an alternate medicine
    let finalPrice = price;
    let productDetails = {
      name: product.drugName,
      drugName: product.drugName,
      price: finalPrice,
      margin: product.margin || 0,
      imageUrl: product.imageUrl || "",
      mrp: product.mrp || 0,
      salt: product.salt || "",
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      size: product.size || ""
    };

    if (isAlternate && alternateIndex !== undefined && product.alternateMedicines?.[alternateIndex]) {
      const altMedicine = product.alternateMedicines[alternateIndex];
      finalPrice = altMedicine.price || price;
      productDetails = {
        ...productDetails,
        name: altMedicine.name || product.drugName,
        drugName: altMedicine.name || product.drugName,
        price: finalPrice,
        mrp: altMedicine.mrp || product.mrp || 0,
        manufacturer: altMedicine.manufacturer || product.manufacturer,
        size: altMedicine.size_1 || product.size
      };
    }

    // Add the new item
    const newItem = {
      productId: productId, // Use the base product ID
      quantity,
      price: finalPrice,
      gstPercentage: gstPercentage || 0,
      isAlternate,
      alternateIndex: isAlternate ? alternateIndex : undefined,
      productDetails // Add product details
    };

    order.items.push(newItem);

    // Recalculate total amount
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    order.totalAmount = subtotal;

    // Calculate total GST
    const totalGST = order.items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      return sum + (itemSubtotal * (item.gstPercentage || 0) / 100);
    }, 0);

    // Update final totals
    const totalWithGST = subtotal + totalGST;
    const discountAmount = (totalWithGST * (order.discountPercentage || 0)) / 100;
    
    order.finalTotal = totalWithGST - discountAmount + (order.deliveryCharge || 0);

    await order.save();

    // Populate the order details before sending response
    const populatedOrder = await Order.findById(orderId)
      .populate("userId", "name phoneNumber addresses")
      .populate(
        "items.productId",
        "drugName price imageUrl manufacturer alternateMedicines"
      )
      .lean();

    res.json(populatedOrder);
  } catch (error) {
    console.error("Error adding item to order:", error);
    res.status(500).json({ message: "Error adding item to order" });
  }
});

// Add this new route for reordering
router.post('/reorder', authorizeRoles("user"), async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items selected for reorder' });
    }

    // Verify all products still exist and are in stock
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId)
        .populate('alternateMedicines'); // Populate alternate medicines
      
      if (!product) {
        return res.status(404).json({ 
          message: `Product ${item.productDetails?.drugName || 'Unknown'} is no longer available` 
        });
      }

      // Handle alternate medicines if available
      let selectedProduct = product;
      let alternateMedicines = [];
      
      if (product.alternateMedicines?.length > 0) {
        alternateMedicines = product.alternateMedicines.map(alt => ({
          _id: alt._id,
          name: alt.name || alt.drugName,
          price: alt.price,
          manufacturer: alt.manufacturer,
          imageUrl: alt.imageUrl || alt.manufacturerUrl,
          salt: alt.salt,
          mrp: alt.mrp,
          margin: alt.margin
        }));
      }

      // If user selected a specific alternate medicine
      if (item.selection === "recommended" && alternateMedicines.length > 0) {
        selectedProduct = alternateMedicines[0];
      }

      // Ensure all required fields are present with fallbacks
      const productDetails = {
        drugName: selectedProduct.name || selectedProduct.drugName || "Unknown Drug",
        imageUrl: selectedProduct.imageUrl || selectedProduct.manufacturerUrl || "https://meds4you.in/uploads/default-medicine.png",
        size: product.size || "Standard",
        manufacturer: selectedProduct.manufacturer || product.manufacturer || "Unknown Manufacturer",
        category: product.category || "General",
        salt: selectedProduct.salt || product.salt || "Not specified",
        mrp: selectedProduct.mrp || product.mrp || 0,
        margin: selectedProduct.margin || product.margin || 0,
        alternateMedicines // Include alternate medicines in product details
      };

      validatedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: selectedProduct.price || product.price || 0,
        gstPercentage: item.gstPercentage || 0,
        productDetails,
        selection: item.selection || "original" // Track which version was selected
      });
    }

    // Create new order
    const newOrder = new Order({
      userId: req.user._id,
      items: validatedItems,
      totalAmount: validatedItems.reduce((sum, item) => {
        const subtotal = item.price * item.quantity;
        const gstAmount = subtotal * (item.gstPercentage || 0) / 100;
        return sum + subtotal + gstAmount;
      }, 0),
      orderStatus: 'pending',
      paymentStatus: 'pending',
      gstPercentage: 18, // Default GST percentage
      gstAmount: 0, // Will be calculated
      totalAmountWithGST: 0 // Will be calculated
    });

    // Calculate GST and total with GST
    newOrder.gstAmount = newOrder.totalAmount * (newOrder.gstPercentage / 100);
    newOrder.totalAmountWithGST = newOrder.totalAmount + newOrder.gstAmount;

    await newOrder.save();

    // Get user's default address
    const user = await User.findById(req.user._id);
    const defaultAddress = user.addresses.find(addr => addr.isPrimary);
    if (defaultAddress) {
      newOrder.shippingAddress = defaultAddress;
      await newOrder.save();
    }

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating reorder:', error);
    res.status(500).json({ message: 'Error creating reorder', error: error.message });
  }
});

// Add this route to get order details
router.get('/:orderId', authorizeRoles("user"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if the order belongs to the requesting user
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Add this new endpoint to handle discount updates
router.put(
  "/admin/orders/:orderId/discount",
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { discountPercentage, discountAmount, finalTotal } = req.body;

      // Validate input
      if (discountPercentage < 0 || discountPercentage > 100) {
        return res.status(400).json({ error: "Discount percentage must be between 0 and 100" });
      }

      // Find the order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Update the order with discount information
      order.discountPercentage = discountPercentage;
      order.discountAmount = discountAmount;
      order.finalTotal = finalTotal;

      // Save the updated order
      await order.save();

      // Return the updated order
      const updatedOrder = await Order.findById(orderId)
        .populate("userId", "name phoneNumber addresses")
        .populate(
          "items.productId",
          "drugName price imageUrl manufacturer alternateMedicines"
        )
        .lean();

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating discount:", error);
      res.status(500).json({ error: "Failed to update discount" });
    }
  }
);

// Add payment proof upload endpoint
router.post('/:orderId/payment-proof', authorizeRoles("user"), upload.single('paymentProof'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userName = req.user.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to order' });
    }

    // Verify order is in processing status
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({ message: 'Order is not in processing status' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `users/${userName}/${userId}/payment-proofs`,
      public_id: `payment-${orderId}`,
      resource_type: "auto",
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ]
    });

    // Update order with payment proof
    order.paymentProof = {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date()
    };
    order.paymentStatus = 'pending_verification';
    await order.save();

    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      order
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ message: 'Error uploading payment proof', error: error.message });
  }
});

// Add address proof upload endpoint
router.post('/:orderId/address-proof', authorizeRoles("user"), upload.single('addressProof'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userName = req.user.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to order' });
    }

    // Verify order is in processing status
    if (order.orderStatus !== 'processing') {
      return res.status(400).json({ message: 'Order is not in processing status' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `users/${userName}/${userId}/address-proofs`,
      public_id: `address-${orderId}`,
      resource_type: "auto",
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: [
        { quality: "auto:good" },
        { fetch_format: "auto" }
      ]
    });

    // Update order with address proof
    order.addressProof = {
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date()
    };
    await order.save();

    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temporary file:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Address proof uploaded successfully',
      order
    });
  } catch (error) {
    console.error('Error uploading address proof:', error);
    res.status(500).json({ message: 'Error uploading address proof', error: error.message });
  }
});

// Add route for updating item quantity
router.put("/admin/orders/:orderId/items/:itemId/quantity", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find and update the item
    const item = order.items.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    // Update quantity
    item.quantity = quantity;

    // Recalculate total amount
    order.totalAmount = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Calculate total GST from individual items
    const totalGST = order.items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      return sum + (itemSubtotal * (item.gstPercentage || 0) / 100);
    }, 0);

    // Update GST and total with GST
    order.gstAmount = totalGST;
    order.totalAmountWithGST = order.totalAmount + totalGST;

    // Recalculate final total with discount
    if (order.discountPercentage > 0) {
      order.discountAmount = (order.totalAmountWithGST * order.discountPercentage) / 100;
      order.finalTotal = order.totalAmountWithGST - order.discountAmount;
    } else {
      order.discountAmount = 0;
      order.finalTotal = order.totalAmountWithGST;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add route for updating delivery charge
router.put("/admin/orders/:orderId/delivery-charge", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCharge } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update delivery charge
    order.deliveryCharge = deliveryCharge;

    // Recalculate total amount
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Update total with delivery charge
    order.totalAmount = subtotal;
    order.totalAmountWithDelivery = subtotal + deliveryCharge;

    // Recalculate final total with discount
    if (order.discountPercentage > 0) {
      order.discountAmount = (order.totalAmountWithDelivery * order.discountPercentage) / 100;
      order.finalTotal = order.totalAmountWithDelivery - order.discountAmount;
    } else {
      order.discountAmount = 0;
      order.finalTotal = order.totalAmountWithDelivery;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add delivery charge update route
router.put("/admin/orders/:orderId/delivery-charge", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryCharge } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update delivery charge
    order.deliveryCharge = deliveryCharge;
    
    // Recalculate final total
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * (order.discountPercentage || 0)) / 100;
    order.discountAmount = discountAmount;
    order.finalTotal = subtotal - discountAmount + deliveryCharge;

    await order.save();
    res.json(order);
  } catch (error) {
    console.error("Error updating delivery charge:", error);
    res.status(500).json({ message: "Error updating delivery charge" });
  }
});

// Add route for updating GST percentage
router.put("/admin/orders/:orderId/items/:itemId", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity, price, gstPercentage } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find and update the item
    const item = order.items.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in order" });
    }

    // Update item fields
    if (quantity !== undefined) item.quantity = quantity;
    if (price !== undefined) item.price = price;
    if (gstPercentage !== undefined) item.gstPercentage = gstPercentage;

    // Recalculate total amount
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    order.totalAmount = subtotal;

    // Calculate total GST
    const totalGST = order.items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      return sum + (itemSubtotal * (item.gstPercentage || 0) / 100);
    }, 0);

    // Update final totals
    const totalWithGST = subtotal + totalGST;
    const discountAmount = (totalWithGST * (order.discountPercentage || 0)) / 100;
    
    order.finalTotal = totalWithGST - discountAmount + (order.deliveryCharge || 0);

    await order.save();
    res.json({ message: "Order item updated successfully", order });
  } catch (error) {
    console.error("Error updating order item:", error);
    res.status(500).json({ message: "Error updating order item" });
  }
});

// Add route for adding items to an order
router.post("/admin/orders/:orderId/items", authorizeRoles("admin"), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, price, gstPercentage, isAlternate, alternateIndex } = req.body;

    // Validate input
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get the correct price based on whether it's an alternate medicine
    let finalPrice = price;
    if (isAlternate && alternateIndex !== undefined && product.alternateMedicines?.[alternateIndex]) {
      finalPrice = product.alternateMedicines[alternateIndex].price || price;
    }

    // Add the new item
    const newItem = {
      productId: productId, // Use the base product ID
      quantity,
      price: finalPrice,
      gstPercentage: gstPercentage || 0,
      isAlternate,
      alternateIndex: isAlternate ? alternateIndex : undefined
    };

    order.items.push(newItem);

    // Recalculate total amount
    const subtotal = order.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    order.totalAmount = subtotal;

    // Calculate total GST
    const totalGST = order.items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity;
      return sum + (itemSubtotal * (item.gstPercentage || 0) / 100);
    }, 0);

    // Update final totals
    const totalWithGST = subtotal + totalGST;
    const discountAmount = (totalWithGST * (order.discountPercentage || 0)) / 100;
    
    order.finalTotal = totalWithGST - discountAmount + (order.deliveryCharge || 0);

    await order.save();

    // Populate the order details before sending response
    const populatedOrder = await Order.findById(orderId)
      .populate("userId", "name phoneNumber addresses")
      .populate(
        "items.productId",
        "drugName price imageUrl manufacturer alternateMedicines"
      )
      .lean();

    res.json(populatedOrder);
  } catch (error) {
    console.error("Error adding item to order:", error);
    res.status(500).json({ message: "Error adding item to order" });
  }
});

export default router; 
