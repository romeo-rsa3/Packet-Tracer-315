const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Predefined users
const users = [
  { username: "alice", password: "pass1" },
  { username: "bob", password: "pass2" },
  { username: "carol", password: "pass3" },
  { username: "dave", password: "pass4" },
  { username: "eve", password: "pass5" },
  { username: "frank", password: "pass6" },
  { username: "grace", password: "pass7" },
  { username: "heidi", password: "pass8" },
  { username: "ivan", password: "pass9" },
  { username: "judy", password: "pass10" },
  { username: "mallory", password: "pass11" },
  { username: "oscar", password: "pass12" },
  { username: "peggy", password: "pass13" },
  { username: "trent", password: "pass14" },
  { username: "victor", password: "pass15" }
];

let groups = {
  Developers: [],
  Designers: [],
  Managers: [],
  Testers: [],
  Interns: []
};

// ===== LOGIN ENDPOINT =====
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const match = users.find(u => u.username === username && u.password === password);
  if (match) {
    res.status(200).json({ success: true, users, groups: Object.keys(groups) });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// ===== SOCKET.IO LOGIC =====
io.on('connection', socket => {
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

// ===== OPTIONAL HOME ROUTE =====
app.get('/', (req, res) => {
  res.send('Orbit Messenger Server is live 🚀');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
