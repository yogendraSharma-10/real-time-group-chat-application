```javascript
const db = require('./db');
const { verifyToken } = require('./auth'); // Assuming auth.js exports a verifyToken function
const logger = require('./utils/logger'); // Assuming a simple logger utility for logging events

// --- Global State for Connected Users and Presence ---
// Map<socketId, { userId: string, username: string }>
// Stores information about each individual socket connection.
const connectedSockets = new Map();

// Map<userId, Set<socketId>>
// Stores all active socket IDs for a given user ID. This allows a user to be connected
// from multiple devices/tabs and receive messages on all of them.
const userSocketMap = new Map();

/**
 * Helper function to get a list of currently