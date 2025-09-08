const {
  initializeVisitorTracker,
  addVisitor,
  updateActivity,
  removeVisitor,
  getVisitorsData
} = require('../util/visitorTracker');

let ioInstance = null;

const initializeLiveVisitorsService = (io) => {
  ioInstance = io;
  initializeVisitorTracker();
  return { io: ioInstance };
};

const handleConnection = (socket) => {
  console.log('User connected:', socket.id);

  // Visitor joined event
  socket.on('visitor-joined', (visitorData) => {
    try {
      const visitorsData = addVisitor(socket.id, visitorData);
      broadcastUpdate(visitorsData);
      console.log('Visitor joined. Total:', visitorsData.count);
    } catch (error) {
      console.error('Error handling visitor join:', error);
    }
  });

  // Visitor activity event
  socket.on('visitor-activity', (activityData = {}) => {
    try {
      updateActivity(socket.id, activityData);
    } catch (error) {
      console.error('Error handling visitor activity:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      console.log('User disconnected:', socket.id);
      const visitorsData = removeVisitor(socket.id);
      broadcastUpdate(visitorsData);
      console.log('Visitor left. Total:', visitorsData.count);
    } catch (error) {
      console.error('Error handling visitor disconnect:', error);
    }
  });

  // Send current state to newly connected dashboard clients
  socket.on('request-initial-state', () => {
    try {
      const visitorsData = getVisitorsData();
      socket.emit('live-visitors-initial', visitorsData);
    } catch (error) {
      console.error('Error sending initial state:', error);
    }
  });
};

const broadcastUpdate = (visitorsData) => {
  if (ioInstance) {
    ioInstance.emit('live-visitors-update', visitorsData);
  }
};

const getLiveVisitors = () => {
  return getVisitorsData();
};

const cleanupLiveVisitorsService = () => {
  destroyVisitorTracker();
  ioInstance = null;
};

module.exports = {
  initializeLiveVisitorsService,
  handleConnection,
  getLiveVisitors,
  cleanupLiveVisitorsService
};