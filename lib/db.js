// SQLite database setup for chat app
const Database = require('better-sqlite3');
const db = new Database('chatapp.db');

// Create tables if they don't exist
// Users table
// Rooms table
// Messages table

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT,
  displayName TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  roomId TEXT,
  userId TEXT,
  content TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(roomId) REFERENCES rooms(id),
  FOREIGN KEY(userId) REFERENCES users(id)
);
`);

module.exports = db;
