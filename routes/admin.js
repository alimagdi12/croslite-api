const express = require("express");
const { body } = require("express-validator/check");
const upload = require("../middleware/multer");
const adminController = require("../controllers/admin");
const isAdmin = require("../middleware/is-admin");

const router = express.Router();

// Get all products for the authenticated admin
router.get("/products", isAdmin, adminController.getDashboard);

// Get a single product
router.get("/products/:productId", isAdmin, adminController.getProduct);

// Add a new product
router.post(
  "/products",
  isAdmin,
  (req, res, next) => {
    console.log('Starting file upload process...');
    next();
  },
  upload.uploadImage, // This should now work properly
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Title must be at least 3 characters long"),
    body("arabicTitle")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Arabic title must be at least 3 characters long"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a valid number"),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage("Description must be between 5 and 400 characters"),
    body("details")
      .isLength({ min: 5 })
      .trim()
      .withMessage("Details must be at least 5 characters long"),
    body("firstColor")
    .custom(value => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('First color is required');
      }
      return true;
    }),
    body("secondColor")
    .custom(value => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Second color is required');
      }
      return true;
    })
  ],
  adminController.postAddProduct
);

// Update a product
router.put(
  "/products/:productId",
  isAdmin,
  (req, res, next) => {
    console.log('Starting product update process...');
    next();
  },
  upload.uploadImage, // Use the same reliable upload middleware
  [
    body("title")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Title must be at least 3 characters long"),
    body("arabicTitle")
      .isString()
      .isLength({ min: 3 })
      .trim()
      .withMessage("Arabic title must be at least 3 characters long"),
    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a valid number"),
    body("description")
      .isLength({ min: 5, max: 400 })
      .trim()
      .withMessage("Description must be between 5 and 400 characters"),
    body("details")
      .isLength({ min: 5 })
      .trim()
      .withMessage("Details must be at least 5 characters long"),
    body("firstColor")
    .custom(value => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('First color is required');
      }
      return true;
    }),
    body("secondColor")
      .custom(value => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          throw new Error('Second color is required');
        }
        return true;
      })
  ],
  adminController.postEditProduct
);

// routes/admin.js or routes/products.js (wherever your product routes are)
router.patch('/products/:productId/visibility',isAdmin, adminController.toggleProductVisibility);

// For example, in routes/admin.js or routes/products.js
router.patch('/products/:productId/availability',isAdmin, adminController.toggleProductAvailability);
  
// Delete a product
router.delete("/products/:productId", isAdmin, adminController.postDeleteProduct);

// Upload endpoint (if still needed separately)
router.post("/upload", isAdmin, upload.uploadImage);

module.exports = router;