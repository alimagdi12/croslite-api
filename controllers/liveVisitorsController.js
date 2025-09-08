const { getLiveVisitors } = require('../services/liveVisitorsService');

let isServiceInitialized = false;

const initializeLiveVisitors = (io) => {
  if (!isServiceInitialized) {
    require('../services/liveVisitorsService').initializeLiveVisitorsService(io);
    isServiceInitialized = true;
    console.log('Live visitors controller initialized');
  }
  return { success: true };
};

const getLiveVisitorsController = (req, res) => {
  try {
    if (!isServiceInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Live visitors service not initialized'
      });
    }

    const visitorsData = getLiveVisitors();
    
    res.json({
      success: true,
      data: visitorsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting live visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getLiveVisitorsCountController = (req, res) => {
  try {
    if (!isServiceInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Live visitors service not initialized'
      });
    }

    const visitorsData = getLiveVisitors();
    
    res.json({
      success: true,
      data: {
        count: visitorsData.count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting live visitors count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  initializeLiveVisitors,
  getLiveVisitorsController,
  getLiveVisitorsCountController
};