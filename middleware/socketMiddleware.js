const { initializeLiveVisitors, handleConnection } = require('../controllers/liveVisitorsController');

const setupSocketHandlers = (io) => {
  // Initialize live visitors service
  initializeLiveVisitors(io);

  // Setup connection handler
  io.on('connection', (socket) => {
    handleConnection(socket);
  });

  console.log('Socket handlers setup completed');
};

module.exports = { setupSocketHandlers };