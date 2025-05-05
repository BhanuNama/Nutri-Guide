const { User } = require('../models');
const dietPlanController = require('./dietPlan');
const dietTrackerController = require('./dietTracker');

// Controller functions for handling requests and responses

exports.getAllItems = (req, res) => {
    // Logic to retrieve all items
    res.send('Retrieve all items');
};

exports.getItemById = (req, res) => {
    const id = req.params.id;
    // Logic to retrieve an item by ID
    res.send(`Retrieve item with ID: ${id}`);
};

exports.createItem = (req, res) => {
    const newItem = req.body;
    // Logic to create a new item
    res.status(201).send('Item created');
};

exports.updateItem = (req, res) => {
    const id = req.params.id;
    const updatedItem = req.body;
    // Logic to update an item by ID
    res.send(`Item with ID: ${id} updated`);
};

exports.deleteItem = (req, res) => {
    const id = req.params.id;
    // Logic to delete an item by ID
    res.send(`Item with ID: ${id} deleted`);
};

exports.createUser = async (req, res) => {
    try {
        // Log the entire request body for debugging
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        const {
            name,
            age,
            gender,
            height,
            weight,
            bmi,
            dietType,
            fitnessGoal,
            restrictionsAndAllergies,
            mealsPerDay,
            planDuration
        } = req.body;

     
        const user = new User({
            name,
            age,
            gender,
            height,
            weight,
            bmi,
            dietType,
            fitnessGoal,
            restrictionsAndAllergies,
            mealsPerDay,
            planDuration
        });
        
        // Log the user object before saving
        console.log('User object to save:', user);

        await user.save();
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// Get user data for the dashboard
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Security check - users can only access their own data unless they're admin
        // Later we can add admin role checks here
        if (req.userId && req.userId.toString() !== userId && req.params.id !== 'me') {
            return res.status(403).json({ message: 'You are not authorized to access this data' });
        }
        
        // If 'me' is passed as ID, use the authenticated user's ID
        const userIdToFetch = req.params.id === 'me' ? req.userId : userId;
        
        // Find user by ID
        const user = await User.findById(userIdToFetch);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if user has completed their profile
        if (!user.profileCompleted) {
            return res.status(400).json({ 
                message: 'Please complete your profile first',
                profileCompleted: false
            });
        }
        
        // Create a dashboard-specific response with all user information
        const dashboardData = {
            user: {
                name: user.name,
                email: user.email,
                age: user.age,
                gender: user.gender,
            },
            stats: {
                currentWeight: user.weight,
                currentBmi: user.bmi,
                height: user.height,
                dietType: user.dietType,
                fitnessGoal: user.fitnessGoal,
                mealsPerDay: user.mealsPerDay,
                restrictionsAndAllergies: user.restrictionsAndAllergies,
                planDuration: user.planDuration
            },
            // In a real app, you would calculate these values from historical data
            trends: {
                weightChange: -1.5, // Placeholder: 1.5 kg lost
                bmiChange: -0.6,    // Placeholder: 0.6 decrease
                avgDailyCalories: 1403, // Placeholder
            },
            profileCompleted: user.profileCompleted
        };
        
        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
};

// Get all users (useful for demo purposes)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
    try {
        // Get authenticated user's ID (set by auth middleware)
        const userId = req.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        // Prepare update data - calculate BMI from height and weight if provided
        const updateData = { ...req.body, profileCompleted: true };
        
        if (updateData.height && updateData.weight) {
            const heightInMeters = Number(updateData.height) / 100;
            const weightInKg = Number(updateData.weight);
            updateData.bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
        }
        
        // Convert string values to appropriate types
        if (updateData.age) updateData.age = Number(updateData.age);
        if (updateData.height) updateData.height = Number(updateData.height);
        if (updateData.weight) updateData.weight = Number(updateData.weight);
        if (updateData.bmi) updateData.bmi = Number(updateData.bmi);
        if (updateData.mealsPerDay) updateData.mealsPerDay = Number(updateData.mealsPerDay);
        if (updateData.planDuration) updateData.planDuration = Number(updateData.planDuration);
        
        // Handle restrictions and allergies if provided as a string
        if (typeof updateData.restrictionsAndAllergies === 'string') {
            updateData.restrictionsAndAllergies = updateData.restrictionsAndAllergies
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
        }
        
        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Create a sanitized user object without password
        const userResponse = updatedUser.toObject();
        delete userResponse.password;
        
        res.status(200).json({
            message: 'Profile updated successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ 
            message: 'Error updating profile', 
            error: error.message 
        });
    }
};

// Export diet plan controller functions
exports.generateDietPlan = dietPlanController.generateDietPlan;
exports.getLatestDietPlan = dietPlanController.getLatestDietPlan;
exports.getDietPlanDay = dietPlanController.getDietPlanDay;
exports.getAllDietPlans = dietPlanController.getAllDietPlans;
exports.trackMeal = dietPlanController.trackMeal;

// Export diet tracker controller functions
exports.createDietTracker = dietTrackerController.createDietTracker;
exports.updateTrackerForMeal = dietTrackerController.updateTrackerForMeal;
exports.getActiveTracker = dietTrackerController.getActiveTracker;
exports.getTrackerDay = dietTrackerController.getTrackerDay;
exports.getAllTrackers = dietTrackerController.getAllTrackers;
exports.updateTrackerStatus = dietTrackerController.updateTrackerStatus;