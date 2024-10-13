const path = require("path");

const express = require("express");

const shopController = require("../controllers/shop");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/products", shopController.getProducts);

router.get("/product/:productId", shopController.getProductDetails);

router.post("/contact", shopController.postContact);

router.post("/footerSearch", shopController.postFooterSearch);

router.get("/cart", isAuth, shopController.getCart);

router.post("/cart", isAuth, shopController.postCart);

router.post("/cart-delete-item", isAuth, shopController.postCartDeleteProduct);

router.post("/create-order", isAuth, shopController.postOrder);

// router.post('/payement', isAuth, shopController.postPayement);

router.get("/get-user", isAuth, shopController.getUserData);

router.post("/update-user", isAuth, shopController.postUpdateUser);

router.post("/cart-add-quantity", isAuth, shopController.postIncreaseCart);

router.post("/cart-decrease-quantity", isAuth, shopController.postDecreaseCart);

router.post("/review", shopController.postReview);

module.exports = router;
