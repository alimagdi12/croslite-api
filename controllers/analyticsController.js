const CountryVisit = require("../models/countryVisit");
const GovernorateVisit = require("../models/governorateVisit");

exports.getVisitStatistics = async (req, res) => {
  try {
    // Get country visits (sorted by visits descending)
    const countryVisits = await CountryVisit.find()
      .sort({ visits: -1 })
      .select('country visits lastVisit');

    // Get governorate visits for Egypt (sorted by visits descending)
    const governorateVisits = await GovernorateVisit.find()
      .sort({ visits: -1 })
      .select('governorate visits lastVisit');

    // Calculate total visits
    const totalVisits = countryVisits.reduce((sum, country) => sum + country.visits, 0);
    const totalEgyptVisits = governorateVisits.reduce((sum, gov) => sum + gov.visits, 0);

    res.status(200).json({
      message: "Visit statistics retrieved successfully",
      statistics: {
        totalVisits,
        totalEgyptVisits,
        countries: countryVisits,
        governorates: governorateVisits,
        topCountries: countryVisits.slice(0, 10), // Top 10 countries
        topGovernorates: governorateVisits.slice(0, 10) // Top 10 governorates
      }
    });
  } catch (error) {
    console.error("Error getting visit statistics:", error);
    res.status(500).json({ 
      message: "An error occurred while retrieving visit statistics." 
    });
  }
};

exports.getVisitStatsSummary = async (req, res) => {
  try {
    const countryCount = await CountryVisit.countDocuments();
    const governorateCount = await GovernorateVisit.countDocuments();
    
    const totalVisits = await CountryVisit.aggregate([
      { $group: { _id: null, total: { $sum: "$visits" } } }
    ]);

    const totalEgyptVisits = await GovernorateVisit.aggregate([
      { $group: { _id: null, total: { $sum: "$visits" } } }
    ]);

    res.status(200).json({
      message: "Visit statistics summary retrieved successfully",
      summary: {
        totalCountries: countryCount,
        totalGovernorates: governorateCount,
        totalVisits: totalVisits[0]?.total || 0,
        totalEgyptVisits: totalEgyptVisits[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Error getting visit statistics summary:", error);
    res.status(500).json({ 
      message: "An error occurred while retrieving visit statistics summary." 
    });
  }
};


// Track product click
exports.trackProductClick = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      {
        $inc: { clicks: 1 },
        $set: { lastClicked: new Date() }
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product click tracked'
    });
  } catch (error) {
    console.error('Error tracking product click:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking product click'
    });
  }
};

// Get product click statistics
exports.getProductClickStats = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ clicks: -1 })
      .select('title clicks lastClicked imageUrl');
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting product click stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting product click statistics'
    });
  }
};