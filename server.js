const WebSocket = require("ws")
const http = require("http")
const fs = require("fs")
const path = require("path")

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
  // Simple static file server
  let filePath = "." + req.url
  if (filePath === "./") {
    filePath = "./index.html"
  }

  const extname = String(path.extname(filePath)).toLowerCase()
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".woff": "application/font-woff",
    ".ttf": "application/font-ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".otf": "application/font-otf",
    ".wasm": "application/wasm",
  }

  const contentType = mimeTypes[extname] || "application/octet-stream"

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" })
        res.end("<h1>404 Not Found</h1>", "utf-8")
      } else {
        res.writeHead(500)
        res.end(`Server Error: ${error.code}`, "utf-8")
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType })
      res.end(content, "utf-8")
    }
  })
})

// Create WebSocket server
const wss = new WebSocket.Server({ server })


// SQLite database
const db = require("./lib/db")

// Store in-memory connections only
const userConnections = new Map()

// Helper: get or create room in DB
function getOrCreateRoom(roomId, name = null) {
  let room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId)
  if (!room) {
    db.prepare("INSERT INTO rooms (id, name) VALUES (?, ?)").run(roomId, name || roomId)
    room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId)
  }
  return room
}

// Helper: get user from DB
function getUser(userId) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId)
}

// Helper: create or update user in DB
function upsertUser(user) {
  db.prepare(`INSERT INTO users (id, username, displayName, color) VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET username=excluded.username, displayName=excluded.displayName, color=excluded.color`).run(
    user.id, user.username, user.displayName, user.color
  )
}

// Helper: save message in DB
function saveMessage(msg) {
  db.prepare("INSERT INTO messages (id, roomId, userId, content, timestamp) VALUES (?, ?, ?, ?, ?)").run(
    msg.id, msg.roomId, msg.userId, msg.content, msg.timestamp
  )
}

// Helper: get messages for a room
function getMessages(roomId, limit = 50) {
  return db.prepare("SELECT * FROM messages WHERE roomId = ? ORDER BY timestamp DESC LIMIT ?").all(roomId, limit).reverse()
}

// Get local IP address
function getLocalIP() {
  const { networkInterfaces } = require("os")
  const nets = networkInterfaces()

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address
      }
    }
  }
  return "localhost"
}

wss.on("connection", (ws, req) => {
  console.log("New client connected from:", req.socket.remoteAddress)

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message)

      switch (data.type) {
        case "join_room":
          handleJoinRoom(ws, data)
          break
        case "leave_room":
          handleLeaveRoom(ws, data)
          break
        case "send_message":
          handleSendMessage(ws, data)
          break
        case "update_presence":
          handleUpdatePresence(ws, data)
          break
        case "get_room_data":
          handleGetRoomData(ws, data)
          break
      }
    } catch (error) {
      console.error("Error parsing message:", error)
    }
  })

  ws.on("close", () => {
    console.log("Client disconnected")
  // Clean up user presence (in-memory only)
  userConnections.delete(ws.connectionId)
  })

  // Assign connection ID
  ws.connectionId = Math.random().toString(36).substring(7)
})

function handleJoinRoom(ws, data) {
  const { roomId, user } = data

  // Ensure room and user exist in DB
  getOrCreateRoom(roomId)
  upsertUser(user)

  // Store user connection (in-memory only)
  userConnections.set(ws.connectionId, { ws, roomId, userId: user.id })

  // Send room data to user (fetch messages from DB)
  const messages = getMessages(roomId)
  ws.send(
    JSON.stringify({
      type: "room_joined",
      room: { id: roomId, messages },
    })
  )

  // Broadcast user joined to others (in-memory presence only)
  broadcastToRoom(
    roomId,
    {
      type: "user_joined",
      user: { ...user, connectionId: ws.connectionId, lastSeen: new Date().toISOString(), isOnline: true },
    },
    ws.connectionId,
  )

  console.log(`User ${user.displayName || user.username || user.id} joined room ${roomId}`)
}

function handleLeaveRoom(ws, data) {
  const userConnection = userConnections.get(ws.connectionId)
  if (!userConnection) return

  const { roomId, userId } = userConnection
  // Only update in-memory presence, not DB
  broadcastToRoom(roomId, {
    type: "user_left",
    userId: userId,
  })
  userConnections.delete(ws.connectionId)
  console.log(`User left room ${roomId}`)
}

function handleSendMessage(ws, data) {
  const { roomId, message } = data

  // Save message to DB
  saveMessage(message)

  // Broadcast message to all users in room
  broadcastToRoom(roomId, {
    type: "new_message",
    message,
  })

  console.log(`Message sent in room ${roomId}: ${message.content}`)
}

function handleUpdatePresence(ws, data) {
  // Presence logic can be implemented here if needed
  // Currently a placeholder
}

function handleGetRoomData(ws, data) {
  const { roomId } = data
  // Fetch messages from DB
  const messages = getMessages(roomId)
  ws.send(
    JSON.stringify({
      type: "room_data",
      room: { id: roomId, messages },
    })
  )
}

function broadcastToRoom(roomId, message, excludeConnectionId = null) {
  // Broadcast to all connected users in the room (in-memory presence only)
  for (const [connectionId, connection] of userConnections.entries()) {
    if (connection.roomId === roomId && connectionId !== excludeConnectionId && connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message))
    }
  }
}

const PORT = process.env.PORT || 3001
const LOCAL_IP = getLocalIP()

server.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Chat Server Started!")
  console.log("")
  console.log("📱 Access from this computer:")
  console.log(`   http://localhost:${PORT}`)
  console.log("")
  console.log("🌍 Access from other devices on your network:")
  console.log(`   http://${LOCAL_IP}:${PORT}`)
  console.log("")
  console.log("💡 Share the network URL with friends to chat!")
  console.log("")
  console.log("Press Ctrl+C to stop the server")
})
