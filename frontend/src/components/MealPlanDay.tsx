import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Info, Copy, MoreHorizontal, Edit, Trash2, Camera, AlertCircle } from 'lucide-react';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface NutrientValue {
  value: number;
  goal: number;
}

interface Nutrients {
  calories: NutrientValue;
  protein: NutrientValue;
  carbs: NutrientValue;
  fat: NutrientValue;
}

interface Food {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  type: MealType;
  name: string;
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface MealPlanDayProps {
  date: string;
  day: string;
  meals: Meal[];
  totalNutrients: Nutrients;
  onAddFood: (mealType: MealType) => void;
}

const MealPlanDay: React.FC<MealPlanDayProps> = ({
  date,
  day,
  meals,
  totalNutrients,
  onAddFood,
}) => {
  const [expandedMeals, setExpandedMeals] = useState<Record<MealType, boolean>>({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: false,
  });
  
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleMeal = (mealType: MealType) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const calculatePercentage = (value: number, goal: number) => {
    return Math.min(Math.round((value / goal) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'bg-blue-500';
    if (percentage < 90) return 'bg-green-500';
    if (percentage <= 100) return 'bg-green-600';
    return 'bg-red-500';
  };

  const getNutrientTooltip = (nutrient: string) => {
    switch(nutrient) {
      case 'calories':
        return 'Daily calorie target based on your metabolic rate and activity level';
      case 'protein':
        return 'Protein is essential for muscle repair and growth';
      case 'carbs':
        return 'Carbohydrates are your body\'s main source of energy';
      case 'fat':
        return 'Healthy fats are important for hormone production and cell health';
      default:
        return '';
    }
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast':
        return '🍳';
      case 'lunch':
        return '🥗';
      case 'dinner':
        return '🍽️';
      case 'snack':
        return '🍌';
      default:
        return '🍽️';
    }
  };

  // Calculate total daily values
  const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.totalProtein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.totalCarbs, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.totalFat, 0);
  
  // Calculate percentage of daily targets
  const caloriesPercentage = calculatePercentage(totalNutrients.calories.value, totalNutrients.calories.goal);
  const proteinPercentage = calculatePercentage(totalNutrients.protein.value, totalNutrients.protein.goal);
  const carbsPercentage = calculatePercentage(totalNutrients.carbs.value, totalNutrients.carbs.goal);
  const fatPercentage = calculatePercentage(totalNutrients.fat.value, totalNutrients.fat.goal);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with date and daily summary */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{day}</h2>
            <p className="text-sm text-gray-600">{date}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 rounded-lg transition-all duration-200" 
              aria-label="Take photo of meal"
              title="Take photo of meal"
            >
              <Camera size={18} />
            </button>
            <button 
              className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1.5 rounded-lg transition-all duration-200" 
              aria-label="Copy meal plan"
              title="Copy to tomorrow"
            >
              <Copy size={18} />
            </button>
          </div>
        </div>

        {/* Daily summary card */}
        <div className="mt-4 py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Daily Summary</h3>
            <div className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
              {totalCalories < totalNutrients.calories.goal * 0.9 ? 'Under target' : 
               totalCalories > totalNutrients.calories.goal * 1.1 ? 'Over target' : 'On track'}
            </div>
          </div>
          
          {/* Nutrient progress bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="col-span-1 md:col-span-2">
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Calories</span>
                  <div 
                    className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-pointer relative"
                    onMouseEnter={() => setActiveTooltip('calories')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <Info size={14} />
                    {activeTooltip === 'calories' && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {getNutrientTooltip('calories')}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {totalNutrients.calories.value} / {totalNutrients.calories.goal} kcal
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(caloriesPercentage)} rounded-full transition-all duration-300 ease-in-out`}
                  style={{
                    width: `${caloriesPercentage}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Protein</span>
                  <div 
                    className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-pointer relative"
                    onMouseEnter={() => setActiveTooltip('protein')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <Info size={14} />
                    {activeTooltip === 'protein' && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {getNutrientTooltip('protein')}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {totalNutrients.protein.value} / {totalNutrients.protein.goal}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(proteinPercentage)} rounded-full transition-all duration-300 ease-in-out`}
                  style={{
                    width: `${proteinPercentage}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Carbs</span>
                  <div 
                    className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-pointer relative"
                    onMouseEnter={() => setActiveTooltip('carbs')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <Info size={14} />
                    {activeTooltip === 'carbs' && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {getNutrientTooltip('carbs')}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {totalNutrients.carbs.value} / {totalNutrients.carbs.goal}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(carbsPercentage)} rounded-full transition-all duration-300 ease-in-out`}
                  style={{
                    width: `${carbsPercentage}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">Fat</span>
                  <div 
                    className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-pointer relative"
                    onMouseEnter={() => setActiveTooltip('fat')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    <Info size={14} />
                    {activeTooltip === 'fat' && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {getNutrientTooltip('fat')}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium">
                  {totalNutrients.fat.value} / {totalNutrients.fat.goal}g
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(fatPercentage)} rounded-full transition-all duration-300 ease-in-out`}
                  style={{
                    width: `${fatPercentage}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="divide-y divide-gray-100">
        {meals.map((meal) => (
          <div key={meal.type} className="bg-white">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleMeal(meal.type)}
            >
              <div className="flex items-center">
                <div className="h-10 w-10 flex items-center justify-center text-lg bg-green-50 rounded-lg mr-3">
                  {getMealIcon(meal.type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 capitalize">{meal.name}</h3>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500">{meal.totalCalories} kcal</p>
                    {meal.totalCalories === 0 && (
                      <div className="ml-2 flex items-center text-xs text-amber-600">
                        <AlertCircle size={12} className="mr-1" />
                        <span>Add food</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex mr-4 space-x-3">
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                      P: {meal.totalProtein}g
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                      C: {meal.totalCarbs}g
                    </div>
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                      F: {meal.totalFat}g
                    </div>
                  </div>
                  <div className="sm:hidden text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                    {meal.totalProtein}g / {meal.totalCarbs}g / {meal.totalFat}g
                  </div>
                </div>
                <button 
                  className="transition-transform duration-200 text-gray-400"
                  aria-label={expandedMeals[meal.type] ? "Collapse meal" : "Expand meal"}
                >
                  {expandedMeals[meal.type] ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {expandedMeals[meal.type] && (
              <div className="px-4 pb-4">
                {meal.foods.length === 0 ? (
                  <div className="py-6 flex flex-col items-center justify-center bg-gradient-to-r from-gray-50 to-white rounded-lg border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">No foods added yet</p>
                    <button
                      className="inline-flex items-center px-3.5 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                      onClick={() => onAddFood(meal.type)}
                    >
                      <Plus size={16} className="mr-1.5" />
                      Add Food
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between pt-2 pb-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="w-2/5">Food</div>
                      <div className="w-1/5 text-center">Amount</div>
                      <div className="w-1/5 text-center">Calories</div>
                      <div className="w-1/5 text-center sm:text-right">P / C / F</div>
                    </div>
                    
                    {meal.foods.map((food) => (
                      <div key={food.id} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 transition-all duration-200 group">
                        <div className="w-2/5 pr-4">
                          <p className="font-medium text-gray-800">{food.name}</p>
                        </div>
                        <div className="w-1/5 text-center text-sm text-gray-600">
                          {food.quantity} {food.unit}
                        </div>
                        <div className="w-1/5 text-center text-sm text-gray-600">
                          {food.calories} kcal
                        </div>
                        <div className="w-1/5 text-center sm:text-right text-sm text-gray-600 flex justify-end items-center">
                          <div className="flex space-x-1 mr-1.5">
                            <span>{food.protein}g</span>
                            <span>/</span>
                            <span>{food.carbs}g</span>
                            <span>/</span>
                            <span>{food.fat}g</span>
                          </div>
                          <div className="relative">
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full" aria-label="Food options">
                              <MoreHorizontal size={16} className="text-gray-500" />
                            </button>
                            {/* Dropdown menu could be added here */}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-3 flex justify-center">
                      <button
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        onClick={() => onAddFood(meal.type)}
                      >
                        <Plus size={16} className="mr-1" />
                        Add Food
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanDay; 