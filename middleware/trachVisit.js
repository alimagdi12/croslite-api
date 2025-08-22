const CountryVisit = require("../models/countryVisit");
const GovernorateVisit = require("../models/governorateVisit");
const axios = require("axios");

// Function to get public IP using ipify.org
const getPublicIP = async () => {
  try {
    const response = await axios.get('https://api.ipify.org/?format=json');
    console.log("Public IP from ipify:", response.data.ip);
    return response.data.ip;
  } catch (error) {
    console.error("Error getting public IP from ipify:", error.message);
    return null;
  }
};

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
      region: response.data.region || 'Unknown',  // governorate
      city: response.data.city || 'Unknown'
    };
  } catch (error) {
    console.error("Error getting location from IP:", error.message);
    // Return a default location if API fails
    return {
      country: 'Unknown',
      countryCode: 'Unknown',
      region: 'Unknown',
      city: 'Unknown'
    };
  }
};

// Middleware to track EVERY visit (not just first time)
const trackVisit = async (req, res, next) => {
  try {
    console.log("TrackVisit middleware triggered for path:", req.path);

    // Get public IP
    let publicIp = await getPublicIP();
    
    // If we couldn't get public IP, use a fallback IP for testing
    if (!publicIp) {
      console.log("Could not get public IP, using fallback IP");
      publicIp = '156.208.152.34'; // Example Egyptian IP
    }

    console.log("Using IP for location detection:", publicIp);

    // Get location information from the IP
    const location = await getLocationFromIP(publicIp);
    console.log("Detected location:", location);
    
    // Always update visit counts, regardless of cookie
    await updateVisitCounts(location);

    console.log("Visit tracking completed successfully");
    next();
  } catch (error) {
    console.error("Error in trackVisit middleware:", error.message);
    // Don't block the request if tracking fails
    next();
  }
};

// Helper function to update visit counts
async function updateVisitCounts(location) {
  try {
    // Update country visits (always increment, even if user visited before)
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

module.exports = trackVisit;