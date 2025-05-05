const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GENAI_API_KEY } = require('../config');
const fs = require('fs');
const path = require('path');

// Initialize the Google Generative AI
let genAI;
try {
  genAI = new GoogleGenerativeAI(GENAI_API_KEY);
} catch (error) {
  console.error('Failed to initialize Google Generative AI:', error);
}

/**
 * Generate extra days for a meal plan when needed
 * @param {number} planDuration - The total number of days required
 * @param {Array} existingDays - Any existing days to include (optional)
 * @param {number} mealPerDay - Number of meals per day (optional, default: 4)
 * @param {string} dietType - Type of diet (veg, non-veg, vegan) (optional, default: 'non-veg')
 * @returns {Array} Complete array of days
 */
function generateExtraDays(planDuration, existingDays = [], mealPerDay = 4, dietType = 'non-veg') {
  const days = [...existingDays];
  
  // Set up meal templates based on diet type
  const mealTemplates = {
    veg: {
      Breakfast: [
        {
          dishName: "Vegetable Poha",
          description: "Flattened rice cooked with vegetables, nuts, and spices. Rich in carbohydrates, fiber, and essential vitamins.",
          nutrition: { calories: 250, protein: 8, carbs: 40, fat: 7 }
        },
        {
          dishName: "Masala Dosa with Sambar",
          description: "Crispy rice and lentil crepe filled with spiced potatoes, served with lentil soup. Good source of protein and complex carbs.",
          nutrition: { calories: 300, protein: 10, carbs: 45, fat: 10 }
        },
        {
          dishName: "Vegetable Upma",
          description: "Savory semolina porridge with mixed vegetables. High in fiber and essential nutrients.",
          nutrition: { calories: 240, protein: 7, carbs: 35, fat: 8 }
        }
      ],
      Lunch: [
        {
          dishName: "Rajma Chawal",
          description: "Kidney bean curry served with rice. Excellent source of plant protein, fiber, and complex carbohydrates.",
          nutrition: { calories: 380, protein: 15, carbs: 60, fat: 8 }
        },
        {
          dishName: "Chole Bhature",
          description: "Spiced chickpea curry with fried bread. Protein-rich meal with healthy carbohydrates.",
          nutrition: { calories: 450, protein: 18, carbs: 65, fat: 15 }
        },
        {
          dishName: "Paneer Butter Masala with Roti",
          description: "Cottage cheese in a creamy tomato sauce served with whole wheat flatbread. Rich in protein and calcium.",
          nutrition: { calories: 420, protein: 20, carbs: 40, fat: 18 }
        }
      ],
      Dinner: [
        {
          dishName: "Palak Paneer with Roti",
          description: "Cottage cheese in spinach gravy with whole wheat flatbread. High in protein, iron, and calcium.",
          nutrition: { calories: 350, protein: 18, carbs: 35, fat: 15 }
        },
        {
          dishName: "Vegetable Biryani",
          description: "Fragrant rice dish cooked with mixed vegetables and aromatic spices. Balanced meal with complex carbohydrates.",
          nutrition: { calories: 380, protein: 12, carbs: 55, fat: 12 }
        },
        {
          dishName: "Dal Tadka with Rice",
          description: "Tempered lentil curry served with rice. Excellent source of plant protein and fiber.",
          nutrition: { calories: 320, protein: 14, carbs: 50, fat: 6 }
        }
      ],
      Snack: [
        {
          dishName: "Chana Chaat",
          description: "Spiced chickpea salad with tangy dressing. High in protein and fiber.",
          nutrition: { calories: 180, protein: 9, carbs: 25, fat: 5 }
        },
        {
          dishName: "Vegetable Dhokla",
          description: "Steamed fermented rice and chickpea flour cake with vegetables. Low-calorie protein-rich snack.",
          nutrition: { calories: 150, protein: 7, carbs: 20, fat: 4 }
        },
        {
          dishName: "Roasted Makhana",
          description: "Roasted lotus seeds seasoned with spices. Low-calorie, nutrient-dense snack.",
          nutrition: { calories: 120, protein: 4, carbs: 18, fat: 3 }
        }
      ],
      "Evening Snack": [
        {
          dishName: "Fruit Chaat",
          description: "Mixed fruit salad with spices and herbs. Rich in vitamins and natural sugars for energy.",
          nutrition: { calories: 130, protein: 2, carbs: 30, fat: 1 }
        },
        {
          dishName: "Sprouts Salad",
          description: "Mixed bean sprouts with vegetables and lemon dressing. High-protein, low-calorie option.",
          nutrition: { calories: 140, protein: 8, carbs: 20, fat: 2 }
        }
      ],
      "Mid-morning Snack": [
        {
          dishName: "Masala Buttermilk",
          description: "Spiced yogurt drink with digestive herbs. Probiotic-rich and refreshing.",
          nutrition: { calories: 80, protein: 5, carbs: 6, fat: 3 }
        },
        {
          dishName: "Multigrain Khakhra",
          description: "Thin crispy flatbread made with mixed grains. Rich in fiber and complex carbs.",
          nutrition: { calories: 120, protein: 3, carbs: 20, fat: 3 }
        }
      ]
    },
    "non-veg": {
      Breakfast: [
        {
          dishName: "Egg Bhurji with Paratha",
          description: "Spiced scrambled eggs with whole wheat flatbread. High protein and balanced carbs for sustained energy.",
          nutrition: { calories: 350, protein: 18, carbs: 30, fat: 16 }
        },
        {
          dishName: "Chicken Keema Paratha",
          description: "Flatbread stuffed with spiced minced chicken. Protein-rich breakfast option.",
          nutrition: { calories: 380, protein: 22, carbs: 35, fat: 15 }
        },
        {
          dishName: "Masala Omelette with Toast",
          description: "Spiced egg omelette with mixed vegetables and whole grain toast. Complete protein meal.",
          nutrition: { calories: 320, protein: 20, carbs: 25, fat: 14 }
        }
      ],
      Lunch: [
        {
          dishName: "Chicken Biryani",
          description: "Fragrant rice cooked with chicken and aromatic spices. Balanced meal with protein and complex carbs.",
          nutrition: { calories: 450, protein: 25, carbs: 50, fat: 15 }
        },
        {
          dishName: "Fish Curry with Rice",
          description: "Tangy fish curry served with steamed rice. Rich in lean protein and omega-3 fatty acids.",
          nutrition: { calories: 400, protein: 28, carbs: 45, fat: 12 }
        },
        {
          dishName: "Mutton Rogan Josh with Naan",
          description: "Slow-cooked lamb curry with aromatic spices, served with flatbread. Protein-rich meal.",
          nutrition: { calories: 480, protein: 30, carbs: 40, fat: 20 }
        }
      ],
      Dinner: [
        {
          dishName: "Tandoori Chicken with Mint Chutney",
          description: "Roasted marinated chicken with mint sauce. High-protein, low-carb dinner option.",
          nutrition: { calories: 320, protein: 35, carbs: 8, fat: 15 }
        },
        {
          dishName: "Egg Curry with Roti",
          description: "Eggs in a spiced tomato gravy served with whole wheat flatbread. Balanced protein meal.",
          nutrition: { calories: 380, protein: 22, carbs: 30, fat: 18 }
        },
        {
          dishName: "Chicken Tikka Masala with Jeera Rice",
          description: "Grilled chicken pieces in a creamy tomato sauce with cumin rice. Rich in protein and flavor.",
          nutrition: { calories: 420, protein: 28, carbs: 40, fat: 16 }
        }
      ],
      Snack: [
        {
          dishName: "Chicken Tikka",
          description: "Grilled marinated chicken pieces. High-protein, low-carb snack.",
          nutrition: { calories: 180, protein: 22, carbs: 3, fat: 8 }
        },
        {
          dishName: "Egg Roll",
          description: "Egg and vegetable wrap in whole wheat flatbread. Protein-rich on-the-go option.",
          nutrition: { calories: 220, protein: 12, carbs: 25, fat: 9 }
        },
        {
          dishName: "Spiced Grilled Fish",
          description: "Marinated fish fillets with herbs and spices. Lean protein source rich in omega-3.",
          nutrition: { calories: 160, protein: 28, carbs: 1, fat: 5 }
        }
      ],
      "Evening Snack": [
        {
          dishName: "Chicken Soup",
          description: "Clear chicken broth with vegetables. Low-calorie, protein-rich option.",
          nutrition: { calories: 120, protein: 15, carbs: 8, fat: 3 }
        },
        {
          dishName: "Egg Salad",
          description: "Boiled eggs with mixed vegetables and light dressing. High-protein, nutrient-dense snack.",
          nutrition: { calories: 150, protein: 12, carbs: 5, fat: 10 }
        }
      ],
      "Mid-morning Snack": [
        {
          dishName: "Boiled Eggs",
          description: "Simple boiled eggs with a sprinkle of spices. Pure protein source with essential nutrients.",
          nutrition: { calories: 140, protein: 12, carbs: 1, fat: 10 }
        },
        {
          dishName: "Chicken Sandwich",
          description: "Shredded chicken with vegetables in multigrain bread. Balanced protein and carbs.",
          nutrition: { calories: 220, protein: 18, carbs: 22, fat: 6 }
        }
      ]
    },
    vegan: {
      Breakfast: [
        {
          dishName: "Tofu Scramble",
          description: "Scrambled tofu with turmeric and vegetables, resembling egg bhurji. High in plant protein.",
          nutrition: { calories: 220, protein: 15, carbs: 12, fat: 14 }
        },
        {
          dishName: "Quinoa Upma",
          description: "Savory quinoa porridge with mixed vegetables. Complete protein with all essential amino acids.",
          nutrition: { calories: 260, protein: 10, carbs: 40, fat: 6 }
        },
        {
          dishName: "Oatmeal with Nuts and Seeds",
          description: "Oats cooked with plant milk, topped with mixed nuts and seeds. Rich in fiber and healthy fats.",
          nutrition: { calories: 280, protein: 12, carbs: 35, fat: 12 }
        }
      ],
      Lunch: [
        {
          dishName: "Chickpea Curry with Brown Rice",
          description: "Spiced chickpea curry served with brown rice. Excellent source of plant protein and fiber.",
          nutrition: { calories: 380, protein: 14, carbs: 65, fat: 7 }
        },
        {
          dishName: "Dal Tadka with Whole Wheat Roti",
          description: "Tempered lentil curry served with whole wheat flatbread. Protein-rich plant-based meal.",
          nutrition: { calories: 340, protein: 16, carbs: 50, fat: 6 }
        },
        {
          dishName: "Tofu and Vegetable Biryani",
          description: "Fragrant rice dish with tofu and mixed vegetables. Complete plant-based protein source.",
          nutrition: { calories: 400, protein: 18, carbs: 55, fat: 12 }
        }
      ],
      Dinner: [
        {
          dishName: "Lentil Soup with Multigrain Bread",
          description: "Hearty lentil soup served with multigrain bread. Rich in protein and fiber.",
          nutrition: { calories: 320, protein: 16, carbs: 40, fat: 8 }
        },
        {
          dishName: "Tofu Tikka Masala with Cauliflower Rice",
          description: "Tofu in a spiced tomato sauce with cauliflower rice. Lower-carb, high-protein option.",
          nutrition: { calories: 300, protein: 20, carbs: 20, fat: 16 }
        },
        {
          dishName: "Vegetable Thali with Millet Roti",
          description: "Assorted vegetables, dal, and millet flatbread. Balanced macro and micronutrients.",
          nutrition: { calories: 360, protein: 14, carbs: 50, fat: 10 }
        }
      ],
      Snack: [
        {
          dishName: "Roasted Chickpeas",
          description: "Crispy spiced chickpeas. High-protein, fiber-rich snack.",
          nutrition: { calories: 150, protein: 8, carbs: 20, fat: 5 }
        },
        {
          dishName: "Mixed Nuts and Seeds",
          description: "Assortment of nuts and seeds. Rich in healthy fats and plant protein.",
          nutrition: { calories: 180, protein: 7, carbs: 6, fat: 16 }
        },
        {
          dishName: "Vegetable Cutlets",
          description: "Spiced vegetable and lentil patties. Good source of fiber and plant protein.",
          nutrition: { calories: 140, protein: 6, carbs: 18, fat: 6 }
        }
      ],
      "Evening Snack": [
        {
          dishName: "Fruit Smoothie with Chia Seeds",
          description: "Blended fruits with plant milk and chia seeds. Rich in antioxidants and omega-3.",
          nutrition: { calories: 160, protein: 5, carbs: 25, fat: 5 }
        },
        {
          dishName: "Vegetable Soup",
          description: "Clear vegetable broth with mixed vegetables. Low-calorie, nutrient-dense option.",
          nutrition: { calories: 90, protein: 3, carbs: 15, fat: 2 }
        }
      ],
      "Mid-morning Snack": [
        {
          dishName: "Peanut Butter on Whole Grain Crackers",
          description: "Natural peanut butter on fiber-rich crackers. Good balance of protein and healthy fats.",
          nutrition: { calories: 170, protein: 6, carbs: 15, fat: 10 }
        },
        {
          dishName: "Green Smoothie",
          description: "Blend of leafy greens, fruits, and plant milk. Rich in vitamins and minerals.",
          nutrition: { calories: 120, protein: 4, carbs: 20, fat: 3 }
        }
      ]
    }
  };
  
  // Function to get a random meal from templates based on diet type and meal type
  const getRandomMeal = (mealType, day) => {
    const templates = mealTemplates[dietType] || mealTemplates["non-veg"];
    const mealOptions = templates[mealType] || templates["Snack"];
    
    // Select a different meal option based on the day to provide variety
    const index = day % mealOptions.length;
    return { ...mealOptions[index], type: mealType };
  };
  
  // Fill in any missing days up to planDuration
  for (let i = days.length + 1; i <= planDuration; i++) {
    // Determine which meals to include based on mealPerDay
    const mealTypes = [];
    
    // Always include main meals
    mealTypes.push("Breakfast");
    mealTypes.push("Lunch");
    mealTypes.push("Dinner");
    
    // Add additional meals if needed
    if (mealPerDay > 3) {
      mealTypes.push("Snack");
    }
    if (mealPerDay > 4) {
      mealTypes.push("Evening Snack");
    }
    if (mealPerDay > 5) {
      mealTypes.push("Mid-morning Snack");
    }
    
    // Create meals for this day
    const meals = mealTypes.map(mealType => getRandomMeal(mealType, i));
    
    // Create the day object
    const newDay = {
      dayNumber: i,
      meals: meals
    };
    
    days.push(newDay);
  }
  
  return days;
}

