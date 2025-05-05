import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// === Type Definitions ===
type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  type: string;
  dishName: string;
  description: string;
  cookingMethod?: string;
  nutrition: Nutrition;
  keyIngredients?: string[];
  eaten: boolean;
};

type MealDay = {
  dayNumber: number;
  date?: string;
  meals: Meal[];
  notes?: string;
};

type MealPlan = {
  _id?: string;
  userId?: string;
  message?: string;
  days: MealDay[];
  notes?: string[];
  warnings?: string[];
  createdAt?: string;
};

const CalendarView: React.FC<{
    days: MealDay[];
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    selectedDayNumber: number | null;
    onDayNumberSelect: (dayNumber: number) => void;
  }> = ({ days, selectedDate, onDateSelect, selectedDayNumber, onDayNumberSelect }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
    // Get the start and end dates from the meal plan
    const startDate = days.length > 0 && days[0].date ? new Date(days[0].date) : new Date();
    const endDate = days.length > 0 ? 
      (days[days.length - 1].date ? new Date(days[days.length - 1].date!) : 
       new Date(startDate.getTime() + (days.length - 1) * 24 * 60 * 60 * 1000)) : 
      new Date();
  
    // Generate months between start and end dates
    const months = [];
    let current = new Date(startDate);
    current.setDate(1);
    
    while (current <= endDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
  
    // If no months in range, show current month
    if (months.length === 0) {
      months.push(new Date());
    }
  
    // Get completion status for a date
    const getDayStatus = (date: Date) => {
      const dateStr = date.toISOString().split('T')[0];
      const day = days.find(d => {
        if (d.date) {
          return new Date(d.date).toISOString().split('T')[0] === dateStr;
        }
        return false;
      });
      
      if (!day) return null;
      
      const totalMeals = day.meals.length;
      const eatenMeals = day.meals.filter(m => m.eaten).length;
      
      if (eatenMeals === 0) return 'missed';
      if (eatenMeals === totalMeals) return 'completed';
      return 'partial';
    };
  
    // Render a single month
    const renderMonth = (monthDate: Date) => {
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      
      // Get first day of month and total days
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Create array of days
      const daysArray = [];
      for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
      }
      
      // Check if day is in meal plan range
      const isDayInRange = (day: number) => {
        const date = new Date(year, month, day);
        return date >= startDate && date <= endDate;
      };
      
      // Get day status
      const getStatus = (day: number) => {
        const date = new Date(year, month, day);
        return getDayStatus(date);
      };
  
      // Get day number for a date
      const getDayNumber = (day: number) => {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const dayObj = days.find(d => {
          if (d.date) {
            return new Date(d.date).toISOString().split('T')[0] === dateStr;
          }
          return false;
        });
        return dayObj ? dayObj.dayNumber : null;
      };
  
      return (
        <div key={`${month}-${year}`} className="mb-8">
          <h3 className="text-lg font-semibold mb-2">
            {new Date(year, month).toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="font-medium text-sm py-1">{day}</div>
            ))}
            
            {Array(firstDay).fill(null).map((_, i) => (
              <div key={`empty-${i}`} className="py-1"></div>
            ))}
            
            {daysArray.map(day => {
              const date = new Date(year, month, day);
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              const dayNumber = getDayNumber(day);
              const isDayNumberSelected = selectedDayNumber === dayNumber;
              const status = getStatus(day);
              const inRange = isDayInRange(day);
              
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (inRange) {
                      onDateSelect(date);
                      if (dayNumber) {
                        onDayNumberSelect(dayNumber);
                      }
                    }
                  }}
                  className={`py-1 rounded-full text-sm ${
                    isSelected || isDayNumberSelected ? 'bg-blue-100 font-bold' : ''
                  } ${
                    inRange ? 'cursor-pointer hover:bg-gray-100' : 'text-gray-400 cursor-default'
                  } ${
                    status === 'completed' ? 'bg-green-100 text-green-800' :
                    status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'missed' ? 'bg-red-100 text-red-800' : ''
                  }`}
                  disabled={!inRange}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      );
    };
  
    return (
      <div className="bg-white rounded-lg shadow p-4 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Plan Calendar</h2>
        </div>
        
        <div className="space-y-6">
          {months.map(monthDate => renderMonth(monthDate))}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-2">Legend:</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 rounded-full mr-2"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 rounded-full mr-2"></div>
              <span>Partially completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-100 rounded-full mr-2"></div>
              <span>Missed</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  

const MealPlanner: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        const token = localStorage.getItem('neutroToken');
        const res = await axios.get('http://localhost:3000/api/meal-plan', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMealPlans(res.data.mealPlans || []);
      } catch (err) {
        setError('Failed to load meal plans');
      }
    };

    fetchMealPlans();
  }, []);

  // Set initial selected date when meal plans load
 // Set initial selected date when meal plans load
