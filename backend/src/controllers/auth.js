const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d' // Token expires in 7 days
    });
};

// User signup controller
exports.signup = async (req, res) => {
    try {
        // Check if email already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Create new user with basic info
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            profileCompleted: false
        });
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Return user info (excluding password) and token
        const userObject = user.toObject();
        delete userObject.password;

        res.status(201).json({
            message: 'User created successfully',
            user: userObject,
            token,
            profileCompleted: false
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// User login controller
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        // Return user info (excluding password) and token
        const userObject = user.toObject();
        delete userObject.password;

        res.status(200).json({
            message: 'Login successful',
            user: userObject,
            token,
            profileCompleted: user.profileCompleted
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// Get current user profile
exports.getUserProfile = async (req, res) => {
    try {
        // req.user is set by the auth middleware
        const user = req.user;
        
        const userObject = user.toObject();
        delete userObject.password;
        
        res.status(200).json({ user: userObject });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Error retrieving user profile', error: error.message });
    }
}; 