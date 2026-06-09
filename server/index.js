/**
 * @file server/index.js
 * @description Main entry point for the Real-time Group Chat Application server.
 * This file sets up the Express HTTP server, integrates Socket.IO for WebSocket communication,
 * handles CORS, defines API routes (e.g., for authentication), and starts the server.
 */

// Load environment variables from .env file
require('dotenv').config();

// Core Node.js and external module imports
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Internal module imports
const authRoutes = require('./auth'); // Handles user authentication API routes
const socketHandler = require('./socketHandler'); // Manages all Socket.IO events and logic

// --- Server Configuration ---
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000'; // URL of the client application for CORS

// --- Initialize Express Application ---
const app = express();

// --- Middleware Setup ---

// Enable CORS for the client application
// This allows the client (running on a different origin) to make requests to this server.
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true // Allow sending of cookies and authorization headers
}));

// Parse incoming JSON requests
// This middleware makes JSON data sent in the request body available on `req.body`.
app.use(express.json());

// Parse URL-encoded requests (e.g., form submissions)
// `extended: true` allows for rich objects and arrays to be encoded into the URL-encoded format.
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// Basic health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Chat server is running smoothly!' });
});

// Mount authentication routes
// All routes defined in `auth.js` will be prefixed with `/api/auth`.
app.use('/api/auth', authRoutes);

// --- Create HTTP Server ---
// The HTTP server is needed to host both the Express app and the Socket.IO server.
const httpServer = http.createServer(app);

// --- Initialize Socket.IO Server ---
// Attach Socket.IO to the HTTP server.
// Configure CORS specifically for Socket.IO connections.
const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'], // Socket.IO uses GET for handshake, POST for polling fallback
        credentials: true
    },
    // Optional: Configure ping intervals and timeouts for better connection management
    pingInterval: 25000, // How often to send a ping (ms)
    pingTimeout: 60000 // How long to wait for a pong before considering the connection closed (ms)
});

// --- Integrate Socket.IO Handler ---
// Pass the Socket.IO instance to our dedicated handler module.
// This centralizes all WebSocket event listeners and logic.
socketHandler(io);

// --- Start the Server ---
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 CORS enabled for client: ${CLIENT_URL}`);
});

// --- Global Error Handling and Graceful Shutdown ---

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Log the error, but don't exit immediately.
    // In a production environment, you might want to send an alert or restart the process.
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    // Log the error and exit the process.
    // Uncaught exceptions indicate a serious bug that needs immediate attention.
    httpServer.close(() => {
        console.log('HTTP server closed due to uncaught exception.');
        process.exit(1); // Exit with a failure code
    });
});

// Graceful shutdown on SIGTERM signal (e.g., from Docker, Kubernetes)
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed.');
        process.exit(0); // Exit cleanly
    });
});

// Graceful shutdown on SIGINT signal (e.g., Ctrl+C)
process.on('SIGINT', () => {
    console.log('👋 SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed.');
        process.exit(0); // Exit cleanly
    });
});