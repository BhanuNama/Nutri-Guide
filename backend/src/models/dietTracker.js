const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  consumed: {
    type: Number,
    default: 0
  },
  target: {
    type: Number,
    default: 0
  }
});

const dailyTrackerSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dayNumber: {
    type: Number,
    required: true,
    min: 1
  },
  completedMeals: {
    type: Number,
    default: 0
  },
  totalMeals: {
    type: Number,
    required: true
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  caloriesConsumed: {
    type: Number,
    default: 0
  },
  targetCalories: {
    type: Number,
    required: true
  },
  nutrition: {
    protein: nutritionSchema,
    carbs: nutritionSchema,
    fat: nutritionSchema
  }
}, {
  timestamps: true
});

const dietTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dietPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  currentDay: {
    type: Number,
    default: 1
  },
  totalDays: {
    type: Number,
    required: true
  },
  overallCompletionPercentage: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  adherenceScore: {
    type: Number,
    default: 0
  },
  dailyTrackers: [dailyTrackerSchema]
}, {
  timestamps: true
});

// Calculate completion percentage for each day
dietTrackerSchema.methods.calculateDailyCompletion = function(dayNumber) {
  const dayTracker = this.dailyTrackers.find(tracker => tracker.dayNumber === dayNumber);
  
  if (dayTracker) {
    dayTracker.completionPercentage = dayTracker.totalMeals > 0 
      ? Math.round((dayTracker.completedMeals / dayTracker.totalMeals) * 100) 
      : 0;
    return dayTracker.completionPercentage;
  }
  return 0;
};

// Calculate overall completion percentage
dietTrackerSchema.methods.calculateOverallCompletion = function() {
  if (this.dailyTrackers.length === 0) return 0;
  
  const totalCompletion = this.dailyTrackers.reduce((sum, tracker) => sum + tracker.completionPercentage, 0);
  this.overallCompletionPercentage = Math.round(totalCompletion / this.dailyTrackers.length);
  return this.overallCompletionPercentage;
};

// Calculate streak
dietTrackerSchema.methods.calculateStreak = function() {
  if (this.dailyTrackers.length === 0) return 0;
  
  // Sort trackers by date
  const sortedTrackers = [...this.dailyTrackers].sort((a, b) => b.date - a.date);
  
  let streak = 0;
  const threshold = 70; // 70% completion is considered a successful day
  
  for (const tracker of sortedTrackers) {
    if (tracker.completionPercentage >= threshold) {
      streak++;
    } else {
      break;
    }
  }
  
  this.streak = streak;
  return streak;
};

// Calculate adherence score
dietTrackerSchema.methods.calculateAdherenceScore = function() {
  if (this.dailyTrackers.length === 0) return 0;
  
  // Weight factors for the score
  const completionWeight = 0.5;
  const streakWeight = 0.3;
  const nutritionWeight = 0.2;
  
  // Calculate nutrition adherence (average of protein, carbs, and fat adherence)
  let nutritionAdherence = 0;
  let nutritionCount = 0;
  
  this.dailyTrackers.forEach(tracker => {
    const protein = tracker.nutrition.protein.target > 0 
      ? Math.min(100, (tracker.nutrition.protein.consumed / tracker.nutrition.protein.target) * 100) 
      : 0;
    
    const carbs = tracker.nutrition.carbs.target > 0 
      ? Math.min(100, (tracker.nutrition.carbs.consumed / tracker.nutrition.carbs.target) * 100) 
      : 0;
    
    const fat = tracker.nutrition.fat.target > 0 
      ? Math.min(100, (tracker.nutrition.fat.consumed / tracker.nutrition.fat.target) * 100) 
      : 0;
    
    if (protein > 0) {
      nutritionAdherence += protein;
      nutritionCount++;
    }
    
    if (carbs > 0) {
      nutritionAdherence += carbs;
      nutritionCount++;
    }
    
    if (fat > 0) {
      nutritionAdherence += fat;
      nutritionCount++;
    }
  });
  
  const avgNutritionAdherence = nutritionCount > 0 ? nutritionAdherence / nutritionCount : 0;
  
  // Calculate streak score (as a percentage of total days)
  const streakScore = (this.streak / this.totalDays) * 100;
  
  // Calculate final adherence score
  this.adherenceScore = Math.round(
    (this.overallCompletionPercentage * completionWeight) +
    (streakScore * streakWeight) +
    (avgNutritionAdherence * nutritionWeight)
  );
  
  return this.adherenceScore;
};

const DietTracker = mongoose.model('DietTracker', dietTrackerSchema);

module.exports = DietTracker; 