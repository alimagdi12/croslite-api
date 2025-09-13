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
const http = require('http');
const cookieParser = require("cookie-parser");

// Import middleware and routes
const { trackVisit, handleTrackVisit } = require("./middleware/trachVisit");
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");

// Import socket configuration
const { configureSocket } = require('./config/socket');
const { setupSocketHandlers } = require('./middleware/socketMiddleware');
const liveVisitorsRoutes = require('./routes/liveVisitors');

const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4200',
    'https://www.croslite.com.eg',
    'https://croslite.com.eg',
    'https://api.croslite.com.eg',
    'https://admin.croslite.com.eg'
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.removeHeader("ETag");
  next();
});

// Use tracking middleware
app.use(trackVisit);

// API endpoint for frontend to send IP
app.post('/api/track-visit', handleTrackVisit);

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

// Add this endpoint to help with IP detection
app.get('/api/client-ip', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             'unknown';
  
  const cleanIp = ip.toString().replace(/^::ffff:/, '');
  
  res.json({ 
    ip: cleanIp,
    headers: req.headers,
    success: true
  });
});

// Live visitors routes
app.use('/api/analytics', liveVisitorsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Analytics API'
  });
});

// Create HTTP server (Socket.io works with HTTP, not directly with Express)
const server = http.createServer(app);

// Configure Socket.io
const io = configureSocket(server);

// Setup socket handlers
setupSocketHandlers(io);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("Database connected");

    if (process.env.NODE_ENV === 'production') {
      const sslOptions = {
        key: fs.readFileSync('/var/cpanel/ssl/apache_tls/api.croslite.com.eg/combined'),
        cert: fs.readFileSync('/var/cpanel/ssl/apache_tls/api.croslite.com.eg/combined'),
        ca: fs.readFileSync('/var/cpanel/ssl/apache_tls/api.croslite.com.eg/combined')
      };

      // Create HTTPS server for production
      const httpsServer = https.createServer(sslOptions, app);
      httpsServer.listen(3001, '0.0.0.0', () => {
        console.log("Production HTTPS server running on port 3001");
      });

      // Also start HTTP server for Socket.io on different port
      server.listen(3002, '0.0.0.0', () => {
        console.log("Socket.io server running on port 3002");
      });

    } else {
      // Use HTTP server for development (Socket.io needs this)
      server.listen(3001, '0.0.0.0', () => {
        console.log("Development server running on port 3001 (HTTP for Socket.io)");
      });
    }
  })
  .catch((err) => {
    console.log("MongoDB connection failed:", err);
  });