const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chat-app')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("DB Error", err));

app.use('/auth', authRoutes);

// Add /users and /groups endpoints if needed
app.get('/users', async (req, res) => {
  const User = require('./models/User');
  const users = await User.find().select('username -_id');
  res.json(users.map(u => u.username));
});

app.get('/groups', (req, res) => {
  res.json(['Group A', 'Group B', 'Space Crew']); // Replace with DB if needed
});

// WebSocket logic
io.on('connection', (socket) => {
  socket.on('private_message', (data) => {
    io.emit('receive_message', data);
  });

  socket.on('group_message', (data) => {
    io.emit('receive_message', { ...data, type: 'group' });
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
