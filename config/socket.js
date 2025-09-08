const socketIo = require('socket.io');

const configureSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:3000', 
        'http://localhost:4200', 
        'https://croslite.com.eg',
        'https://www.croslite.com.eg'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  return io;
};

module.exports = { configureSocket };