useEffect(() => {
  if (mealPlans.length > 0 && mealPlans[0].days.length > 0 && !selectedDayNumber) {
    const firstDay = mealPlans[0].days[0];
    const date = firstDay.date ? new Date(firstDay.date) : new Date();
    setSelectedDate(date);
    setSelectedDayNumber(firstDay.dayNumber);
  }
}, [mealPlans]);

  // Get current day based on selected day number
  const getCurrentDay = () => {
    if (!selectedDayNumber || mealPlans.length === 0) return null;
    return mealPlans[0].days.find(d => d.dayNumber === selectedDayNumber) || null;
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError('Please describe your dietary needs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:3000/api/custom-meal-plan', { 
        userSentence: userInput 
      });
      
      setMealPlans([res.data.mealPlan, ...mealPlans]);
      setUserInput('');
      setActiveTab('saved');
    } catch (err) {
      setError('Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await axios.delete(`http://localhost:3000/api/meal-plan/${planId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('neutroToken')}` }
        });
        setMealPlans(mealPlans.filter(plan => plan._id !== planId));
      } catch (err) {
        setError('Failed to delete meal plan');
      }
    }
  };

  const calculateDailyNutrition = (meals: Meal[]): Nutrition => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fat: acc.fat + meal.nutrition.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const calculateConsumedNutrition = (meals: Meal[]): Nutrition => {
    return meals
      .filter(meal => meal.eaten)
      .reduce((acc, meal) => ({
        calories: acc.calories + meal.nutrition.calories,
        protein: acc.protein + meal.nutrition.protein,
        carbs: acc.carbs + meal.nutrition.carbs,
        fat: acc.fat + meal.nutrition.fat
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const toggleMealEatenStatus = async (planId: string, dayNumber: number, mealType: string) => {
    try {
      const token = localStorage.getItem('neutroToken');
      const res = await axios.put(
        `http://localhost:3000/api/meal-plan/update-status`,
        { mealPlanId: planId, dayNumber, mealType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state to reflect the change while preserving the selected day
      setMealPlans(mealPlans.map(plan => {
        if (plan._id === planId) {
          return {
            ...plan,
            days: plan.days.map(day => {
              if (day.dayNumber === dayNumber) {
                return {
                  ...day,
                  meals: day.meals.map(meal => {
                    if (meal.type.toLowerCase() === mealType.toLowerCase()) {
                      return { ...meal, eaten: !meal.eaten };
                    }
                    return meal;
                  })
                };
              }
              return day;
            })
          };
        }
        return plan;
      }));

      toast.success('Meal status updated successfully!');
    } catch (error) {
      toast.error('Failed to update meal status');
      console.error('Error updating meal status:', error);
    }
  };

  const currentDay = getCurrentDay();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Mobile first, shows at top on small screens */}
        <div className="lg:w-1/3 space-y-6 order-1 lg:order-1">
          <div className="bg-white rounded-xl shadow p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Meal Planner</h1>
            
            <div className="flex border-b mb-4">
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'generate' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('generate')}
              >
                Generate New
              </button>
              
            </div>

            {activeTab === 'generate' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe your dietary needs
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={5}
                    placeholder="Example: 'I need a vegetarian meal plan for weight loss with 4 meals per day'"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Generating...' : 'Generate Meal Plan'}
                </button>

                {error && (
                  <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-700">Your Saved Plans</h3>
                {mealPlans.length === 0 ? (
                  <div className="text-gray-500 text-sm py-4">
                    No saved meal plans yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mealPlans.map((plan) => (
                      <div 
                        key={plan._id} 
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setMealPlans([plan, ...mealPlans.filter(p => p._id !== plan._id)]);
                          if (plan.days.length > 0) {
                            const firstDay = plan.days[0];
                            setSelectedDate(firstDay.date ? new Date(firstDay.date) : new Date());
                            setSelectedDayNumber(firstDay.dayNumber);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{plan.message || 'Custom Meal Plan'}</h4>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'Recently created'}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlan(plan._id!);
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {mealPlans.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-medium text-gray-700 mb-3">Nutrition Summary</h3>
              {mealPlans[0]?.days?.map(day => {
                const consumed = calculateConsumedNutrition(day.meals);
                const total = calculateDailyNutrition(day.meals);
                
                return (
                  <div key={day.dayNumber} className="mb-4 last:mb-0">
                    <div 
                      className="flex justify-between items-center cursor-pointer py-2"
                      onClick={() => {
                        setExpandedDay(expandedDay === day.dayNumber ? null : day.dayNumber);
                        setSelectedDayNumber(day.dayNumber);
                        if (day.date) {
                          setSelectedDate(new Date(day.date));
                        }
                      }}
                    >
                      <span className="font-medium">Day {day.dayNumber}</span>
                      <span className="text-sm text-gray-500">
                        {expandedDay === day.dayNumber ? 'Hide' : 'Show'} details
                      </span>
                    </div>
                    
                    {/* Daily Nutrition Progress */}
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Consumed: {consumed.calories} kcal</span>
                        <span>Total: {total.calories} kcal</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (consumed.calories / total.calories) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {expandedDay === day.dayNumber && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-green-800 font-medium">Protein</div>
                            <div>{consumed.protein}g / {total.protein}g</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <div className="text-yellow-800 font-medium">Carbs</div>
                            <div>{consumed.carbs}g / {total.carbs}g</div>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <div className="text-red-800 font-medium">Fat</div>
                            <div>{consumed.fat}g / {total.fat}g</div>
                          </div>
                        </div>
                        
                        <div className="pt-2 mt-2 border-t">
                          {day.meals.map((meal, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex justify-between">
                              <span className={`${meal.eaten ? 'line-through text-gray-400' : ''}`}>
                                {meal.type}: {meal.nutrition.calories} kcal
                              </span>
                              <span className="font-medium">
                                {meal.eaten ? '✓ Eaten' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Content - Middle on large screens, bottom on small screens */}
        <div className="lg:w-2/3 order-3 lg:order-2">
          {mealPlans.length > 0 ? (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {mealPlans[0].message || 'Your Custom Meal Plan'}
                    </h2>
                    {mealPlans[0].notes?.length && (
                      <p className="text-gray-600 mt-1">{mealPlans[0].notes.join(', ')}</p>
                    )}
                  </div>
                </div>

                {mealPlans[0].warnings?.length ? (
                  <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <div className="flex items-start">
                      <div>
                        <h4 className="font-medium text-yellow-800">Note</h4>
                        <ul className="text-yellow-700 text-sm list-disc pl-5 space-y-1 mt-1">
                          {mealPlans[0].warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {currentDay ? (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Day {currentDay.dayNumber}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                        {calculateConsumedNutrition(currentDay.meals).calories}/
                        {calculateDailyNutrition(currentDay.meals).calories} kcal
                      </div>
                      {currentDay.date && (
                        <span className="text-sm text-gray-500">
                          {new Date(currentDay.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentDay.meals.map((meal) => (
                      <div 
                        key={`${currentDay.dayNumber}-${meal.type}`} 
                        className={`border rounded-lg overflow-hidden ${meal.eaten ? 'bg-gray-50' : ''}`}
                      >
                        <div className={`px-4 py-3 border-b flex justify-between items-center ${meal.eaten ? 'bg-gray-100' : 'bg-gray-50'}`}>
                          <h4 className="font-medium text-gray-800 capitalize">
                            {meal.type}
                          </h4>
                          <button
                            onClick={() => toggleMealEatenStatus(mealPlans[0]._id!, currentDay.dayNumber, meal.type)}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              meal.eaten 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            {meal.eaten ? '✓ Eaten' : 'Mark as Eaten'}
                          </button>
                        </div>
                        <div className={`p-4 ${meal.eaten ? 'opacity-75' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className={`font-medium text-lg ${meal.eaten ? 'line-through' : ''}`}>
                                {meal.dishName}
                              </h5>
                              <p className="text-gray-600 mt-1">{meal.description}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              meal.eaten ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {meal.nutrition.calories} kcal
                            </div>
                          </div>

                          {meal.cookingMethod && (
                            <div className="mt-3">
                              <h6 className="text-sm font-medium text-gray-700">Cooking Method:</h6>
                              <p className="text-gray-600 text-sm mt-1">{meal.cookingMethod}</p>
                            </div>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <h6 className="text-sm font-medium text-gray-700 mb-1">Nutrition</h6>
                              <div className="flex flex-wrap gap-2">
                                <div className="bg-green-50 text-green-800 px-2 py-1 rounded text-xs">
                                  Protein: {meal.nutrition.protein}g
                                </div>
                                <div className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-xs">
                                  Carbs: {meal.nutrition.carbs}g
                                </div>
                                <div className="bg-red-50 text-red-800 px-2 py-1 rounded text-xs">
                                  Fat: {meal.nutrition.fat}g
                                </div>
                              </div>
                            </div>

                            {meal.keyIngredients?.length ? (
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Key Ingredients</h6>
                                <div className="flex flex-wrap gap-1">
                                  {meal.keyIngredients.map((ingredient, i) => (
                                    <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Daily Nutrition Summary */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Daily Nutrition Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Calories</span>
                          <span>{calculateConsumedNutrition(currentDay.meals).calories} / {calculateDailyNutrition(currentDay.meals).calories}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (calculateConsumedNutrition(currentDay.meals).calories / calculateDailyNutrition(currentDay.meals).calories) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Protein</span>
                          <span>{calculateConsumedNutrition(currentDay.meals).protein}g / {calculateDailyNutrition(currentDay.meals).protein}g</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (calculateConsumedNutrition(currentDay.meals).protein / calculateDailyNutrition(currentDay.meals).protein) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Carbs</span>
                          <span>{calculateConsumedNutrition(currentDay.meals).carbs}g / {calculateDailyNutrition(currentDay.meals).carbs}g</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (calculateConsumedNutrition(currentDay.meals).carbs / calculateDailyNutrition(currentDay.meals).carbs) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Fat</span>
                          <span>{calculateConsumedNutrition(currentDay.meals).fat}g / {calculateDailyNutrition(currentDay.meals).fat}g</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (calculateConsumedNutrition(currentDay.meals).fat / calculateDailyNutrition(currentDay.meals).fat) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No day selected or no meals available for the selected day.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Meal Plans Yet</h3>
                <p className="text-gray-500 mb-4">
                  {activeTab === 'generate' 
                    ? 'Describe your dietary needs to generate your first meal plan' 
                    : 'Your saved meal plans will appear here'}
                </p>
                {activeTab === 'saved' && (
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Generate a new meal plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Calendar - Shows at bottom on mobile, right on larger screens */}
        <div className="lg:w-1/4 order-2 lg:order-3">
          <CalendarView 
            days={mealPlans.length > 0 ? mealPlans[0].days : []}
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              // Find the day that matches this date
              if (mealPlans.length > 0) {
                const dateStr = date.toISOString().split('T')[0];
                const day = mealPlans[0].days.find(d => {
                  if (d.date) {
                    return new Date(d.date).toISOString().split('T')[0] === dateStr;
                  }
                  return false;
                });
                if (day) {
                  setSelectedDayNumber(day.dayNumber);
                }
              }
            }}
            selectedDayNumber={selectedDayNumber}
            onDayNumberSelect={(dayNumber) => {
              setSelectedDayNumber(dayNumber);
              // Find the date for this day number
              if (mealPlans.length > 0) {
                const day = mealPlans[0].days.find(d => d.dayNumber === dayNumber);
                if (day && day.date) {
                  setSelectedDate(new Date(day.date));
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MealPlanner;