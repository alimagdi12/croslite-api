const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const Stripe = require("stripe");
const Review = require("../models/reviews");
const user = require("../models/user");
const stripe = Stripe(
  "sk_test_51OmeLSKnxvTYYIlSbsJaeNY5XyiliPJfGg6vA9JQev5T442TXqnEBg2OdZcFZx4Gs5EKVbA7lQ0GO4RyAiM0qbvj005mnOklV9"
);
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "croslite.eg2024@gmail.com",
    pass: "gjzk jlyt rhyb zqzq",
  },
  tls: {
    rejectUnauthorized: false, // This bypasses SSL certificate validation errors
  },
});

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    return res.status(200).json({
      message: "Products retrieved successfully",
      products,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving products." });
  }
};

exports.getProductDetails = async (req, res) => {
  try {

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { $inc: { clicks: 1 } }, 
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    return res.status(200).json({
      message: "Product Details retrieved successfully",
      product,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving product Details." });
  }
};


exports.getPopularProducts = async (req, res) => {
  try {
    // Get all products sorted by clicks (descending order - highest to lowest)
    const popularProducts = await Product.find()
      .select('title price clicks imageUrl createdAt') // Include necessary fields
      .sort({ clicks: -1 }); // Sort from highest to lowest clicks (most visited first)

    // Calculate statistics for dashboard
    const totalClicks = popularProducts.reduce((sum, product) => sum + product.clicks, 0);
    const averageClicks = popularProducts.length > 0 ? totalClicks / popularProducts.length : 0;
    
    // Get the most visited product (first in the array)
    const mostVisited = popularProducts.length > 0 ? popularProducts[0] : null;
    
    // Get the least visited product (last in the array)
    const leastVisited = popularProducts.length > 0 
      ? popularProducts[popularProducts.length - 1] 
      : null;

    return res.status(200).json({
      message: "Popular products retrieved successfully",
      products: popularProducts, // Already sorted from most to least visited
      statistics: {
        totalProducts: popularProducts.length,
        totalClicks: totalClicks,
        averageClicks: parseFloat(averageClicks.toFixed(2)),
        mostVisitedProduct: mostVisited ? {
          title: mostVisited.title,
          clicks: mostVisited.clicks
        } : null,
        leastVisitedProduct: leastVisited ? {
          title: leastVisited.title,
          clicks: leastVisited.clicks
        } : null
      }
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "An error occurred while retrieving popular products." });
  }
};


exports.postContact = async (req, res, next) => {
  const { name, email, message } = req.body;

  try {
    await transporter.sendMail({
      to: "alimagdi12367@gmail.com",
      from: "alimagdi12367@gmail.com",
      subject: "Contact Form Submission",
      html: `
        <p>Contact Details:</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Message:</strong> ${message}</li>
        </ul>
      `,
    });

    res.status(200).json({ message: "Contact message sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      message: "Failed to send message, please try again later.",
      error: error.message,
    });
  }
};

exports.getCart = async (req, res) => {
  const token = req.headers.token;
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized access. No token provided." });
  }
  
  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;
    
    const user = await User.findById(userId).populate({
      path: "cart.items.productId",
      // Only populate products that still exist
      match: { _id: { $ne: null } }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Filter out items with null productId and map the rest
    const cartItems = user.cart.items
      .filter(item => item.productId !== null) // Remove items with deleted products
      .map((item) => ({
        productId: item.productId._id,
        name: item.productId.title, // Changed from 'name' to 'title' to match your schema
        price: item.productId.price,
        imageUrl: item.productId.imageUrl,
        quantity: item.quantity,
      }));

    res.status(200).json({ cartItems });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({
      message: "An error occurred while fetching the cart.",
    });
  }
};

exports.postCart = async (req, res) => {
  const prodId = req.body.productId;
  const token = req.headers.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. No token provided." });
  }

  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;

    const product = await Product.findById(prodId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const user = await User.findById(userId);
    await user.addToCart(product);

    res.status(200).json({ message: "Product added to cart successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while adding the product to the cart.",
    });
  }
};

exports.postCartDeleteProduct = async (req, res) => {
  const prodId = req.body.productId;
  const token = req.headers.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. No token provided." });
  }

  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.removeFromCart(prodId);
    res
      .status(200)
      .json({ message: "Product removed from cart successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "An error occurred while removing the product from the cart.",
    });
  }
};

