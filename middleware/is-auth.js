const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const token = req.headers.token; // Extract the token
  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized access. No token provided." });
  }

  try {
    // Verify the token
    const decodedToken = await jwt.verify(token, "your_secret_key");

    // Check if the email matches the expected value
    if (decodedToken.email !== "alimagdi12367@gmail.com" || decodedToken.email !== 'crosliteeg2024@gmail.com') {
      return res.status(403).json({ message: "Forbidden: Access denied." });
    }
    next(); // Proceed to the next middleware
  } catch (err) {
    // Handle token verification errors
    console.log(err);
    return res
      .status(401)
      .json({ message: "Unauthorized access. Invalid token." });
  }
};
