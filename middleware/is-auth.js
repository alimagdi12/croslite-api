const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const token = req.headers.token;

  if (!token) {
    return res.redirect("/login");
  }

  try {
    const decodedToken = await jwt.verify(token, "your_secret_key");

    if (decodedToken.email !== "alimagdi12367@gmail.com") {
      return res.redirect("/login");
    }

    next();
  } catch (err) {
    return res.redirect("/login");
  }
};
