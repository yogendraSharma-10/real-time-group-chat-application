import { io } from 'socket.io-client';

/**
 * @file client/src/services/socket.js
 * @description Manages the WebSocket connection and communication with the server.
 * This service provides a singleton Socket.IO client instance and helper functions
 * for connecting, disconnecting, emitting, and listening to events.
 */

// Retrieve the server URL from environment variables.
// Ensure REACT_APP_SERVER_URL is defined in your .env file (e.g., REACT_APP_SERVER_URL=http://localhost:5000)
const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

// Initialize the Socket.IO client instance.
// We set autoConnect to false to manually control when the connection is established,
// typically after a user is authenticated.
let socket;

/**
 * Establishes a WebSocket connection to the server.
 * If a connection already exists, it will disconnect and reconnect.
 *
 * @param {string} token - The authentication token (e.g., JWT) to send with the connection.
 */
export const connectSocket = (token) => {
  if (socket && socket.connected) {
    console.warn('Socket already connected. Disconnecting and reconnecting...');
    socket.disconnect();
  }

  // Initialize the socket with the server URL and authentication token.
  // The `auth` object is sent with the initial connection handshake.
  socket = io(SERVER_URL, {
    autoConnect: false, // Ensure manual connection
    transports: ['websocket'], // Prefer WebSocket transport
    auth: {
      token: token,
    },
  });

  // Attach event listeners for connection status
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    // You might want to show a notification to the user here
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    // Handle specific connection errors, e.g., invalid token
    if (error.message === 'Authentication error') {
      console.error('Authentication failed. Please log in again.');
      // Optionally, dispatch an action to log out the user or redirect to login
    }
  });

  // Manually connect the socket
  socket.connect();
};

/**
 * Disconnects the WebSocket connection from the server.
 */
export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    console.log('Socket manually disconnected.');
  } else {
    console.log('No active socket connection to disconnect.');
  }
};

/**
 * Emits an event to the server.
 *
 * @param {string} eventName - The name of the event to emit.
 * @param {any} data - The data to send with the event.
 * @returns {boolean} - True if the event was emitted, false if socket is not connected.
 */
export const emitEvent = (eventName, data) => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
    // console.log(`Emitted event: ${eventName}`, data);
    return true;
  } else {
    console.warn(`Cannot emit event "${eventName}". Socket not connected.`);
    return false;
  }
};

/**
 * Registers a listener for a specific event from the server.
 *
 * @param {string} eventName - The name of the event to listen for.
 * @param {function} callback - The callback function to execute when the event is received.
 * @returns {function|null} - A function to unsubscribe the listener, or null if socket is not initialized.
 */
export const onEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
    // console.log(`Listening for event: ${eventName}`);
    // Return a cleanup function to remove the listener
    return () => {
      socket.off(eventName, callback);
      // console.log(`Stopped listening for event: ${eventName}`);
    };
  } else {
    console.warn(`Cannot listen for event "${eventName}". Socket not initialized.`);
    return null;
  }
};

/**
 * Removes a listener for a specific event.
 *
 * @param {string} eventName - The name of the event.
 * @param {function} callback - The callback function that was registered.
 */
export const offEvent = (eventName, callback) => {
  if (socket) {
    socket.off(eventName, callback);
    // console.log(`Removed listener for event: ${eventName}`);
  } else {
    console.warn(`Cannot remove listener for event "${eventName}". Socket not initialized.`);
  }
};

/**
 * Returns the current socket instance.
 * Useful for direct access in advanced scenarios, but `emitEvent` and `onEvent`
 * should be preferred for most interactions.
 *
 * @returns {Socket|null} The Socket.IO client instance, or null if not initialized.
 */
export const getSocket = () => socket;

/**
 * Checks if the socket is currently connected.
 * @returns {boolean} True if connected, false otherwise.
 */
export const isSocketConnected = () => socket && socket.connected;

// Example usage (can be removed or commented out in production)
/*
// In your authentication flow:
// connectSocket('your-jwt-token-here');

// In a component that needs to send a message:
// import { emitEvent } from '../services/socket';
// emitEvent('sendMessage', { roomId: 'general', message: 'Hello!' });

// In a component that needs to listen for new messages:
// import { onEvent } from '../services/socket';
// useEffect(() => {
//   const unsubscribe = onEvent('newMessage', (message) => {
//     console.log('New message received:', message);
//     // Update chat state
//   });
//   return () => unsubscribe(); // Clean up on unmount
// }, []);

// When user logs out:
// disconnectSocket();
*/