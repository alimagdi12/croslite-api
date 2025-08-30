const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET || "your_secret_key");
    const email = decodedToken.email;
console.log(email);

    if (email !== 'alimagdi12367@gmail.com' && email !== 'crosliteeg2024@gmail.com') {
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: Admin access required" 
      });
    }
    
    next();
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