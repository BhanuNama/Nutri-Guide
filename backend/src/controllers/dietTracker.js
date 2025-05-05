const mongoose = require('mongoose');
const { DietTracker, DietPlan } = require('../models');

// Error codes for consistent error handling
const ERROR_CODES = {
  VALIDATION_ERROR: 'VAL_ERR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DATABASE_ERROR: 'DB_ERR',
  INTERNAL_ERROR: 'INT_ERR'
};

// Create a new diet tracker for a diet plan
const createDietTracker = async (req, res) => {
  try {
    const userId = req.userId;
    const { dietPlanId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to create a diet tracker'
        }
      });
    }
    
    if (!dietPlanId) {
      return res.status(400).json({ 
        message: 'Diet plan ID is required',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'dietPlanId is a required field'
        }
      });
    }
    
    // Check if a diet tracker already exists for this plan and user
    const existingTracker = await DietTracker.findOne({
      userId,
      dietPlanId,
      status: 'active'
    });
    
    if (existingTracker) {
      return res.status(200).json({
        message: 'Diet tracker already exists for this plan',
        dietTracker: existingTracker
      });
    }
    
    // Get the diet plan to set up the tracker
    const dietPlan = await DietPlan.findById(dietPlanId);
    
    if (!dietPlan) {
      return res.status(404).json({ 
        message: 'Diet plan not found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: `No diet plan found with ID: ${dietPlanId}`
        }
      });
    }
    
    // Check if the diet plan belongs to the authenticated user
    if (dietPlan.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to track this diet plan',
        error: {
          code: ERROR_CODES.FORBIDDEN,
          details: 'You can only track your own diet plans'
        }
      });
    }
    
    // Initialize tracker with day 1
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of the day
    
    // Get day 1 data
    const day1 = dietPlan.days.find(day => day.dayNumber === 1);
    
    if (!day1) {
      return res.status(404).json({ 
        message: 'Cannot find day 1 in diet plan',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: 'Diet plan does not have day 1 defined'
        }
      });
    }
    
    // Create daily tracker for day 1
    const dailyTracker = {
      date: today,
      dayNumber: 1,
      completedMeals: 0,
      totalMeals: day1.meals.length,
      completionPercentage: 0,
      caloriesConsumed: 0,
      targetCalories: dietPlan.dailyCalories,
      nutrition: {
        protein: {
          consumed: 0,
          target: dietPlan.dailyMacros.protein
        },
        carbs: {
          consumed: 0,
          target: dietPlan.dailyMacros.carbs
        },
        fat: {
          consumed: 0,
          target: dietPlan.dailyMacros.fat
        }
      }
    };
    
    // Create the diet tracker
    const dietTracker = new DietTracker({
      userId,
      dietPlanId,
      startDate: today,
      status: 'active',
      currentDay: 1,
      totalDays: dietPlan.planDuration,
      overallCompletionPercentage: 0,
      streak: 0,
      adherenceScore: 0,
      dailyTrackers: [dailyTracker]
    });
    
    await dietTracker.save();
    
    res.status(201).json({
      message: 'Diet tracker created successfully',
      dietTracker
    });
  } catch (error) {
    console.error('Error creating diet tracker:', error);
    res.status(500).json({ 
      message: 'Failed to create diet tracker',
      error: error.message
    });
  }
};

// Update a diet tracker when a meal is eaten
const updateTrackerForMeal = async (req, res) => {
  try {
    const userId = req.userId;
    const { trackerId, dayNumber, mealId, eaten } = req.body;

    console.log("Received from frontend:", { trackerId, dayNumber, mealId, eaten });

    const missingFields = [];
    if (!trackerId) missingFields.push('trackerId');
    if (!dayNumber) missingFields.push('dayNumber');
    if (!mealId) missingFields.push('mealId');
    if (eaten === undefined) missingFields.push('eaten');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: {
          code: 'VALIDATION_ERROR',
          details: `The following required fields are missing: ${missingFields.join(', ')}`,
          missingFields,
        },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({
        message: 'Invalid meal ID format',
        error: {
          code: 'VALIDATION_ERROR',
          details: 'The provided meal ID is not valid',
        },
      });
    }

    const dietTracker = await DietTracker.findById(trackerId);
    if (!dietTracker) {
      return res.status(404).json({
        message: 'Diet tracker not found',
        error: {
          code: 'NOT_FOUND',
          details: `No diet tracker found with ID: ${trackerId}`,
        },
      });
    }

    if (dietTracker.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: 'Not authorized to update this tracker',
        error: {
          code: 'FORBIDDEN',
          details: 'You can only update your own trackers',
        },
      });
    }

    const dietPlan = await DietPlan.findById(dietTracker.dietPlanId);
    if (!dietPlan) {
      return res.status(404).json({
        message: 'Associated diet plan not found',
        error: {
          code: 'NOT_FOUND',
          details: `No diet plan found with ID: ${dietTracker.dietPlanId}`,
        },
      });
    }

    const day = dietPlan.days.find(d => d.dayNumber === parseInt(dayNumber));
    if (!day) {
      return res.status(404).json({
        message: 'Day not found in diet plan',
        error: {
          code: 'NOT_FOUND',
          details: `No day with number ${dayNumber} found in the diet plan`,
        },
      });
    }

    // Use manual find instead of .id()
    const meal = day.meals.find(m => m._id.toString() === mealId);
    if (!meal) {
      return res.status(404).json({
        message: 'Meal not found',
        error: {
          code: 'NOT_FOUND',
          details: `No meal found with ID: ${mealId} in day ${dayNumber}`,
        },
      });
    }

    meal.eaten = eaten;
    await dietPlan.save();

    // Return updated tracker details if needed
    const updatedDietTracker = await DietTracker.findById(trackerId);

    return res.status(200).json({
      message: 'Diet tracker updated successfully',
      dietTracker: updatedDietTracker, // optional, for frontend updates
      data: meal,
    });

  } catch (error) {
    console.error('Error updating diet tracker:', error);
    return res.status(500).json({
      message: 'Failed to update diet tracker',
      error: error.message,
    });
  }
};



