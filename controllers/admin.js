const { validationResult } = require("express-validator/check");
const jwt = require("jsonwebtoken");
const { ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { storage } = require("../firebase.config");

const Product = require("../models/product");

exports.getDashboard = async (req, res, next) => {
  try {
    const token = await req.cookies.token;
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;
    let isAuthenticated = false; // Initialize isAuthenticated outside of the if block
    if (token) {
      isAuthenticated = true;
      const products = await Product.find({ userId: userId });
      console.log(products);
      res.render("dashboard/index.ejs", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
        isAuthenticated: isAuthenticated, // Use the initialized value
      });
    }
  } catch (err) {
    console.log(err);
    res.redirect("/login");
  }
};

exports.postAddProduct = async (req, res) => {
  try {
    const {
      title,
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
    } = req.body;

    const errors = validationResult(req);
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "No token provided" });
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const productName = title.split(" ").join("");
    const folderName = `${productName}-${uuidv4()}`;

    const product = new Product({
      title,
      price,
      description,
      details,
      imageUrl: { images: [] },
      sizeFrom,
      sizeTo,
      sizeInLetters,
      sizeInCm,
      size,
      firstColor,
      secondColor,
      userId,
    });

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const storageRef = ref(
          storage,
          `images/${folderName}/${Date.now()}-${file.originalname}`
        );
        const metadata = { contentType: file.mimetype };

        const snapshot = await uploadBytes(storageRef, file.buffer, metadata);
        const imageUrl = await getDownloadURL(snapshot.ref);
        product.imageUrl.images.push(imageUrl);
      });

      await Promise.all(uploadPromises);
    }

    const savedProduct = await product.save();
    res
      .status(201)
      .json({ msg: "Product added successfully", productId: savedProduct._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred", error: err.message });
  }
};

exports.postEditProduct = async (req, res) => {
  try {
    const token = req.cookies.token; // Retrieve the token from cookies
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided." });
    }

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const email = decodedToken.email;
    const prodId = req.body.productId;

    const {
      title: updatedTitle,
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
    } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: "Validation errors occurred.",
        validationErrors: errors.array(),
      });
    }

    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // if (product.userId.toString() !== email) {
    //   return res.status(403).json({ message: 'Forbidden: You are not authorized to edit this product.' });
    // }

    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    product.details = updatedDetails;
    product.sizeFrom = updatedSizeFrom;
    product.sizeTo = updatedSizeTo;
    product.sizeInLetters = updatedSizeInLetters;
    product.sizeInCm = updatedSizeInCm;
    product.size = updatedSize;
    product.firstColor = firstColor;
    product.secondColor = secondColor;

    await product.save();

    res.status(200).json({ message: "Product updated successfully!", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while updating the product.",
      error: err.message,
    });
  }
};
exports.postDeleteProduct = async (req, res) => {
  const prodId = req.body.productId;

  try {
    const token = req.cookies.token; // Retrieve the token from cookies
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided." });
    }

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    const result = await Product.deleteOne({ _id: prodId, userId: userId });

    // Check if the product was found and deleted
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({
          message:
            "Product not found or you do not have permission to delete this product.",
        });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "An error occurred while deleting the product.",
        error: err.message,
      });
  }
};


