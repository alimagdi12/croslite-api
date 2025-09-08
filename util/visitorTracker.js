let activeVisitors = new Map();
let totalLiveVisitors = 0;
let cleanupInterval = null;

const initializeVisitorTracker = () => {
  cleanupInterval = setInterval(cleanupInactiveVisitors, 60000);
  console.log('Visitor tracker initialized');
};

const addVisitor = (socketId, visitorData) => {
  activeVisitors.set(socketId, {
    ...visitorData,
    connectedAt: new Date(),
    lastActivity: new Date()
  });
  
  totalLiveVisitors = activeVisitors.size;
  return getVisitorsData();
};

const updateActivity = (socketId, activityData = {}) => {
  const visitor = activeVisitors.get(socketId);
  if (visitor) {
    visitor.lastActivity = new Date();
    
    // Update page if provided
    if (activityData.page) {
      visitor.page = activityData.page;
    }
    
    activeVisitors.set(socketId, visitor);
    return true;
  }
  return false;
};

const removeVisitor = (socketId) => {
  activeVisitors.delete(socketId);
  totalLiveVisitors = activeVisitors.size;
  return getVisitorsData();
};

const cleanupInactiveVisitors = () => {
  const now = new Date();
  let removed = 0;
  
  activeVisitors.forEach((visitor, socketId) => {
    if (now - visitor.lastActivity > 5 * 60 * 1000) {
      activeVisitors.delete(socketId);
      removed++;
    }
  });
  
  if (removed > 0) {
    totalLiveVisitors = activeVisitors.size;
    console.log(`Cleaned up ${removed} inactive visitors`);
  }
  
  return getVisitorsData();
};

const getVisitorsData = () => {
  return {
    count: totalLiveVisitors,
    visitors: Array.from(activeVisitors.values())
  };
};

const getVisitorCount = () => {
  return totalLiveVisitors;
};

const destroyVisitorTracker = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  activeVisitors.clear();
  console.log('Visitor tracker destroyed');
};

module.exports = {
  initializeVisitorTracker,
  addVisitor,
  updateActivity,
  removeVisitor,
  getVisitorsData,
  getVisitorCount,
  destroyVisitorTracker
};