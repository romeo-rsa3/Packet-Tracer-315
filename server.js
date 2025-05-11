const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const User = require('./models/Users');
const messageRoutes = require('./messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// 🌐 MongoDB connection
mongoose.connect('mongodb://localhost:27017/orbitchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

let groups = {
  Developers: [],
  Designers: [],
  Managers: [],
  Testers: [],
  Interns: []
};

// ✅ Auth - Registration
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });

    await User.create({ username, password });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Auth - Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  res.json({ success: true });
});

// ✅ Fetch all users (except current)
app.get('/users', async (req, res) => {
  const users = await User.find({}, 'username');
  res.json(users.map(u => u.username));
});

// ✅ Fetch groups
app.get('/groups', (req, res) => {
  res.json(Object.keys(groups));
});

// ✅ Message routes
app.use('/api/messages', messageRoutes);

// ✅ Socket.IO logic
io.on('connection', socket => {
  const onlineUsers = new Set();

socket.on('login', ({ username }) => {
  socket.username = username;
  onlineUsers.add(username);
  io.emit('user_status', { user: username, status: 'online' });
});

socket.on('typing', data => {
  socket.broadcast.emit('typing', data); // show to others
});

socket.on('disconnect', () => {
  if (socket.username) {
    onlineUsers.delete(socket.username);
    io.emit('user_status', { user: socket.username, status: 'offline' });
  }
});

  console.log('User connected:', socket.id);

  socket.on('login', ({ username }) => {
    socket.username = username;
  });

  socket.on('private_message', ({ from, to, message }) => {
    io.emit('receive_message', {
      type: 'private',
      from,
      to,
      message
    });
  });

  socket.on('join_group', ({ group }) => {
    if (!groups[group]) groups[group] = [];
    if (!groups[group].includes(socket.id)) {
      groups[group].push(socket.id);
    }
    console.log(`${socket.username} joined group ${group}`);
  });

  socket.on('group_message', ({ from, group, message }) => {
    if (groups[group]) {
      groups[group].forEach(socketId => {
        io.to(socketId).emit('receive_message', {
          type: 'group',
          from,
          group,
          message
        });
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const group in groups) {
      groups[group] = groups[group].filter(id => id !== socket.id);
    }
  });
});

// ✅ Default route
app.get('/', (req, res) => {
  res.send('Orbit Messenger Server is live 🚀');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const User = require('./models/Users');
const messageRoutes = require('./messages');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// 🌐 MongoDB connection
mongoose.connect('mongodb://localhost:27017/orbitchat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

let groups = {
  Developers: [],
  Designers: [],
  Managers: [],
  Testers: [],
  Interns: []
};

// ✅ Auth - Registration
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });

    await User.create({ username, password });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Auth - Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  res.json({ success: true });
});

// ✅ Fetch all users (except current)
app.get('/users', async (req, res) => {
  const users = await User.find({}, 'username');
  res.json(users.map(u => u.username));
});

// ✅ Fetch groups
app.get('/groups', (req, res) => {
  res.json(Object.keys(groups));
});

// ✅ Message routes
app.use('/api/messages', messageRoutes);

// ✅ Socket.IO logic
io.on('connection', socket => {
  const onlineUsers = new Set();

socket.on('login', ({ username }) => {
  socket.username = username;
  onlineUsers.add(username);
  io.emit('user_status', { user: username, status: 'online' });
});

socket.on('typing', data => {
  socket.broadcast.emit('typing', data); // show to others
});

socket.on('disconnect', () => {
  if (socket.username) {
    onlineUsers.delete(socket.username);
    io.emit('user_status', { user: socket.username, status: 'offline' });
  }
});

  console.log('User connected:', socket.id);

  socket.on('login', ({ username }) => {
    socket.username = username;
  });

  socket.on('private_message', ({ from, to, message }) => {
    io.emit('receive_message', {
      type: 'private',
      from,
      to,
      message
    });
  });

  socket.on('join_group', ({ group }) => {
    if (!groups[group]) groups[group] = [];
    if (!groups[group].includes(socket.id)) {
      groups[group].push(socket.id);
    }
    console.log(`${socket.username} joined group ${group}`);
  });

  socket.on('group_message', ({ from, group, message }) => {
    if (groups[group]) {
      groups[group].forEach(socketId => {
        io.to(socketId).emit('receive_message', {
          type: 'group',
          from,
          group,
          message
        });
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const group in groups) {
      groups[group] = groups[group].filter(id => id !== socket.id);
    }
  });
});

// ✅ Default route
app.get('/', (req, res) => {
  res.send('Orbit Messenger Server is live 🚀');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
