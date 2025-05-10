const socket = io("http://localhost:5000");

let currentUser = "";

// ===== LOGIN FUNCTION =====
function login() {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    return showMessage("Please enter both username and password.");
  }

  fetch("http://localhost:5000/login", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
      if (status === 200) {
        currentUser = username;
        document.getElementById("login").style.display = "none";
        document.getElementById("chat").style.display = "block";
        document.getElementById("userDisplay").innerText = username;

        socket.emit("login", { username });
        loadUsersAndGroups(body.users, body.groups);
      } else {
        showMessage("Login failed: " + body.message);
        resetLoginForm();
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      showMessage("Error: " + err.message);
      resetLoginForm();
    });
}

// ===== CLEAR LOGIN FORM =====
function resetLoginForm() {
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("username").focus();
}

// ===== LOAD USERS AND GROUPS =====
function loadUsersAndGroups(userList = [], groupList = []) {
  const recipientDropdown = document.getElementById("recipientList");
  recipientDropdown.innerHTML = "";
  userList.forEach(user => {
    if (user.username !== currentUser) {
      const option = document.createElement("option");
      option.value = user.username;
      option.textContent = user.username;
      recipientDropdown.appendChild(option);
    }
  });

  const groupDropdown = document.getElementById("groupList");
  groupDropdown.innerHTML = "";
  groupList.forEach(group => {
    const option = document.createElement("option");
    option.value = group;
    option.textContent = group;
    groupDropdown.appendChild(option);
  });
}

// ===== SEND MESSAGE =====
function sendMessage() {
  const chatType = document.getElementById("chatType").value;
  const message = document.getElementById("msgInput").value.trim();

  if (!message) return;

  if (chatType === "private") {
    const to = document.getElementById("recipientList").value;
    socket.emit("private_message", { from: currentUser, to, message });
  } else {
    const group = document.getElementById("groupList").value;
    socket.emit("group_message", { from: currentUser, group, message });
  }

  document.getElementById("msgInput").value = "";
}

// ===== DISPLAY INCOMING MESSAGE =====
socket.on("receive_message", data => {
  const messagesDiv = document.getElementById("messages");
  const msg = document.createElement("div");
  msg.classList.add("message");

  if (data.type === "group") {
    msg.innerText = `[${data.group}] ${data.from}: ${data.message}`;
  } else {
    msg.innerText = `${data.from}: ${data.message}`;
  }

  messagesDiv.appendChild(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// ===== DISPLAY INFO OR ERROR =====
function showMessage(text) {
  alert(text);
}

// ===== GUEST LOGIN =====
function continueAsGuest() {
  currentUser = "Guest" + Math.floor(Math.random() * 1000);
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("userDisplay").innerText = currentUser;
  loadUsersAndGroups();
}
