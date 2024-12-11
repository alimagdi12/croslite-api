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
    user: "croslitecs2024@gmail.com",
    pass: "pkbvygukwibuoneo",
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
    const product = await Product.findById(req.params.productId);

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
    return res
      .status(401)
      .json({ message: "Unauthorized access. No token provided." });
  }

  try {
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userId = decodedToken.userId;

    const user = await User.findById(userId).populate("cart.items.productId");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const cartItems = user.cart.items.map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
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

    const products = user.cart.items.map((i) => ({
      quantity: i.quantity,
      product: { ...i.productId._doc },
    }));

    const totalPrice = products.reduce(
      (acc, product) => acc + product.quantity * product.product.price,
      0
    );

    // Send email with product details
    await transporter.sendMail({
      to: [decodedToken.email, "croslitecs2024@gmail.com"],
      from: "croslitecs2024@gmail.com",
      subject: "Order Details",
      html: `
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Details</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #f7f7f7;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 20px;
              background-color: #ffffff;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 1px solid #eeeeee;
            }
            .header h1 {
              color: #333333;
            }
            .content {
              font-size: 16px;
              color: #333333;
              padding: 20px 0;
            }
            .content ul {
              list-style-type: none;
              padding: 0;
            }
            .content li {
              background-color: #fafafa;
              margin: 10px 0;
              padding: 10px;
              border-radius: 4px;
              border: 1px solid #dddddd;
            }
            .content .total {
              font-weight: bold;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              font-size: 12px;
              color: #aaaaaa;
              border-top: 1px solid #eeeeee;
            }
            .footer p {
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Details</h1>
            </div>
            <div class="content">
              <p>Thank you for your purchase! Here are your order details:</p>
              <ul id="order-list">
                ${products
                  .map(
                    (product) =>
                      `<li>${product.product.title} - ${
                        product.quantity
                      } x $${decodedToken.email}</li>`
                  )
                  .join("")}
              </ul>
              <p class="total" id="total-price">Total Price: $${totalPrice.toFixed(
                2
              )}</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Your Company. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
      `,
    });

    await user.clearCart();
    res.status(200).json({ message: "Order placed successfully!" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "An error occurred while placing the order." });
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
