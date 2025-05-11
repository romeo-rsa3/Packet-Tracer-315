// server.js

const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const User = require('./models/Users');
const messageRoutes = require('./messages');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// 🌐 MongoDB Connection (choose one: Atlas or local)
mongoose.connect('mongodb+srv://43370314:Romeo@032025@orbitcluster.7hovvqk.mongodb.net/?retryWrites=true&w=majority&appName=OrbitCluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// In-memory group and user tracking
const groups = {
  Developers: [],
  Designers: [],
  Managers: [],
  Testers: [],
  Interns: []
};

const onlineUsers = new Set();

// ✅ Auth - Registration
app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    await User.create({ username, password });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Auth - Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Get all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username');
    res.json(users.map(user => user.username));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ✅ Get all groups
app.get('/groups', (req, res) => {
  res.json(Object.keys(groups));
});

// ✅ Use message routes
app.use('/api/messages', messageRoutes);

// ✅ Default route
app.get('/', (req, res) => {
  res.send('Orbit Messenger Server is live 🚀');
});


// ✅ Socket.IO logic
io.on('connection', socket => {
  console.log('🔌 New connection:', socket.id);

  socket.on('login', ({ username }) => {
    socket.username = username;
    onlineUsers.add(username);
    io.emit('user_status', { user: username, status: 'online' });
  });

  socket.on('typing', data => {
    socket.broadcast.emit('typing', data);
  });

const Message = require('./models/Message'); // Already at top of file

socket.on('private_message', async ({ from, to, message }) => {
  if (!from || !to || !message) return;

  // Emit to recipient (and optionally sender for echo)
  io.emit('receive_message', {
    type: 'private',
    from,
    to,
    message
  });

  // Save to MongoDB
  try {
    const msg = new Message({
      sender: from,
      recipient: to,
      content: message,
      type: 'private'
    });

    await msg.save();
    console.log(`💾 Private message saved: ${from} ➡ ${to}`);
  } catch (err) {
    console.error('❌ Error saving private message:', err);
  }
});


  socket.on('join_group', ({ group }) => {
    if (!groups[group]) {
      groups[group] = [];
    }
    if (!groups[group].includes(socket.id)) {
      groups[group].push(socket.id);
    }
    console.log(`${socket.username} joined group ${group}`);
  });

const Message = require('./models/Message'); // ensure this is imported at the top

socket.on('group_message', async ({ from, group, message }) => {
  if (!from || !group || !message) return;

  // Emit message to group members
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

  // Save to MongoDB
  try {
    const msg = new Message({
      sender: from,
      group: group,
      content: message,
      type: 'group'
    });

    await msg.save();
    console.log(`💾 Group message saved: ${from} ➡ ${group}`);
  } catch (err) {
    console.error('❌ Error saving group message:', err);
  }
});


  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
    if (socket.username) {
      onlineUsers.delete(socket.username);
      io.emit('user_status', { user: socket.username, status: 'offline' });
    }
    for (const group in groups) {
      groups[group] = groups[group].filter(id => id !== socket.id);
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Orbit Messenger server running on port ${PORT}`);
});
