/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} gender - Gender ('male' or 'female')
 * @returns {number} - BMR in calories
 */
const calculateBMR = (weight, height, age, gender) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
};

/**
 * Calculate Total Daily Energy Expenditure (TDEE) based on activity level
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level
 * @returns {number} - TDEE in calories
 */
const calculateTDEE = (bmr, activityLevel) => {
  const activityMultipliers = {
    'sedentary': 1.2, // Little or no exercise
    'lightly-active': 1.375, // Light exercise 1-3 days/week
    'moderately-active': 1.55, // Moderate exercise 3-5 days/week
    'very-active': 1.725, // Hard exercise 6-7 days/week
    'extra-active': 1.9 // Very hard exercise & physical job or 2x training
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55; // Default to moderate if not found
  return bmr * multiplier;
};

/**
 * Calculate calorie needs based on fitness goal
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - Fitness goal ('weight-loss', 'maintenance', 'weight-gain')
 * @returns {number} - Daily calorie target
 */
const calculateCalories = (tdee, goal) => {
  switch (goal) {
    case 'weight-loss':
      return Math.round(tdee - 500); // 500 calorie deficit for weight loss
    case 'weight-gain':
      return Math.round(tdee + 500); // 500 calorie surplus for weight gain
    case 'maintenance':
    default:
      return Math.round(tdee); // maintenance by default
  }
};

/**
 * Calculate macronutrients based on calorie needs and fitness goal
 * @param {number} calories - Daily calorie target
 * @param {number} weight - Weight in kg
 * @param {string} goal - Fitness goal
 * @returns {Object} - Macronutrient targets in grams
 */
const calculateMacros = (calories, weight, goal) => {
  let proteinPerKg;
  let fatPercent;
  
  // Set protein requirements based on fitness goal
  switch (goal) {
    case 'weight-loss':
      proteinPerKg = 2.0; // Higher protein for weight loss
      fatPercent = 0.25; // 25% of calories from fat
      break;
    case 'weight-gain':
      proteinPerKg = 1.8; // Moderate protein for weight gain
      fatPercent = 0.30; // 30% of calories from fat
      break;
    case 'maintenance':
    default:
      proteinPerKg = 1.6; // Default moderate protein intake
      fatPercent = 0.30; // 30% of calories from fat
  }
  
  // Calculate macros in grams
  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round((calories * fatPercent) / 9); // 9 calories per gram of fat
  
  // Remaining calories from carbs
  const proteinCalories = protein * 4; // 4 calories per gram of protein
  const fatCalories = fat * 9;
  const carbCalories = calories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / 4); // 4 calories per gram of carbs
  
  return { protein, carbs, fat };
};

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateCalories,
  calculateMacros
}; 