exports.postOrder = async (req, res) => {
  const token = req.headers.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. No token provided." });
  }

  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;

    const user = await User.findById(userId)
      .populate("cart.items.productId")
      .exec();
      
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Filter out items with null productId (deleted products)
    const validCartItems = user.cart.items.filter(item => item.productId !== null);
    
    // Check if cart is empty after filtering
    if (validCartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty or contains invalid products." });
    }

    const products = validCartItems.map((i) => ({
      quantity: i.quantity,
      product: { ...i.productId._doc },
    }));

    // Generate product details HTML
    const productDetailsHTML = products
      .map(
        (product) => `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 10px;">${product.product.title}</h3>
          <p style="margin: 5px 0;"><strong>Arabic Title:</strong> ${product.product.arabicTitle}</p>
          <p style="margin: 5px 0;"><strong>Quantity:</strong> ${product.quantity}</p>
          <p style="margin: 5px 0;"><strong>Description:</strong> ${product.product.description}</p>
          <p style="margin: 5px 0;"><strong>Details:</strong> ${product.product.details}</p>
          <p style="margin: 5px 0;"><strong>Size Range:</strong> ${product.product.sizeFrom} - ${product.product.sizeTo}</p>
          ${product.product.sizeInLetters ? `<p style="margin: 5px 0;"><strong>Size in Letters:</strong> ${product.product.sizeInLetters}</p>` : ''}
          ${product.product.sizeInCm ? `<p style="margin: 5px 0;"><strong>Size in CM:</strong> ${product.product.sizeInCm} cm</p>` : ''}
          <p style="margin: 5px 0;"><strong>Primary Color:</strong> ${product.product.firstColor}</p>
          <p style="margin: 5px 0;"><strong>Secondary Color:</strong> ${product.product.secondColor}</p>
          ${product.product.imageUrl && product.product.imageUrl.images.length > 0 ? `
          <p style="margin: 5px 0;"><strong>Images:</strong></p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
            ${product.product.imageUrl.images.map(img => 
              `<img src="${img}" alt="${product.product.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">`
            ).join('')}
          </div>
          ` : ''}
        </div>
        `
      )
      .join("");

    // Send email to both user and main email
    await transporter.sendMail({
      to: [decodedToken.email, "croslite.eg2024@gmail.com"], // Send to both user and main email
      from: "croslite.eg2024@gmail.com",
      subject: "New Order Details - Croslite",
      html: `
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Details - Croslite</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #f7f7f7;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 30px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #eeeeee;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2c5aa0;
              margin: 0;
            }
            .customer-info {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              border-left: 4px solid #2c5aa0;
            }
            .customer-info h3 {
              color: #2c5aa0;
              margin-top: 0;
            }
            .product-section {
              margin-bottom: 30px;
            }
            .product-section h3 {
              color: #2c5aa0;
              border-bottom: 2px solid #eeeeee;
              padding-bottom: 10px;
            }
            .product-item {
              margin: 20px 0;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background-color: #fafafa;
            }
            .product-images {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-top: 15px;
            }
            .product-images img {
              width: 100px;
              height: 100px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #eee;
            }
            .footer {
              text-align: center;
              padding-top: 30px;
              font-size: 14px;
              color: #666666;
              border-top: 2px solid #eeeeee;
              margin-top: 30px;
            }
            .footer p {
              margin: 5px 0;
            }
            .info-label {
              font-weight: bold;
              color: #555;
              min-width: 150px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Order Received - Croslite</h1>
            </div>

            <div class="customer-info">
              <h3>👤 Customer Information</h3>
              <p><span class="info-label">Name:</span> ${user.firstName} ${user.lastName}</p>
              <p><span class="info-label">Email:</span> ${user.email}</p>
              <p><span class="info-label">Phone:</span> ${user.phoneNumber}</p>
              <p><span class="info-label">Company:</span> ${user.companyName}</p>
              <p><span class="info-label">Order Date:</span> ${new Date().toLocaleString()}</p>
            </div>

            <div class="product-section">
              <h3>🛍️ Order Items (${products.reduce((total, p) => total + p.quantity, 0)} items)</h3>
              ${productDetailsHTML}
            </div>

            <div class="footer">
              <p><strong>Croslite - Quality Products</strong></p>
              <p>📍 Egypt</p>
              <p>📞 Customer Service: +20 1205712221</p>
              <p>📧 Email: customersupport@croslite.com.eg</p>
              <p style="color: #999; margin-top: 20px;">
                &copy; 2024 Croslite. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
      `,
    });

    await user.clearCart();
    res.status(200).json({ 
      message: "Order placed successfully! Confirmation email sent.",
      productsCount: products.reduce((total, p) => total + p.quantity, 0)
    });
    
  } catch (err) {
    console.error("Order placement error:", err);
    res.status(500).json({ 
      message: "An error occurred while placing the order.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// exports.postPayement=async (req, res) => {
//   const { totalPrice } = req.body;

//   const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: [
//           {
//               price_data: {
//                   currency: 'usd',
//                   product_data: {
//                       name: 'Your Product Name',
//                   },
//                   unit_amount: totalPrice,
//               },
//               quantity: 1,
//           },
//       ],
//       mode:'payment',
//       success_url: `${req.protocol}://${req.get('host')}/ckeckout-success?success=true`,
//       cancel_url: `${req.protocol}://${req.get('host')}/cart?canceled=true`,

//   });

//   res.send({ url: session.url });};

exports.getUserData = async (req, res) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized access. No token provided." });
    }

    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      username: user.username,
      fname: user.firstName,
      lname: user.lastName,
      birthDay: user.birthDay,
      gender: user.gender,
      email: user.email,
      mobile: user.phoneNumber,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user data" });
  }
};

