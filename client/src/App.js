import React, { useState, useEffect, useCallback } from 'react';
import { socket } from './services/socket';
import ChatRoom from './components/ChatRoom';
import './styles/main.css';

/**
 * Main application component for the Real-time Group Chat.
 * Handles user authentication (login/logout) and conditionally renders
 * either the login form or the ChatRoom component.
 */
function App() {
  // State to store the user's chosen username
  const [username, setUsername] = useState('');
  // State to track if the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // State to display error messages to the user
  const [error, setError] = useState('');
  // State to track the current socket connection status
  const [isConnected, setIsConnected] = useState(socket.connected);

  /**
   * useEffect hook to manage socket connection lifecycle and event listeners.
   * It connects the socket on component mount and sets up listeners for
   * connection status, errors, and server responses to user login attempts.
   */
  useEffect(() => {
    // Ensure the socket is connected when the App component mounts.
    // This is important if autoConnect is false in socket.js.
    if (!socket.connected) {
      socket.connect();
    }

    /**
     * Handler for successful socket connection.
     * Updates connection status and clears any previous errors.
     */
    const onConnect = () => {
      setIsConnected(true);
      setError(''); // Clear any previous connection errors
      console.log('Socket connected:', socket.id);
    };

    /**
     * Handler for socket disconnection.
     * Updates connection status, forces logout, and displays a disconnection error.
     */
    const onDisconnect = () => {
      setIsConnected(false);
      setIsLoggedIn(false); // Force logout on disconnect
      setError('Disconnected from server. Please try again.');
      console.log('Socket disconnected');
    };

    /**
     * Handler for socket connection errors.
     * Updates connection status, forces logout, and displays the error message.
     */
    const onConnectError = (err) => {
      setIsConnected(false);
      setIsLoggedIn(false); // Force logout on connection error
      setError(`Connection Error: ${err.message}`);
      console.error('Socket connection error:', err);
    };

    /**
     * Handler for the 'user:join:response' event from the server.
     * This event is triggered after a client attempts to join the chat.
     * It updates the login status based on the server's response.
     * @param {object} response - The response object from the server, typically { success: boolean, message?: string }.
     */
    const onUserJoinedResponse = (response) => {
      if (response.success) {
        setIsLoggedIn(true);
        setError(''); // Clear any login-related errors
        console.log(`User ${username} successfully joined.`);
      } else {
        // If login failed, display the server's error message
        setError(response.message || 'Failed to join chat. Please try a different username.');
        setIsLoggedIn(false);
        console.error('User join failed:', response.message);
      }
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('user:join:response', onUserJoinedResponse);

    /**
     * Cleanup function for useEffect.
     * Unregisters all event listeners when the component unmounts
     * to prevent memory leaks and unintended behavior.
     