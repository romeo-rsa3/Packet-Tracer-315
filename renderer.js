const API_URL = "https://orbit-messenger.onrender.com"; // update to your live server
const socket = io(API_URL);

let currentUser = "";

// ===== LOGIN FUNCTION =====
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return showMessage("Please enter both username and password.");

  fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        currentUser = username;
        document.getElementById("login").style.display = "none";
        document.getElementById("chat").style.display = "flex";
        document.getElementById("userDisplay").innerText = username;
        socket.emit("login", { username });
        loadUsersAndGroups();
      } else {
        showMessage("Login failed.");
      }
    })
    .catch(err => showMessage("Error: " + err.message));
}

// ===== REGISTRATION FUNCTION =====
function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) return showMessage("Please enter both username and password.");

  fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showMessage("Registration successful. You can now log in.");
      } else {
        showMessage("Registration failed: " + (data.message || "Username exists."));
      }
    })
    .catch(err => showMessage("Error: " + err.message));
}
function continueAsGuest() {
  currentUser = "guest";
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "flex";
  document.getElementById("userDisplay").innerText = "guest";
  socket.emit("login", { username: "guest" });
  loadUsersAndGroups();
}

// ===== USERS & GROUPS =====
function loadUsersAndGroups() {
  fetch(`${API_URL}/users`)
    .then(res => res.json())
    .then(users => {
      const dropdown = document.getElementById("recipientList");
      dropdown.innerHTML = "";
      users.forEach(user => {
        if (user !== currentUser) {
          const opt = document.createElement("option");
          opt.value = user;
          opt.textContent = user;
          dropdown.appendChild(opt);
        }
      });
      if (dropdown.value) loadChatHistory(dropdown.value);
    });

  fetch(`${API_URL}/groups`)
    .then(res => res.json())
    .then(groups => {
      const dropdown = document.getElementById("groupList");
      dropdown.innerHTML = "";
      groups.forEach(group => {
        const opt = document.createElement("option");
        opt.value = group;
        opt.textContent = group;
        dropdown.appendChild(opt);
      });
    });
}

// ===== CHAT HISTORY =====
function loadChatHistory(user2) {
  fetch(`${API_URL}/api/messages/history?user1=${currentUser}&user2=${user2}`)
    .then(res => res.json())
    .then(messages => {
      const messagesDiv = document.getElementById("messages");
      messagesDiv.innerHTML = "";
      messages.forEach(msg => {
        const div = document.createElement("div");
        div.className = `message ${msg.sender === currentUser ? 'sent' : 'received'}`;
        div.textContent = `${msg.sender}: ${msg.content}`;
        messagesDiv.appendChild(div);
      });
    });
}

// ===== SENDING MESSAGE =====
function sendMessage() {
  const chatType = document.getElementById("chatType").value;
  const message = document.getElementById("msgInput").value.trim();

  if (!message) return;

  if (chatType === "private") {
    const to = document.getElementById("recipientList").value;
    socket.emit("private_message", { from: currentUser, to, message });
    loadChatHistory(to);
  } else {
    const group = document.getElementById("groupList").value;
    socket.emit("group_message", { from: currentUser, group, message });
  }

  document.getElementById("msgInput").value = "";
}

// ===== TYPING INDICATOR =====
document.getElementById("msgInput").addEventListener("input", () => {
  socket.emit("typing", { from: currentUser });
});

socket.on("typing", data => {
  document.getElementById("typingIndicator").innerText = `${data.from} is typing...`;
  clearTimeout(window.typingTimeout);
  window.typingTimeout = setTimeout(() => {
    document.getElementById("typingIndicator").innerText = "";
  }, 2000);
});

// ===== ONLINE STATUS =====
socket.on("user_status", ({ user, status }) => {
  const selected = document.getElementById("recipientList").value;
  if (user === selected) {
    document.getElementById("userStatus").innerText = `${user} is ${status}`;
  }
});

// ===== RECEIVE MESSAGE =====
socket.on("receive_message", data => {
  const messagesDiv = document.getElementById("messages");
  const msg = document.createElement("div");
  msg.className = `message ${data.from === currentUser ? "sent" : "received"}`;
  const initials = data.from[0].toUpperCase();
  msg.innerHTML = `<strong>${initials}</strong> ${data.message}`;
  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

function showMessage(msg) {
  document.getElementById("messageBox").textContent = msg;
}


function continueAsGuest() {
  alert("Guest mode is not yet supported in this build.");
}
