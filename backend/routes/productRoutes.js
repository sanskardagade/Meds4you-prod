import express from "express";
import Product from "../models/product.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const results = await Product.find({
      drugName: { $regex: `^${q}`, $options: "i" }, // ✅ Strictly search by drugName only
    }).limit(10);

    res.json(results);
  } catch (error) {
    console.error("Search API error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { drugName: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
        { salt: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category; // ✅ Filtering by category here
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: err.message });
  }
});

// Fetch products by category or return top sellers if no category is provided
router.get("/category", async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.category = category; // Fetch products of the selected category
    } else {
      query = {}; // No category? Return default Top Sellers (Modify this logic as needed)
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching category products",
      error: err.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Always convert to object to avoid mongoose document restrictions
    const productData = product.toObject();

    // If the product has predefined alternateMedicines, return them as is
    if (productData.alternateMedicines && productData.alternateMedicines.length > 0) {
      return res.json(productData);
    }

    // Otherwise, find alternate products with the same salt
    const alternates = await Product.find({
      salt: product.salt,
      _id: { $ne: product._id }, // Exclude the current product
    }).select("drugName manufacturer price mrp imageUrl size_1 manufacturerURL Discount").lean();

    // Attach found alternates while preserving original product data
    productData.alternateMedicines = alternates;

    res.json(productData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new product
router.post("/createProduct", authenticateToken, async (req, res) => {
  try {
    const {
      drugName,
      size,
      imageUrl,
      manufacturer,
      category,
      price,
      salt,
      mrp,
      margin,
      alternateMedicines,
      ConditionTreated,
      Usage,
      CommonSideEffects
    } = req.body;

    // Validate required fields
    if (!drugName || !salt || !manufacturer || !price || !mrp || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new product
    const product = new Product({
      drugName,
      size,
      imageUrl,
      manufacturer,
      category,
      price,
      salt,
      mrp,
      margin: margin || mrp - price, // Auto-calculate margin if not provided
      alternateMedicines: alternateMedicines || [], // Ensure it's an array
      ConditionTreated: ConditionTreated || "",
      Usage: Usage || "",
      CommonSideEffects: CommonSideEffects || ""
    });

    // Save the product
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
