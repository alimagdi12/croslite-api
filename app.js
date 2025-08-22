const path = require("path");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const errorController = require("./controllers/error");
const User = require("./models/user");
const port = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const cors = require("cors");
const fs = require('fs');
const https = require('https');
const cookieParser = require("cookie-parser");

// Import middleware and routes
const trackVisit = require("./middleware/trachVisit"); // Renamed from trackFirstVisit
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");

const app = express();

const corsOptions = {
  origin: [
    'https://www.croslite.com.eg:3000',
    'https://www.croslite.com.eg',
    'https://croslite.com.eg',
    'https://api.croslite.com.eg:3000',
    'https://croslite.com.eg:3000',
    'http://localhost:4200',
    "https://admin.croslite.com.eg"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use tracking middleware (tracks EVERY visit)
app.use(trackVisit);

// Routes
app.use("/analytics", analyticsRoutes);
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// Add test routes for debugging
app.get("/test-visit", (req, res) => {
  res.json({ message: "Test visit endpoint", timestamp: new Date() });
});

app.get("/stats", async (req, res) => {
  try {
    const CountryVisit = require("./models/countryVisit");
    const GovernorateVisit = require("./models/governorateVisit");
    
    const countryStats = await CountryVisit.find().sort({ visits: -1 });
    const governorateStats = await GovernorateVisit.find().sort({ visits: -1 });
    
    res.json({
      countries: countryStats,
      governorates: governorateStats,
      totalCountryVisits: countryStats.reduce((sum, country) => sum + country.visits, 0),
      totalGovernorateVisits: governorateStats.reduce((sum, gov) => sum + gov.visits, 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Database connected");

    if (process.env.NODE_ENV === 'production') {
      const sslOptions = {
        key: fs.readFileSync('/var/cpanel/ssl/apache_tls/api.croslite.com.eg/combined'),
        cert: fs.readFileSync('/var/cpanel/ssl/apache_tls/api.croslite.com.eg/combined'),
        ca: fs.readFileSync('/var/cpanel/ssl/apache_tls/api.croslite.com.eg/combined')
      };

      https.createServer(sslOptions, app).listen(3001, '0.0.0.0', () => {
        console.log("Production HTTPS server running on port 3001");
      });

    } else {
      // Run a basic HTTP server locally
      app.listen(port, () => {
        console.log(`Development HTTP server running on port ${port}`);
      });
    }
  })
  .catch((err) => {
    console.log("MongoDB connection failed:", err);
  });