exports.postUpdateUser = async (req, res) => {
  try {
    const { username, fname, lname, birthDay, gender, email, mobile } =
      req.body;

    const updatedUser = await User.findOneAndUpdate(
      { username }, // Filter to find the user
      {
        firstName: fname,
        lastName: lname,
        birthDay: new Date(birthDay),
        gender,
        email,
        phoneNumber: mobile,
      },
      { new: true } // This option returns the modified document rather than the original
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res
      .status(200)
      .json({ message: "User data updated successfully.", updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user data" });
  }
};

exports.postFooterSearch = async (req, res) => {
  const email = req.body.email;

  try {
    await transporter.sendMail({
      to: "alimagdi12367@gmail.com",
      from: "alimagdi12367@gmail.com",
      subject: "Contact Subscribe",
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #333333;
            }
            .content {
              font-size: 16px;
              color: #333333;
            }
            .content ul {
              list-style-type: none;
              padding: 0;
            }
            .content li {
              background-color: #f9f9f9;
              margin: 10px 0;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #dddddd;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              font-size: 12px;
              color: #aaaaaa;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Contact Subscribe</h1>
            </div>
            <div class="content">
              <p>You have a new subscriber:</p>
              <ul>
                <li>${email}</li>
              </ul>
            </div>
            <div class="footer">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
      `,
    });

    res.status(200).json({ message: "Subscription email sent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error sending subscription email." });
  }
};

exports.postIncreaseCart = async (req, res) => {
  const productId = req.body.prodId;
  const token = req.cookies.token;

  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.increaseQuantityInCart(productId);
    return res.status(200).json({ message: "Quantity increased successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.postDecreaseCart = async (req, res) => {
  const productId = req.body.prodId;
  const token = req.cookies.token;

  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.decreaseQuantityInCart(productId);
    return res.status(200).json({ message: "Quantity decreased successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Helper function to perform the search based on the criteria

exports.postReview = (req, res) => {
  try {
    const userName = req.body.userName;
    const email = req.body.userEmail;
    const review = req.body.details;
    const rating = req.body.rating;
    const newReview = new Review({
      name: userName,
      email,
      details: review,
    });
    newReview.save();
    res.redirect(`/products`);
  } catch (err) {
    console.error(err.message);
  }
};
