const { User, DietPlan, DietTracker } = require('../models');
const { generateMealPlan, generateExtraDays, customGeminiMealPlan } = require('../utils/geminiApi');
const { calculateBMR, calculateTDEE, calculateCalories, calculateMacros } = require('../utils/nutritionCalculations');

// Error codes for different scenarios
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  GEMINI_ERROR: 'GEMINI_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TIMEOUT: 'TIMEOUT',
  DATA_FORMAT_ERROR: 'DATA_FORMAT_ERROR',
  FORBIDDEN: 'FORBIDDEN',
};

/**
 * Generate a diet plan for the user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const generateDietPlan = async (req, res) => {
  try {
    // Get user ID from token
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to generate a diet plan'
        }
      });
    }

    // Extract parameters from request body
    const { 
      age, weight, height, gender, activityLevel, goal, 
      planDuration, fitnessGoal, dietType, restrictionsAndAllergies, mealPerDay, foodType, planName
    } = req.body;
    
    // Validation
    if (!age || !weight || !height || !gender || !activityLevel || !goal) {
      return res.status(400).json({ 
        message: 'Missing required parameters',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'All basic parameters (age, weight, height, gender, activityLevel, goal) are required',
          missingFields: [
            !age ? 'age' : null,
            !weight ? 'weight' : null,
            !height ? 'height' : null,
            !gender ? 'gender' : null,
            !activityLevel ? 'activityLevel' : null,
            !goal ? 'goal' : null,
            !planName ? 'planName' : null // Added planName to missing fields
          ].filter(Boolean)
        }
      });
    }

    // Additional validations for specific fields
    if (planDuration > 30) {
      return res.status(400).json({ 
        message: 'Plan duration too long', 
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Plan duration cannot exceed 30 days for performance reasons',
          field: 'planDuration',
          maxValue: 30
        }
      });
    }

    if (mealPerDay < 2 || mealPerDay > 6) {
      return res.status(400).json({ 
        message: 'Invalid meals per day', 
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Meals per day must be between 2 and 6',
          field: 'mealPerDay',
          validRange: { min: 1, max: 6 }
        }
      });
    }

    // Validate foodType
    const validFoodTypes = ['veg', 'non-veg', 'both'];
    if (!validFoodTypes.includes(foodType)) {
      return res.status(400).json({
        message: 'Invalid foodType',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'foodType must be one of "veg", "non-veg", or "both"',
          field: 'foodType',
          validOptions: validFoodTypes
        }
      });
    }

    // Calculate daily calorie needs and macros based on user parameters
    const bmr = calculateBMR(weight, height, age, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const dailyCalories = calculateCalories(tdee, goal);
    const dailyMacros = calculateMacros(dailyCalories, weight, goal);
    
    console.log(`Generating diet plan for user ${userId} with ${dailyCalories} calories`);
    
    let mealPlanData;
    let usedFallbackData = false;
    let warnings = null;
    
    try {
      // Generate meal plan using Gemini API
      console.log('Generating meal plan with Gemini API...');
      
      const mealPlanParams = {
        age, weight, height, gender, activityLevel, fitnessGoal: fitnessGoal || goal,
        dietType: dietType || 'balanced',
        foodType: foodType,  // Pass foodType here
        restrictionsAndAllergies: restrictionsAndAllergies || [],
        mealPerDay: mealPerDay, // Never default - use exactly what user provided
        planDuration: planDuration || 7
      };
      
      // Timeout setting for external API call
      const apiTimeout = setTimeout(() => {
        console.log('Gemini API call taking too long, will use fallback data');
      }, 25000); // 25-second warning timeout
      
      mealPlanData = await generateMealPlan(mealPlanParams);
      clearTimeout(apiTimeout);
      
      // If meal plan generation returned successfully but with issues
      if (mealPlanData && mealPlanData._warnings) {
        warnings = mealPlanData._warnings;
        delete mealPlanData._warnings;
      }
      
    } catch (generationError) {
      console.error('Error generating meal plan with AI:', generationError);
      
      // Handle specific error types
      if (generationError.code === 'GEMINI_API_ERROR' || 
          generationError.code === 'GEMINI_NOT_INITIALIZED' ||
          generationError.code === 'INVALID_JSON_RESPONSE') {
        
        usedFallbackData = true;
        warnings = {
          type: 'fallback_data',
          message: 'Using sample meal plan data. AI-based generation is currently unavailable.'
        };
        
        // Use fallback data
        console.log('Using fallback meal plan data');
        mealPlanData = generateExtraDays(
          planDuration || 7, 
          [], 
          mealPerDay || 3,
          dietType || 'non-veg',
          foodType // Use foodType in fallback data generation if needed
        );
      } else {
        // For other types of errors, propagate the error
        throw {
          message: 'Failed to generate meal plan',
          originalError: generationError
        };
      }
    }
    
    
    // Process the meal plan data (AI-generated or fallback)
    let days = [];
    if (mealPlanData && mealPlanData.days) {
      days = mealPlanData.days;
    } else if (Array.isArray(mealPlanData)) {
      days = mealPlanData;
    } else {
      return res.status(500).json({ 
        message: 'Invalid meal plan data format', 
        error: {
          code: ERROR_CODES.DATA_FORMAT_ERROR,
          details: 'The meal plan generator returned data in an unexpected format'
        }
      });
    }
    
    // Create the diet plan document with all information, including foodType
    const dietPlan = new DietPlan({
      userId,
      planName, // Added planName
      age,
      weight,
      height,
      gender,
      activityLevel,
      goal,
      mealPerDay,
      planDuration: planDuration || days.length,
      dailyCalories,
      dailyMacros,
      foodType,  // Include foodType in the diet plan data
      days
    });
  
    // Save to database
    try {
      await dietPlan.save();
      
      // Return the created diet plan with additional info
      return res.status(201).json({
        message: 'Diet plan created successfully',
        dietPlan,
        usedFallbackData,
        warnings
      });
    } catch (dbError) {
      console.error('Database error saving diet plan:', dbError);
      return res.status(500).json({ 
        message: 'Failed to save diet plan', 
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          details: dbError.message
        }
      });
    }
    
  } catch (error) {
    console.error('Unhandled error generating diet plan:', error);
    
    // Determine if this is a timeout error
    const isTimeout = error.code === 'ETIMEDOUT' || 
                      error.code === 'ESOCKETTIMEDOUT' || 
                      error.message?.includes('timeout');
    
    if (isTimeout) {
      return res.status(504).json({ 
        message: 'Request timed out while generating diet plan', 
        error: {
          code: ERROR_CODES.TIMEOUT,
          details: 'The meal plan generation service took too long to respond. Please try again later when the system is less busy.',
          retryAfter: 60 // Suggest retry after 1 minute
        }
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to generate diet plan', 
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error.message || 'An unexpected error occurred'
      }
    });
  }
};

/**
 * Generate a custom meal plan based on user input
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const CustomMeal = require('../models/CustomMeal');
const MealPlan = require('../models/CustomMeal');

const customMealPlanner = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required'
        }
      });
    }

    const { userSentence } = req.body;
    if (!userSentence) {
      return res.status(400).json({
        message: 'Invalid input',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Please provide your meal plan request'
        }
      });
    }

    const mealPlanData = await customGeminiMealPlan(userSentence);

    // Save meal plan even if partially generated (but has some structure)
    const savedPlan = await CustomMeal.create({
      userId,
      message: mealPlanData.days.length > 0 
        ? 'Custom meal plan generated successfully' 
        : 'Meal plan generated with limitations',
      days: mealPlanData.days,
      notes: mealPlanData.notes || [],
      warning: mealPlanData.warning || ''
    });

    // Return saved plan
    return res.status(200).json({
      message: savedPlan.message,
      mealPlan: savedPlan
    });

  } catch (error) {
    console.error('Error in customMealPlanner:', error);
    return res.status(500).json({
      message: 'Failed to generate meal plan',
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error.message
      }
    });
  }
};

const deleteCustomMealPlan = async (req, res) => {
  try {
    const userId = req.userId; // Assuming auth middleware sets req.userId
    const { mealPlanId } = req.params; // Plan ID from URL

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED', details: 'User authentication is required' }
      });
    }

    if (!mealPlanId) {
      return res.status(400).json({
        message: 'Invalid request',
        error: { code: 'VALIDATION_ERROR', details: 'Meal Plan ID is required' }
      });
    }

    // Correct reference to the CustomMeal model
    const mealPlan = await CustomMeal.findOne({ _id: mealPlanId, userId });

    if (!mealPlan) {
      return res.status(404).json({
        message: 'Meal plan not found',
        error: { code: 'NOT_FOUND', details: 'No matching meal plan for this user' }
      });
    }

    await mealPlan.deleteOne(); // Delete the meal plan

    return res.status(200).json({
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return res.status(500).json({
      message: 'Failed to delete meal plan',
      error: { code: 'INTERNAL_ERROR', details: error.message }
    });
  }
};

const getCustomMealPlan = async (req, res) => {
  try {
    // Assuming your authentication middleware sets req.userId
    const userId = req.userId; 

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: { code: 'UNAUTHORIZED', details: 'User authentication is required' }
      });
    }

    // Find all meal plans by userId
    const mealPlans = await CustomMeal.find({ userId });

    if (mealPlans.length === 0) {
      return res.status(404).json({
        message: 'No meal plans found for this user',
        error: { code: 'NOT_FOUND', details: 'User has no meal plans' }
      });
    }

    // Respond with the list of meal plans
    return res.status(200).json({
      message: 'Meal plans fetched successfully',
      mealPlans: mealPlans
    });

  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return res.status(500).json({
      message: 'Failed to fetch meal plans',
      error: { code: 'INTERNAL_ERROR', details: error.message }
    });
  }
};

const updateMealStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { mealPlanId, dayNumber, mealType } = req.body;

    // Validate required fields
    if (!userId || !mealPlanId || !dayNumber || !mealType) {
      return res.status(400).json({
        message: 'Missing required fields',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'mealPlanId, dayNumber, and mealType are required'
        }
      });
    }

    // Find the meal plan
    const mealPlan = await CustomMeal.findOne({
      _id: mealPlanId,
      userId: userId
    });

    if (!mealPlan) {
      return res.status(404).json({
        message: 'Meal plan not found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: 'No meal plan found for this user with the provided ID'
        }
      });
    }

    // Find the specific day
    const dayIndex = mealPlan.days.findIndex(day => day.dayNumber === dayNumber);
    if (dayIndex === -1) {
      return res.status(404).json({
        message: 'Day not found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: `Day ${dayNumber} not found in the meal plan`
        }
      });
    }

    // Find the specific meal
    const mealIndex = mealPlan.days[dayIndex].meals.findIndex(
      meal => meal.type.toLowerCase() === mealType.toLowerCase()
    );

    if (mealIndex === -1) {
      return res.status(404).json({
        message: 'Meal not found',
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: `Meal of type ${mealType} not found in day ${dayNumber}`
        }
      });
    }

    // Toggle the eaten status (or set to true if you only want one-way update)
    mealPlan.days[dayIndex].meals[mealIndex].eaten = true;

    // Mark the array as modified since we're modifying a nested object
    mealPlan.markModified('days');

    // Save the updated meal plan
    const updatedMealPlan = await mealPlan.save();

    return res.status(200).json({
      message: 'Meal status updated successfully',
      mealPlan: updatedMealPlan
    });

  } catch (error) {
    console.error('Error updating meal status:', error);
    return res.status(500).json({
      message: 'Failed to update meal status',
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error.message
      }
    });
  }
};

const deleteMealPlan = async (req, res) => {
  try {
    // Authentication check
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required'
        }
      });
    }

    // Parameter validation
    const { planId } = req.params;
    if (!planId) {
      return res.status(400).json({ 
        message: 'Plan ID is required',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Missing plan ID parameter'
        }
      });
    }

    // Verify plan exists and belongs to user
    const existingPlan = await DietPlan.findOne({ 
      _id: planId,
      userId
    });

    if (!existingPlan) {
      return res.status(404).json({ 
        message: 'Plan not found', 
        error: {
          code: ERROR_CODES.NOT_FOUND,
          details: 'No plan found with the provided ID'
        }
      });
    }

    // Permanent deletion
    const result = await DietPlan.deleteOne({ 
      _id: planId,
      userId 
    });

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete plan');
    }

    return res.status(200).json({
      message: 'Diet plan permanently deleted',
      deletedPlanId: planId,
      planName: existingPlan.planName,
      deletedAt: new Date()
    });
    
  } catch (error) {
    console.error('Delete meal plan error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid plan ID format',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR
        }
      });
    }
    
    return res.status(500).json({ 
      message: 'Failed to delete diet plan', 
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
};

/**
 * Get the user's latest diet plan
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getLatestDietPlan = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to access diet plans'
        }
      });
    }
    
    try {
      // Find the most recent diet plan for the user
      const dietPlan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });
      
      if (!dietPlan) {
        return res.status(404).json({ 
          message: 'No diet plan found', 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: 'You have not generated any diet plans yet',
            nextAction: 'generate'
          }
        });
      }
      
      res.status(200).json(dietPlan);
    } catch (dbError) {
      console.error('Database error fetching latest diet plan:', dbError);
      res.status(500).json({ 
        message: 'Failed to fetch diet plan from database', 
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          details: dbError.message
        }
      });
    }
  } catch (error) {
    console.error('Unhandled error fetching latest diet plan:', error);
    res.status(500).json({ 
      message: 'Failed to fetch latest diet plan', 
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error.message
      }
    });
  }
};

/**
 * Get a specific day from the user's latest diet plan
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getDietPlanDay = async (req, res) => {
  try {
    const dayNumber = parseInt(req.params.dayNumber);
    const userId = req.userId;

    if (isNaN(dayNumber) || dayNumber < 1) {
      return res.status(400).json({
        message: 'Invalid day number',
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: 'Day number must be a positive integer',
          field: 'dayNumber'
        }
      });
    }

    try {
      // Fetch the most recent diet plan for the user
      const dietPlan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });

      if (!dietPlan) {
        console.log(`No diet plan found for user ${userId}`);
        return res.status(404).json({
          message: 'No diet plan found for user', 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: 'User has not generated any diet plans yet'
          }
        });
      }

      // Check if requested day exceeds plan duration
      if (dayNumber > dietPlan.planDuration) {
        console.log(`Requested day ${dayNumber} exceeds plan duration ${dietPlan.planDuration}`);
        return res.status(404).json({ 
          message: `Day ${dayNumber} exceeds the diet plan duration`, 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: `The requested day ${dayNumber} exceeds the maximum plan duration of ${dietPlan.planDuration} days`,
            maxDays: dietPlan.planDuration
          }
        });
      }
  
      // Find the requested day
      const day = dietPlan.days.find(d => d.dayNumber === parseInt(dayNumber));
  
      if (!day) {
        console.log(`Day ${dayNumber} not found in diet plan for user ${userId}`);
        return res.status(404).json({ 
          message: `Day ${dayNumber} not found in diet plan`, 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: `The requested day ${dayNumber} does not exist in the current diet plan`,
            maxDays: dietPlan.planDuration
          }
        });
      }
  
      res.status(200).json({
        day,
        dailyCalories: dietPlan.dailyCalories,
        dailyMacros: dietPlan.dailyMacros
      });
    } catch (dbError) {
      console.error('Database error fetching diet plan day:', dbError);
      res.status(500).json({ 
        message: 'Failed to fetch diet plan day from database', 
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          details: dbError.message
        }
      });
    }
  } catch (error) {
    console.error('Unhandled error fetching diet plan day:', error);
    res.status(500).json({ 
      message: 'Failed to fetch diet plan day', 
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error.message
      }
    });
  }
};

// Get all diet plans for a user
const getAllDietPlans = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Find all diet plans for the user, sorted by creation date (newest first)
    const dietPlans = await DietPlan.find({ userId }).sort({ createdAt: -1 });
    
    if (!dietPlans || dietPlans.length === 0) {
      return res.status(404).json({ message: 'No diet plans found' });
    }
    
    // Return all diet plans
    res.status(200).json({ 
      message: 'Diet plans retrieved successfully',
      dietPlans
    });
  } catch (error) {
    console.error('Error retrieving diet plans:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve diet plans', 
      error: error.message 
    });
  }
};

// Track meal eaten status
const trackMeal = async (req, res) => {
  try {
    const userId = req.userId;
    const { planId, dayId, mealId, eaten } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          details: 'User authentication is required to track meals'
        }
      });
    }
    
    // Validate required fields
    const missingFields = [];
    if (!planId) missingFields.push('planId');
    if (!dayId) missingFields.push('dayId');
    if (!mealId) missingFields.push('mealId');
    if (eaten === undefined) missingFields.push('eaten');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          details: `The following required fields are missing: ${missingFields.join(', ')}`,
          missingFields
        }
      });
    }
    
    // Find the diet plan
    try {
      const dietPlan = await DietPlan.findById(planId);
      
      if (!dietPlan) {
        return res.status(404).json({ 
          message: 'Diet plan not found', 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: `No diet plan found with ID: ${planId}`
          }
        });
      }
      
      // Check if the diet plan belongs to the authenticated user
      if (dietPlan.userId.toString() !== userId.toString()) {
        return res.status(403).json({ 
          message: 'Not authorized to update this diet plan', 
          error: {
            code: ERROR_CODES.FORBIDDEN,
            details: 'You can only track meals in your own diet plans'
          }
        });
      }
      
      // Find the day and meal to update
      const day = dietPlan.days.id(dayId);
      if (!day) {
        return res.status(404).json({ 
          message: 'Day not found', 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: `No day found with ID: ${dayId} in the specified diet plan`,
            availableDays: dietPlan.days.length
          }
        });
      }
      
      const meal = day.meals.id(mealId);
      if (!meal) {
        return res.status(404).json({ 
          message: 'Meal not found', 
          error: {
            code: ERROR_CODES.NOT_FOUND,
            details: `No meal found with ID: ${mealId} in the specified day`,
            availableMeals: day.meals.length
          }
        });
      }
      
      // Update the eaten status
      meal.eaten = eaten;
      
      // Save the updated diet plan
      await dietPlan.save();
      
      // Calculate nutrition progress
      const totalDailyCalories = dietPlan.dailyCalories;
      const totalDailyProtein = dietPlan.dailyMacros.protein;
      const totalDailyCarbs = dietPlan.dailyMacros.carbs;
      const totalDailyFat = dietPlan.dailyMacros.fat;
      
      // Calculate consumed nutrition from eaten meals
      const consumedMeals = day.meals.filter(m => m.eaten);
      const consumedCalories = consumedMeals.reduce((sum, m) => sum + (m.nutrition?.calories || 0), 0);
      const consumedProtein = consumedMeals.reduce((sum, m) => sum + (m.nutrition?.protein || 0), 0);
      const consumedCarbs = consumedMeals.reduce((sum, m) => sum + (m.nutrition?.carbs || 0), 0);
      const consumedFat = consumedMeals.reduce((sum, m) => sum + (m.nutrition?.fat || 0), 0);
      
      // Calculate percentages
      const calorieProgress = Math.round((consumedCalories / totalDailyCalories) * 100);
      const proteinProgress = Math.round((consumedProtein / totalDailyProtein) * 100);
      const carbsProgress = Math.round((consumedCarbs / totalDailyCarbs) * 100);
      const fatProgress = Math.round((consumedFat / totalDailyFat) * 100);
      
      res.status(200).json({
        message: 'Meal status updated successfully',
        meal,
        progress: {
          calories: {
            consumed: consumedCalories,
            total: totalDailyCalories,
            percentage: calorieProgress
          },
          protein: {
            consumed: consumedProtein,
            total: totalDailyProtein,
            percentage: proteinProgress
          },
          carbs: {
            consumed: consumedCarbs,
            total: totalDailyCarbs,
            percentage: carbsProgress
          },
          fat: {
            consumed: consumedFat,
            total: totalDailyFat,
            percentage: fatProgress
          }
        }
      });
    } catch (dbError) {
      console.error('Database error updating meal status:', dbError);
      res.status(500).json({ 
        message: 'Database error while updating meal status', 
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          details: dbError.message
        }
      });
    }
  } catch (error) {
    console.error('Unhandled error updating meal status:', error);
    res.status(500).json({ 
      message: 'Failed to update meal status', 
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        details: error.message
      }
    });
  }
};

module.exports = {
  generateDietPlan,
  getLatestDietPlan,
  getDietPlanDay,
  getAllDietPlans,
  trackMeal,
  deleteMealPlan,
  customMealPlanner,
  deleteCustomMealPlan,
  getCustomMealPlan,
  updateMealStatus
}; 