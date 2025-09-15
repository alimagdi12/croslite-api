const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }

  try {
    // Verify token
    const decodedToken = jwt.verify(token, "your_secret_key");
    const userEmail = decodedToken.email;

    // Look for the email in the database
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res.status(403).json({ message: "Forbidden: Email not found." });
    }

    // Optionally attach user info to request for later use
    req.user = user;

    next(); // Continue to next middleware
  } catch (err) {
    console.error(err);
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token." });
  }
};
