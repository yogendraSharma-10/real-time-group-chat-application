const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsername, createUser, findUserById } = require('./db'); // Assuming db.js exports these functions
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforchat'; // Fallback for development, but should be set in .env
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h'; // Token expires in 1 hour

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} - The hashed password.
 */
const hashPassword = async (password) => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password.
 * @param {string} plainPassword - The plain text password.
 * @param {string} hashedPassword - The hashed password from the database.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
const comparePasswords = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generates a JSON Web Token for a given user.
 * @param {object} user - The user object (must contain at least `id` and `username`).
 * @returns {string} - The generated JWT.
 */
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

/**
 * Middleware to verify a JWT from the request header.
 * Attaches the decoded user payload to `req.user` if valid.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach user payload to request
        next();
    });
};

/**
 * Handles user registration.
 * @param {object} req - Express request object (expects `username`, `password` in body).
 * @param {object} res - Express response object.
 */
const registerUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'Username already taken.' });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await createUser(username, hashedPassword);

        // Generate a token for the newly registered user
        const token = generateToken(newUser);

        res.status(201).json({
            message: 'User registered successfully.',
            user: { id: newUser.id, username: newUser.username },
            token
        });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
};

/**
 * Handles user login.
 * @param {object} req - Express request object (expects `username`, `password` in body).
 * @param {object} res - Express response object.
 */
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful.',
            user: { id: user.id, username: user.username },
            token
        });
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
};

/**
 * Verifies a JWT for WebSocket connections.
 * This function is designed to be called directly, not as Express middleware.
 * @param {string} token - The JWT string.
 * @returns {Promise<object|null>} - Decoded user payload if valid, null otherwise.
 */
const verifyWsToken = (token) => {
    return new Promise((resolve) => {
        if (!token) {
            return resolve(null);
        }
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.error('WebSocket token verification failed:', err.message);
                return resolve(null);
            }
            // Optionally, fetch the user from DB to ensure they still exist and are active
            const user = await findUserById(decoded.id);
            if (!user) {
                console.warn(`User with ID ${decoded.id} not found after token verification.`);
                return resolve(null);
            }
            resolve({ id: user.id, username: user.username });
        });
    });
};


module.exports = {
    registerUser,
    loginUser,
    verifyToken,
    verifyWsToken,
    generateToken, // Export for potential testing or specific use cases
    hashPassword, // Export for potential testing
    comparePasswords // Export for potential testing
};