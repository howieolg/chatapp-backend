const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));

// MongoDB ulanish
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB ulandi ✅'))
  .catch(err => console.log('MongoDB xatosi:', err));

// Socket.IO
io.on('connection', (socket) => {
  console.log('Foydalanuvchi ulandi:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.roomId).emit('receiveMessage', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('userTyping', data);
  });

  socket.on('disconnect', () => {
    console.log('Foydalanuvchi chiqdi:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlamoqda ✅`);
});