// Get the active diet tracker for a user
const getActiveTracker = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to get tracker'
        }
      });
    }
    
    // Find the active diet tracker for this user
    const dietTracker = await DietTracker.findOne({
      userId,
      status: 'active'
    });
    
    if (!dietTracker) {
      return res.status(404).json({ 
        message: 'No active diet tracker found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: 'You do not have any active diet trackers'
        }
      });
    }
    
    // Get the associated diet plan for additional information
    const dietPlan = await DietPlan.findById(dietTracker.dietPlanId);
    
    res.status(200).json({
      message: 'Active diet tracker retrieved successfully',
      dietTracker,
      dietPlan
    });
  } catch (error) {
    console.error('Error retrieving active diet tracker:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve active diet tracker',
      error: error.message
    });
  }
};

// Get a specific day from the diet tracker
const getTrackerDay = async (req, res) => {
  try {
    const userId = req.userId;
    const { trackerId, dayNumber } = req.params;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to get tracker'
        }
      });
    }
    
    if (!trackerId || !dayNumber) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Both trackerId and dayNumber are required'
        }
      });
    }
    
    // Find the diet tracker
    const dietTracker = await DietTracker.findById(trackerId);
    
    if (!dietTracker) {
      return res.status(404).json({ 
        message: 'Diet tracker not found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: `No diet tracker found with ID: ${trackerId}`
        }
      });
    }
    
    // Check if the tracker belongs to the authenticated user
    if (dietTracker.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to access this tracker',
        error: {
          code: ERROR_CODES.FORBIDDEN,
          details: 'You can only access your own trackers'
        }
      });
    }
    
    // Find the daily tracker for the requested day
    const day = parseInt(dayNumber);
    const dailyTracker = dietTracker.dailyTrackers.find(t => t.dayNumber === day);
    
    if (!dailyTracker) {
      return res.status(404).json({ 
        message: 'Day not found in tracker',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: `No tracker data found for day ${day}`
        }
      });
    }
    
    // Get the associated diet plan day for meal details
    const dietPlan = await DietPlan.findById(dietTracker.dietPlanId);
    const planDay = dietPlan ? dietPlan.days.find(d => d.dayNumber === day) : null;
    
    res.status(200).json({
      message: 'Tracker day retrieved successfully',
      dailyTracker,
      planDay
    });
  } catch (error) {
    console.error('Error retrieving tracker day:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve tracker day',
      error: error.message
    });
  }
};

// Get all trackers for a user
const getAllTrackers = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to get trackers'
        }
      });
    }
    
    // Find all diet trackers for this user
    const dietTrackers = await DietTracker.find({ userId });
    
    if (!dietTrackers || dietTrackers.length === 0) {
      return res.status(404).json({ 
        message: 'No diet trackers found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: 'You do not have any diet trackers'
        }
      });
    }
    
    res.status(200).json({
      message: 'Diet trackers retrieved successfully',
      dietTrackers
    });
  } catch (error) {
    console.error('Error retrieving diet trackers:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve diet trackers',
      error: error.message
    });
  }
};

// Change tracker status (e.g., to abandoned)
const updateTrackerStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { trackerId, status } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required'
        }
      });
    }
    
    if (!trackerId || !status) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Both trackerId and status are required'
        }
      });
    }
    
    if (!['active', 'completed', 'abandoned'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Status must be one of: active, completed, abandoned'
        }
      });
    }
    
    // Find the diet tracker
    const dietTracker = await DietTracker.findById(trackerId);
    
    if (!dietTracker) {
      return res.status(404).json({ 
        message: 'Diet tracker not found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: `No diet tracker found with ID: ${trackerId}`
        }
      });
    }
    
    // Check if the tracker belongs to the authenticated user
    if (dietTracker.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized to update this tracker',
        error: {
          code: ERROR_CODES.FORBIDDEN,
          details: 'You can only update your own trackers'
        }
      });
    }
    
    // Update the status
    dietTracker.status = status;
    await dietTracker.save();
    
    res.status(200).json({
      message: 'Tracker status updated successfully',
      dietTracker
    });
  } catch (error) {
    console.error('Error updating tracker status:', error);
    res.status(500).json({ 
      message: 'Failed to update tracker status',
      error: error.message
    });
  }
};

module.exports = {
  createDietTracker,
  updateTrackerForMeal,
  getActiveTracker,
  getTrackerDay,
  getAllTrackers,
  updateTrackerStatus
}; 