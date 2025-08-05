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

const app = express();

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const corsOptions = {
  origin: [
    'https://www.croslite.com.eg:3000',
    'https://www.croslite.com.eg',
    'https://croslite.com.eg',
    'https://api.croslite.com.eg:3000',
    'https://croslite.com.eg:3000'
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

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
