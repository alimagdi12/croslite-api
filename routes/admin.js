const path = require("path");

const express = require("express");
const { body } = require("express-validator/check");
const upload = require("../middleware/multer");
const adminController = require("../controllers/admin");
const isAdmin = require("../middleware/is-admin");

const router = express.Router();


router.post("/add-product", isAdmin, async (req, res, next) => {
  try {
    await upload.uploadImage(req, res);
    await adminController.postAddProduct(req, res, next);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create user", error: err.message });
  }
});
router.post("/edit-product", isAdmin, async (req, res, next) => {
  try {
    await upload.uploadImage(req, res);
    await adminController.postEditProduct(req, res, next);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to create user", error: err.message });
  }
});

// /admin/add-product => GET


// /admin/products => GET
// router.get('/product', isAdmin, adminController.getProducts);

// /admin/add-product => POST
// router.post(
//   '/add-product',
//   [
//     body('title')
//       .isString()
//       .isLength({ min: 3 })
//       .trim(),
//     body('price').isFloat(),
//     body('description')
//       .isLength({ min: 5, max: 400 })
//       .trim()
//   ],
//   isAdmin,
//   adminController.postAddProduct
// );


// router.post(
//   '/edit-product',
//   // [
//   //   body('title')
//   //     .isString()
//   //     .isLength({ min: 3 })
//   //     .trim(),
//   //   body('price').isFloat(),
//   //   body('description')
//   //     .isLength({ min: 5, max: 400 })
//   //     .trim()
//   // ],
//   // isAdmin,
//   adminController.postEditProduct
// );

router.post("/delete-product", isAdmin, adminController.postDeleteProduct);

router.post("/upload", upload.uploadImage);

module.exports = router;
