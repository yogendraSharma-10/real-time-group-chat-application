const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

/**
 * Mongoose Connection Setup
 * Connects to the MongoDB database using the URI from environment variables.
 * Handles connection events for logging and error management.
 */
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables.');
        }

        await mongoose.connect(mongoURI, {
            // Recommended options for Mongoose 6+ (these are default now, but good to be explicit)
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true, // Deprecated in Mongoose 6+
            // useFindAndModify: false, // Deprecated in Mongoose 6+
        });

        console.log('MongoDB connected successfully.');

        // Log connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
            // In a production app, you might want to implement a more robust
            // reconnection strategy here, possibly with exponential backoff.
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected!');
        });

    } catch (err) {
        console.error('MongoDB connection failed:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

/**
 * Mongoose Schemas
 * Define the data models for Users, Rooms, and Messages.
 */

// User Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Room Schema
const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Room name must be at least 3 characters long']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Room creator is required']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Message Schema
const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Message sender is required']
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        // Required if recipient is not present
        validate: {
            validator: function(v) {
                return !this.recipient || v; // If recipient is present, room can be null. If recipient is null, room must be present.
            },
            message: 'Message must belong to a room or have a recipient.'
        }
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Required if room is not present
        validate: {
            validator: function(v) {
                return !this.room || v; // If room is present, recipient can be null. If room is null, recipient must be present.
            },
            message: 'Message must belong to a room or have a recipient.'
        }
    },
    content: {
        type: String,
        required: [true, 'Message content cannot be empty'],
        trim: true,
        maxlength: [1000, 'Message content cannot exceed 1000 characters']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Custom validation to ensure a message has either a room or a recipient, but not both.
MessageSchema.pre('validate', function(next) {
    if ((this.room && this.recipient) || (!this.room && !this.recipient)) {
        next(new Error('A message must have either a room OR a recipient, but not both.'));
    } else {
        next();
    }
});


/**
 * Mongoose Models
 * Compile schemas into models.
 */
const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);
const Message = mongoose.model('Message', MessageSchema);

/**
 * Export Database Connection Function and Models
 */
module.exports = {
    connectDB,
    User,
    Room,
    Message
};