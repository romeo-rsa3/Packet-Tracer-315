from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

users = {"admin": "admin123", "guest": "guest"}
groups = {}

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if username in users and users[username] == password:
        return jsonify({"status": "success"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@socketio.on('login')
def handle_login(data):
    emit('receive_message', {'from': 'System', 'message': f"{data['username']} has joined the chat."}, broadcast=True)

@socketio.on('private_message')
def handle_private(data):
    emit('receive_message', data, broadcast=True)

@socketio.on('join_group')
def join_group(data):
    group = data['group']
    sid = request.sid
    if group not in groups:
        groups[group] = []
    if sid not in groups[group]:
        groups[group].append(sid)
    print(f"{data['from']} joined group {group}")

@socketio.on('group_message')
def group_message(data):
    group = data['group']
    if group in groups:
        for sid in groups[group]:
            emit('receive_message', data, to=sid)

@socketio.on('typing')
def handle_typing(data):
    emit('typing', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
