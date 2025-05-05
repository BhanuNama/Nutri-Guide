const { body, validationResult } = require('express-validator');
const { auth } = require('./auth');

// Middleware for logging requests
const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

// Middleware for handling errors
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

// Validation middleware for user registration
const validateUserRegistration = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validation middleware for user registration with complete profile
const validateCompleteProfile = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('age').isInt({ min: 1 }).withMessage('Age must be a positive number'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('height').isFloat({ min: 1 }).withMessage('Height must be a positive number'),
    body('weight').isFloat({ min: 1 }).withMessage('Weight must be a positive number'),
    body('bmi').isFloat({ min: 1 }).withMessage('BMI must be a positive number'),
    body('dietType').isIn(['veg', 'non-veg', 'vegan']).withMessage('Invalid diet type'),
    body('fitnessGoal').isIn(['weight-loss', 'weight-gain', 'muscle-building']).withMessage('Invalid fitness goal'),
    body('mealsPerDay').isInt({ min: 2, max: 6 }).withMessage('Meals per day must be between 2 and 6'),
    body('planDuration').isInt({ min: 3, max: 60 }).withMessage('Plan duration must be between 3 and 60 days'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Validation middleware for user login
const validateUserLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 1 }).withMessage('Password is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

// Exporting middleware functions
module.exports = {
    logger,
    errorHandler,
    validateUserRegistration,
    validateCompleteProfile,
    validateUserLogin,
    auth
};