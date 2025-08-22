const { validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { storage } = require("../firebase.config");
const { v4: uuidv4 } = require("uuid");
const Product = require("../models/product");

// Get all products for the authenticated user
exports.getDashboard = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    const userId = decodedToken.userId;
    
    const products = await Product.find({ userId: userId });
    
    res.status(200).json({
      success: true,
      data: {
        products: products,
        totalProducts: products.length
      }
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

// Add a new product
exports.postAddProduct = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files ? req.files.length : 0);
    console.log('File URLs:', req.fileUrls || []);

    const {
      title,
      arabicTitle,
      price,
      description,
      details,
      sizeFrom,
      sizeTo,
      sizeInLetters,
      sizeInCm,
      size,
      firstColor,
      secondColor,
      rating
    } = req.body;

    // Validate request
    const errors = validationResult(req);
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    const userId = decodedToken.userId;

    // Create product
    const product = new Product({
      title,
      arabicTitle,
      price: parseFloat(price),
      description,
      details,
      imageUrl: { 
        images: req.fileUrls || [] // Use the uploaded file URLs
      },
      sizeFrom: sizeFrom ? parseInt(sizeFrom) : undefined,
      sizeTo: sizeTo ? parseInt(sizeTo) : undefined,
      sizeInLetters,
      sizeInCm,
      size: size ? { range: Array.isArray(size) ? size : [size] } : { range: [] },
      firstColor,
      secondColor,
      rating: rating ? parseFloat(rating) : undefined,
      userId,
    });

    // Save product
    const savedProduct = await product.save();
    console.log('Product saved successfully:', savedProduct._id);
    
    res.status(201).json({ 
      success: true,
      message: "Product added successfully", 
      data: {
        product: savedProduct
      }
    });
    
  } catch (err) {
    console.error('Error in postAddProduct:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "An error occurred while adding product", 
      error: err.message 
    });
  }
};

// Update an existing product
exports.postEditProduct = async (req, res) => {
  try {
    console.log('Update product request received');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files ? req.files.length : 0);
    console.log('File URLs:', req.fileUrls || []);

    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    const userId = decodedToken.userId;
    const prodId = req.params.productId;

    if (!prodId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const {
      title: updatedTitle,
      arabicTitle: updatedArabicTitle,
      price: updatedPrice,
      description: updatedDesc,
      details: updatedDetails,
      sizeFrom: updatedSizeFrom,
      sizeTo: updatedSizeTo,
      sizeInLetters: updatedSizeInLetters,
      sizeInCm: updatedSizeInCm,
      size: updatedSize,
      firstColor,
      secondColor,
      rating: updatedRating,
      keepExistingImages = "false" // Optional flag to keep existing images
    } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validation errors occurred.",
        validationErrors: errors.array(),
      });
    }

    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found." 
      });
    }

    // Check if the user owns this product
    if (product.userId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "Forbidden: You are not authorized to edit this product." 
      });
    }

    // Update product fields
    product.title = updatedTitle;
    product.arabicTitle = updatedArabicTitle;
    product.price = parseFloat(updatedPrice);
    product.description = updatedDesc;
    product.details = updatedDetails;
    product.sizeFrom = updatedSizeFrom ? parseInt(updatedSizeFrom) : undefined;
    product.sizeTo = updatedSizeTo ? parseInt(updatedSizeTo) : undefined;
    product.sizeInLetters = updatedSizeInLetters;
    product.sizeInCm = updatedSizeInCm ? parseInt(updatedSizeInCm) : undefined;
    product.size = updatedSize ? { 
      range: Array.isArray(updatedSize) ? updatedSize : [updatedSize] 
    } : product.size;
    product.firstColor = firstColor;
    product.secondColor = secondColor;
    product.rating = updatedRating ? parseFloat(updatedRating) : undefined;

    // Handle image updates - REPLACE existing images with new ones
    if (req.fileUrls && req.fileUrls.length > 0) {
      console.log('Replacing existing images with new ones');
      
      // If keepExistingImages is false or not provided, replace all images
      if (keepExistingImages === "false") {
        product.imageUrl.images = req.fileUrls;
      } else {
        // If keepExistingImages is true, append new images to existing ones
        product.imageUrl.images = [...product.imageUrl.images, ...req.fileUrls];
      }
      
      console.log('Updated image URLs:', product.imageUrl.images);
    } else if (req.body.removeImages === "true") {
      // Optional: Clear all images if requested
      console.log('Clearing all images');
      product.imageUrl.images = [];
    }

    await product.save();
    console.log('Product updated successfully:', product._id);

    res.status(200).json({ 
      success: true,
      message: "Product updated successfully!", 
      data: {
        product: product
      }
    });
  } catch (err) {
    console.error('Error in postEditProduct:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired" 
      });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }
    
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the product.",
      error: err.message,
    });
  }
};


exports.toggleProductVisibility = async (req, res) => {
  try {
    const { productId } = req.params;
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access. No token provided." });
    }

    // Verify token and get user ID
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;

    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Check if user owns the product or is admin (you might want to add admin check)
    if (!product.isOwner(userId)) {
      return res.status(403).json({ message: "Not authorized to modify this product." });
    }

    // Toggle the isVisible status
    product.isVisible = !product.isVisible;
    
    // Save the updated product
    await product.save();

    return res.status(200).json({
      message: `Product visibility ${product.isVisible ? 'enabled' : 'disabled'} successfully.`,
      product: {
        id: product._id,
        title: product.title,
        isVisible: product.isVisible
      }
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token." });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired." });
    }
    
    return res.status(500).json({ 
      message: "An error occurred while updating product visibility." 
    });
  }
};



exports.toggleProductAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access. No token provided." });
    }

    // Verify token and get user ID
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;

    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Check if user owns the product or is admin
    if (!product.isOwner(userId)) {
      return res.status(403).json({ message: "Not authorized to modify this product." });
    }

    // Toggle the isAvailable status
    product.isAvailable = !product.isAvailable;
    
    // Save the updated product
    await product.save();

    return res.status(200).json({
      message: `Product availability ${product.isAvailable ? 'enabled' : 'disabled'} successfully.`,
      product: {
        id: product._id,
        title: product.title,
        isAvailable: product.isAvailable
      }
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token." });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired." });
    }
    
    return res.status(500).json({ 
      message: "An error occurred while updating product availability." 
    });
  }
};



// Delete a product
exports.postDeleteProduct = async (req, res) => {
  const prodId = req.params.productId || req.body.productId;

  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Authentication required" 
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    const userId = decodedToken.userId;

    const result = await Product.deleteOne({ _id: prodId, userId: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you do not have permission to delete this product.",
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Product deleted successfully." 
    });
  } catch (err) {
    console.error(err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
    
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the product.",
      error: err.message,
    });
  }
};

// Get a single product
exports.getProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found."
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        product: product
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the product.",
      error: err.message,
    });
  }
};