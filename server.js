const WebSocket = require("ws")
const http = require("http")
const fs = require("fs")
const path = require("path")

// Create HTTP server
const server = http.createServer((req, res) => {
  // Send a simple response for any request
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');

})

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

// Set up WebSocket server
const wss = new WebSocket.Server({ server })
const clients = new Set()
const messages = []

wss.on("connection", (ws) => {
  console.log("New client connected")
  clients.add(ws)

  // Send historical messages to new client
  ws.send(JSON.stringify({
    type: 'history',
    messages: messages
  }))

  ws.on("message", (message) => {
    console.log("received:", message.toString())
    try {
      const data = JSON.parse(message)
      messages.push(data)
      
      // Broadcast message to all other clients
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'message',
            data: data
          }))
        }
      })
    } catch (error) {
      console.error("Error processing message:", error)
    }
  })

  ws.on("close", () => {
    console.log("Client disconnected")
    clients.delete(ws)
  })
})

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
})
