import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../services/socket'; // Assuming socket.js exports the socket instance
import '../styles/main.css'; // Import global styles

/**
 * ChatRoom Component
 *
 * Displays messages for a selected chat room, allows sending new messages,
 * shows online users, and handles typing indicators.
 *
 * @param {object} props - Component props
 * @param {string} props.selectedRoom - The ID of the currently selected chat room.
 * @param {object} props.currentUser - The authenticated user's data (e.g., { id, username }).
 * @param {Array<object>} props.rooms - An array of available