/**
 * Generate a meal plan using Google's Gemini API
 * @param {Object} params - User parameters for generating the meal plan
 * @throws {Error} Structured error object when API fails
 * @returns {Object} Generated meal plan data
 */
const generateMealPlan = async (params) => {
  if (!genAI) {
    throw new Error(JSON.stringify({
      code: 'GEMINI_NOT_INITIALIZED',
      message: 'Gemini API not initialized',
      details: 'The API key may be missing or invalid'
    }));
  }

  try {
    // Extract parameters
    const { 
      age, 
      weight, 
      height, 
      gender, 
      activityLevel, 
      goal, 
      planDuration,
      fitnessGoal,
      dietType,
      restrictionsAndAllergies,
      mealPerDay 
    } = params;
    
    // Load prompts from file
    const promptsPath = path.join(__dirname, '../../prompts/mealPlanPrompt.txt');
    let promptTemplate;
    
    try {
      promptTemplate = fs.readFileSync(promptsPath, 'utf8');
    } catch (readError) {
      console.error('Failed to read prompt template:', readError);
      throw new Error(JSON.stringify({
        code: 'PROMPT_READ_ERROR',
        message: 'Failed to read meal plan prompt template',
        details: readError.message
      }));
    }
    
    // Create the prompt with user parameters
    const prompt = promptTemplate
      .replace('{{age}}', age)
      .replace('{{weight}}', weight)
      .replace('{{height}}', height)
      .replace('{{gender}}', gender)
      .replace('{{activityLevel}}', activityLevel)
      .replace('{{goal}}', goal)
      .replace('{{planDuration}}', planDuration)
      .replace('{{fitnessGoal}}', fitnessGoal || goal)
      .replace('{{dietType}}', dietType || 'non-veg')
      .replace('{{restrictionsAndAllergies}}', restrictionsAndAllergies || 'None')
      .replace('{{mealPerDay}}', mealPerDay || 4);
      
    console.log('Sending prompt to Gemini API');
    
    // Get the generative model - Use Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Generate content
    console.log('Generating meal plan...');
    const startTime = Date.now();
    const result = await model.generateContent(prompt);
    const endTime = Date.now();
    console.log(`Generation took ${endTime - startTime}ms`);
    
    const response = result.response;
    const responseText = response.text();
    
    // Make sure we got a proper response
    if (!responseText) {
      console.error('Empty response from Gemini API');
      throw new Error(JSON.stringify({
        code: 'GEMINI_EMPTY_RESPONSE',
        message: 'Received empty response from Gemini API',
        details: 'The API returned an empty response'
      }));
    }
    
    console.log('Parsing response from Gemini API');
    
    let mealPlanData;
    try {
      // Remove markdown formatting if present (```json at the beginning and ``` at the end)
      let jsonText = responseText;
      if (jsonText.startsWith('```')) {
        // Extract everything between the first pair of ``` marks
        const matches = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (matches && matches[1]) {
          jsonText = matches[1].trim();
        } else {
          // Just remove the starting ``` if we can't find a matching end
          jsonText = jsonText.replace(/^```(?:json)?\s*/, '');
        }
      }
      
      console.log('Cleaned JSON text:', jsonText.substring(0, 100) + '...');
      mealPlanData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini API response:', parseError);
      console.log('Response text:', responseText.substring(0, 200) + '...');
      throw new Error(JSON.stringify({
        code: 'INVALID_JSON_RESPONSE',
        message: 'Failed to parse meal plan data from API response',
        details: parseError.message,
        rawResponse: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
      }));
    }
    
    // Validate meal plan data structure
    if (!mealPlanData || !mealPlanData.days || !Array.isArray(mealPlanData.days)) {
      console.error('Invalid meal plan structure:', mealPlanData);
      throw new Error(JSON.stringify({
        code: 'INVALID_MEAL_PLAN_STRUCTURE',
        message: 'API response missing required structure',
        details: 'The response is missing the "days" array',
        partialResponse: JSON.stringify(mealPlanData).substring(0, 500)
      }));
    }
    
    // Check if we have the right number of days
    if (mealPlanData.days.length < planDuration) {
      console.warn(`API returned only ${mealPlanData.days.length} days, expected ${planDuration}`);
      
      // Generate extra days if needed
      const completeDays = generateExtraDays(planDuration, mealPlanData.days, mealPerDay, dietType);
      mealPlanData.days = completeDays;
      
      // Add a warning to the response
      mealPlanData.warning = {
        code: 'INCOMPLETE_DAYS',
        message: `API returned only ${mealPlanData.days.length} days, extra days were generated programmatically`,
        details: `Expected ${planDuration} days but received ${mealPlanData.days.length}`
      };
    }
    
    // Validate each day has required meals in correct format
    mealPlanData.days.forEach((day, index) => {
      // Ensure meals is an array
      if (!day.meals || !Array.isArray(day.meals)) {
        console.warn(`Day ${day.dayNumber} has invalid meals format, correcting it`);
        
        // Create meals based on diet type and meals per day
        day.meals = [];
        
        // Determine which meals to include based on mealPerDay
        const mealTypes = [];
        mealTypes.push("Breakfast");
        mealTypes.push("Lunch");
        mealTypes.push("Dinner");
        
        if (mealPerDay > 3) mealTypes.push("Snack");
        if (mealPerDay > 4) mealTypes.push("Evening Snack");
        if (mealPerDay > 5) mealTypes.push("Mid-morning Snack");
        
        // Create meals for this day
        day.meals = mealTypes.map(mealType => getRandomMeal(mealType, day.dayNumber));
      } else {
        // Check if each meal has required properties
        day.meals.forEach((meal, mealIndex) => {
          if (!meal.type || !meal.dishName || !meal.description) {
            console.warn(`Day ${day.dayNumber}, Meal ${mealIndex} missing required properties`);
            
            // Determine meal type based on index if not specified
            const mealType = meal.type || ["Breakfast", "Lunch", "Dinner", "Snack"][mealIndex % 4];
            
            // Fill in missing properties using diet type specific templates
            const templateMeal = getRandomMeal(mealType, day.dayNumber);
            
            meal.type = meal.type || templateMeal.type;
            meal.dishName = meal.dishName || templateMeal.dishName;
            meal.description = meal.description || templateMeal.description;
            meal.nutrition = meal.nutrition || templateMeal.nutrition;
          }
        });
        
        // Check if we have enough meals for mealPerDay
        if (day.meals.length < mealPerDay) {
          // Determine what meal types we already have
          const existingTypes = day.meals.map(m => m.type);
          
          // Add missing meal types
          const allMealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Evening Snack", "Mid-morning Snack"];
          
          for (let i = 0; i < allMealTypes.length && day.meals.length < mealPerDay; i++) {
            if (!existingTypes.includes(allMealTypes[i])) {
              day.meals.push(getRandomMeal(allMealTypes[i], day.dayNumber));
            }
          }
        }
        
        // If we have more meals than needed, remove excess (preserving main meals)
        if (day.meals.length > mealPerDay) {
          // Prioritize keeping the main meals
          const mainMeals = day.meals.filter(m => ['Breakfast', 'Lunch', 'Dinner'].includes(m.type));
          const otherMeals = day.meals.filter(m => !['Breakfast', 'Lunch', 'Dinner'].includes(m.type));
          
          // Only keep enough other meals to meet mealPerDay
          day.meals = [...mainMeals, ...otherMeals.slice(0, Math.max(0, mealPerDay - mainMeals.length))];
        }
      }
    });
      
    return mealPlanData;
  } catch (error) {
    console.error('Error generating meal plan with Gemini API:', error);
    
    // If error is already structured, rethrow it
    if (error.message && error.message.startsWith('{') && error.message.endsWith('}')) {
      throw error;
    }
    
    // Otherwise, create a structured error
    throw new Error(JSON.stringify({
      code: 'GEMINI_API_ERROR',
      message: 'Failed to generate meal plan with Gemini API',
      details: error.message || 'Unknown error'
    }));
  }
};

/**
 * Generate a custom meal plan based on user input
 * @param {string} userSentence - The user's input sentence
 * @returns {Object} Generated meal plan data
 */
const customGeminiMealPlan = async (userSentence) => {
  if (!genAI) {
    throw new Error(JSON.stringify({
      code: 'GEMINI_NOT_INITIALIZED',
      message: 'Gemini API not initialized',
      details: 'The API key may be missing or invalid'
    }));
  }

  // --- Added here ---
  function safelyParseJson(responseText) {
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found');
    }
    const jsonSubstring = responseText.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonSubstring);
    } catch (error) {
      console.error('Failed to parse JSON:', error.message);
      throw error;
    }
  }
  // -------------------

  try {
    const promptsPath = path.join(__dirname, '../../prompts/customMealPrompt.txt');
    let promptTemplate = fs.readFileSync(promptsPath, 'utf8');
    
    const enhancedPrompt = `
    ${promptTemplate}
    
    USER REQUEST:
    "${userSentence}"
    
    IMPORTANT INSTRUCTIONS:
    1. ALWAYS return valid meal plan data in the required JSON format
    2. If you cannot fulfill exact requirements, provide the closest possible alternative
    3. Never return an error object - always return meal plan data
    4. For dietary restrictions you can't accommodate, note them in a 'notes' field
    5. If unsure about a dish's suitability, choose a safer alternative
    
    OUTPUT REQUIREMENTS:
    - Must be valid JSON with 'days' array
    - Each day must contain at least 3 meals
    - Include nutritional information for each meal

    END INSTRUCTION:
    - Your entire response MUST ONLY be the JSON. No pre-text, no post-text, no explanations, no markdown formatting, nothing except the JSON.
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    console.log('Generating custom meal plan...');
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error('Empty response from Gemini API');
    }
    
    // Directly use safelyParseJson to get clean JSON
    const mealPlanData = safelyParseJson(responseText);
    
    // Validate basic structure
    if (!mealPlanData.days || !Array.isArray(mealPlanData.days)) {
      throw new Error('Invalid meal plan structure - missing days array');
    }
    
    // Ensure minimum meal count
    mealPlanData.days.forEach(day => {
      if (!day.meals || day.meals.length < 3) {
        day.meals = day.meals || [];
        while (day.meals.length < 3) {
          day.meals.push({
            type: ["Breakfast", "Lunch", "Dinner"][day.meals.length],
            dishName: "Custom meal to be determined",
            description: "Will be customized based on your preferences",
            nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
          });
        }
      }
    });
    
    return mealPlanData;
    
  } catch (error) {
    console.error('Error in customGeminiMealPlan:', error);
    return {
      days: [],
      notes: ["Failed to generate complete plan: " + error.message],
      warning: "Partial response due to generation constraints"
    };
  }
};


module.exports = { 
  generateMealPlan,
  generateExtraDays,
  customGeminiMealPlan
}; 