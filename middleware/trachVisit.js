const CountryVisit = require("../models/countryVisit");
const GovernorateVisit = require("../models/governorateVisit");
const axios = require("axios");

// Function to get location from IP using ipapi.co
const getLocationFromIP = async (ip) => {
  try {
    console.log("Getting location for IP:", ip);

    // Use ipapi.co
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    console.log("IP API Response:", response.data);

    return {
      country: response.data.country_name || 'Unknown',
      countryCode: response.data.country_code || 'Unknown',
      region: response.data.region || 'Unknown',
      city: response.data.city || 'Unknown'
    };
  } catch (error) {
    console.error("Error getting location from IP:", error.message);
    return {
      country: 'Unknown',
      countryCode: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }
};

// Middleware to track visit with IP from frontend
const trackVisit = async (req, res, next) => {
  try {
    // Skip if it's the tracking endpoint itself to avoid infinite loops
    if (req.path === '/api/track-visit') {
      return next();
    }

    console.log("TrackVisit middleware triggered for path:", req.path);

    // Check if user already has a visit cookie
    if (req.cookies.hasVisited) {
      console.log("User already visited, skipping tracking");
      return next();
    }

    // Get IP from frontend if available, otherwise try to detect
    let userIP = req.body.ip || 
                 req.headers['x-real-ip'] ||
                 req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress;

    // Handle multiple IPs in x-forwarded-for
    if (userIP && userIP.includes(',')) {
      userIP = userIP.split(',')[0].trim();
    }

    // Clean IP (remove IPv6 prefix if present)
    userIP = userIP.replace(/^::ffff:/, '');

    console.log("Using IP for location detection:", userIP);

    // Get location information from the IP
    const location = await getLocationFromIP(userIP);
    console.log("Detected location:", location);
    
    // Update visit counts
    await updateVisitCounts(location);

    // Set cookie to mark that user has been tracked (expires in 24 hours)
    res.cookie('hasVisited', 'true', { 
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log("Visit tracking completed successfully");
    next();
  } catch (error) {
    console.error("Error in trackVisit middleware:", error.message);
    next();
  }
};

// API endpoint handler for frontend to send IP
const handleTrackVisit = async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    console.log("Tracking visit from frontend for IP:", ip);

    // Get location information from the IP
    const location = await getLocationFromIP(ip);
    console.log("Detected location from frontend IP:", location);
    
    // Update visit counts
    await updateVisitCounts(location);

    // Set cookie
    res.cookie('hasVisited', 'true', { 
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({ 
      success: true, 
      message: 'Visit tracked successfully',
      location: location 
    });
  } catch (error) {
    console.error("Error in handleTrackVisit:", error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to update visit counts
async function updateVisitCounts(location) {
  try {
    // Update country visits
    const updatedCountry = await CountryVisit.findOneAndUpdate(
      { country: location.country },
      { 
        $inc: { visits: 1 },
        $set: { lastVisit: new Date() }
      },
      { upsert: true, new: true }
    );

    console.log(`Updated country visits for: ${location.country}, Total visits: ${updatedCountry.visits}`);

    // If country is Egypt, track governorate
    if (location.country === 'Egypt' && location.region !== 'Unknown') {
      const updatedGovernorate = await GovernorateVisit.findOneAndUpdate(
        { governorate: location.region },
        { 
          $inc: { visits: 1 },
          $set: { lastVisit: new Date() }
        },
        { upsert: true, new: true }
      );
      console.log(`Updated governorate visits for: ${location.region}, Total visits: ${updatedGovernorate.visits}`);
    }
  } catch (error) {
    console.error("Error updating visit counts:", error.message);
  }
}

module.exports = { trackVisit, handleTrackVisit };