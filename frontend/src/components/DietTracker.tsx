import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Utensils, Calendar, Loader, RefreshCcw, CheckCircle, XCircle, ChevronRight, Award, Activity, TrendingUp, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Constants for API configuration
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 15000; // 15 seconds

type DietPlans = {
  _id: string;
  planName: string;
  status: string;
  dailyCalories: number;
  planDuration: number;
};

interface DietTracker {
  _id: string;
  userId: string;
  dietPlanId: string;
  startDate: string;
  status: 'active' | 'completed' | 'abandoned';
  currentDay: number;
  totalDays: number;
  overallCompletionPercentage: number;
  streak: number;
  adherenceScore: number;
  dailyTrackers: Array<{
    _id: string;
    date: string;
    dayNumber: number;
    completedMeals: number;
    totalMeals: number;
    completionPercentage: number;
    caloriesConsumed: number;
    targetCalories: number;
    nutrition: {
      protein: {
        consumed: number;
        target: number;
      };
      carbs: {
        consumed: number;
        target: number;
      };
      fat: {
        consumed: number;
        target: number;
      };
    };
  }>;
}

interface DietPlan {
  _id: string;
  planName: string;
  // Add more fields if needed, e.g., dailyCalories, days, etc.
}

interface CurrentDayPlan {
  dayNumber: number;
  meals: Array<{
    _id: string;
    type: string;
    dishName: string;
    description: string;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    eaten: boolean;
  }>;
}

type Nutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  _id: string;
  type: string;
  dishName: string;
  description: string;
  nutrition: Nutrition;
  eaten: boolean;
};

type Day = {
  dayNumber: number;
  meals: Meal[];
  _id: string;
};

type DietplanssType = {
  _id: string;
  userId: string;
  planName: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
  activityLevel: string;
  goal: string;
  foodType: string;
  planDuration: number;
  dailyCalories: number;
  dailyMacros: Nutrition;
  status: string;
  days: Day[];
  createdAt: string; // Add this line
  __v?: number; // You might want to add this too since it's in your response
};

interface EatenMark {
  dayNumber: number;
  meals: {
    eaten: boolean;
  }[];
}

// Add this interface near your other interfaces
interface MealReminder {
  id: number;
  message: string;
  time: string; // in HH:MM format (24-hour)
}

const DietTrackerComponent: React.FC = () => {
  const navigate = useNavigate();
  const [dietTracker, setDietTracker] = useState<DietTracker | null>(null);
  const [currentDayPlan, setCurrentDayPlan] = useState<CurrentDayPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingTracker, setIsCreatingTracker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [Dietplanss, setDietplanss] = useState<DietplanssType[]>([]);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [eatenCompletedDays, setEatenCompletedDays] = useState<number[]>([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/diet-plans`)
      .then(response => {
        setPlans(response.data.dietPlans);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching diet plans:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const fetchEatenCompletion = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/diet-plans');
        const data = await response.json();
        const plan = data.dietPlans?.[0]; // adjust if needed
        console.log("Fetched Plan:", plan);
        if (plan) {
          const totalDays = plan.planDuration || plan.days.length;
  
          const completedDayNumbers: number[] = [];
  
          for (let dayNumber = 1; dayNumber <= totalDays; dayNumber++) {
            const dayResponse = await fetch(`${API_BASE_URL}/diet-plans/days/${dayNumber}`);
            const dayData = await dayResponse.json();
            const day: EatenMark = dayData.day; // assuming API returns { day: {...} }
  
            if (day?.meals && day.meals.length > 0) {
              const allEatenTrue = day.meals.every((meal) => meal.eaten);
              if (allEatenTrue) {
                completedDayNumbers.push(day.dayNumber);
              }
            }
          }

          plan.days.forEach((day: Day) => {
            if (day.meals && day.meals.length > 0) {
              const allEaten = day.meals.every(meal => meal.eaten);
              if (allEaten) {
                completedDayNumbers.push(day.dayNumber);
              }
            }
          });
  
          setEatenCompletedDays(completedDayNumbers);
        }
      } catch (error) {
        console.error('Error fetching eaten completion days:', error);
      }
    };
  
    fetchEatenCompletion();
  }, []);

   // Add this useEffect hook near your other useEffect hooks
   useEffect(() => {
    if (dietTracker) { // Only set up reminders if user has an active tracker
      setupMealReminders();
    }
  }, [dietTracker]);

  useEffect(() => {
    if (Dietplanss.length && Dietplanss[0]?.createdAt) {
      const planStartDate = new Date(Dietplanss[0].createdAt);
      // Create a date-only version (ignoring time)
      const planStartDateOnly = new Date(
        planStartDate.getFullYear(),
        planStartDate.getMonth(),
        planStartDate.getDate()
      );
      setCurrentMonth(new Date(planStartDateOnly));
    }
  }, [Dietplanss]);

  useEffect(() => {
    // Check for token
    const token = localStorage.getItem('neutroToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch active diet tracker
    fetchActiveDietTracker();
  }, [navigate]);

  useEffect(() => {
    const fetchDietplanss = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/diet-plans`);
        console.log("Axios Response:", res.data);
        setDietplanss(res.data.dietPlans || []);
      } catch (err) {
        console.error("Axios error getting Dietplanss:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDietplanss();
  }, []);


  const handleDelete = async (planId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this plan?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/diet-plans/${planId}`);
      setDietplanss((prev) => prev.filter((plan) => plan._id !== planId));
    } catch (err) {
      console.error("Error deleting diet plan:", err);
    }
  };

  const isDayComplete = (dayNumber: number) => {
    if (!dietTracker) return false;
    const dayTracker = dietTracker.dailyTrackers.find(dt => dt.dayNumber === dayNumber);
    return dayTracker?.completionPercentage === 100;
  };

  const calculateCurrentNutrition = () => {
    if (!currentDayPlan) return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    return currentDayPlan.meals.reduce((acc, meal) => {
      if (meal.eaten) {
        acc.calories += meal.nutrition.calories;
        acc.protein += meal.nutrition.protein;
        acc.carbs += meal.nutrition.carbs;
        acc.fat += meal.nutrition.fat;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };
  
  const fetchActiveDietTracker = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      const response = await axios.get(`${API_BASE_URL}/diet-trackers/active`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      setDietTracker(response.data.dietTracker);
      setCurrentDayPlan(response.data.currentDayPlan);
      setSelectedDay(response.data.dietTracker.currentDay);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        // No active tracker found
        console.log('No active diet tracker found');
        setDietTracker(null);
        setCurrentDayPlan(null);
        // We'll show option to create a tracker
      } else {
        handleApiError(err, 'Error fetching active diet tracker');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDayPlanDetails = async (dayNumber: number) => {
    if (!dietTracker) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // First get the day details from the diet plan
      const response = await axios.get(`${API_BASE_URL}/diet-plans/days/${dayNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      setCurrentDayPlan(response.data.day);
      setSelectedDay(dayNumber);
    } catch (err: any) {
      handleApiError(err, `Error fetching day ${dayNumber} details`);
    } finally {
      setLoading(false);
    }
  };

  const createTrackerForLatestPlan = async () => {
    setIsCreatingTracker(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // First get the latest diet plan
      const planResponse = await axios.get(`${API_BASE_URL}/diet-plans/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      const dietPlanId = planResponse.data._id;
      
      // Create a tracker for this plan
      const trackerResponse = await axios.post(
        `${API_BASE_URL}/diet-trackers`,
        { dietPlanId },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: API_TIMEOUT
        }
      );
      
      setDietTracker(trackerResponse.data.dietTracker);
      setSuccessMessage('Diet tracker created successfully!');
      
      // Get the day 1 details
      await fetchDayPlanDetails(1);
    } catch (err: any) {
      handleApiError(err, 'Error creating diet tracker');
    } finally {
      setIsCreatingTracker(false);
    }
  };

  const renderCalendarCell = (date: Date, index: number) => {
    if (!Dietplanss.length || !Dietplanss[0]?.createdAt) {
      return (
        <div key={index} className="h-8 flex items-center justify-center rounded-lg text-sm text-gray-300">
          {date.getDate()}
        </div>
      );
    }
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const planStartDate = new Date(Dietplanss[0].createdAt);
    const planStartDateOnly = new Date(
      planStartDate.getFullYear(),
      planStartDate.getMonth(),
      planStartDate.getDate()
    );
    const dayNumber = getDayNumberForDate(dateOnly);
    const isInMealPlan = isDateInMealPlan(dateOnly);
    const isToday = dateOnly.toDateString() === new Date().toDateString();
    const dayTracker = dietTracker?.dailyTrackers.find(dt => dt.dayNumber === dayNumber);
    
    const isAllEaten = dayNumber !== null && eatenCompletedDays.includes(dayNumber);
    const dayPlan = Dietplanss[0]?.days.find(d => d.dayNumber === dayNumber);
    const someEaten = dayPlan?.meals.some(meal => meal.eaten) && !isAllEaten;


    let status = '';
    if (dayTracker) {
      if (dayTracker.completionPercentage === 100) status = 'completed';
      else if (dayTracker.completionPercentage > 0) status = 'partial';
      else if (dayTracker.completionPercentage === 0 && date < new Date()) status = 'missed';
    }  else if (isAllEaten) {
      // If no tracker but diet plan says fully eaten
      status = 'completed';
    }

    return (
      <button
        key={index}
        onClick={() => dayNumber && fetchDayPlanDetails(dayNumber)}
        disabled={!isInMealPlan}
        className={`h-8 flex items-center justify-center rounded-lg text-sm relative ${
          !isInMealPlan
          ? 'text-gray-300'
          : selectedDay === dayNumber
            ? 'bg-purple-200 text-purple-700 font-medium'
            : isAllEaten
              ? 'bg-green-300 text-black'
              : someEaten
                ? 'bg-yellow-100 text-yellow-700'
                : date < planStartDate
                ? 'bg-red-100 text-red-700'
                  : isToday
                    ? 'bg-purple-100 text-purple-700'
                    : 'hover:bg-gray-100'
        }`}
      >
        {date.getDate()}
        {/* Green dot indicator for complete days */}
        {isAllEaten && (
          <span className="absolute bottom-1 w-2 h-2 rounded-full bg-green-500"></span>
        )}
      </button>
    );
  };

  const handleMealStatusUpdate = async (mealId: string, eaten: boolean) => {
    if (!dietTracker || !currentDayPlan) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      // Optimistically update the UI
      setCurrentDayPlan(prevDayPlan => {
        if (!prevDayPlan) return null;
        
        const updatedMeals = prevDayPlan.meals.map(meal => {
          if (meal._id === mealId) {
            return { ...meal, eaten };
          }
          return meal;
        });

        const allEaten = updatedMeals.every(meal => meal.eaten);
        if (allEaten) {
          // Update completed days state if needed
          setEatenCompletedDays(prev => [...prev, prevDayPlan.dayNumber]);
        }
        
        return {
          ...prevDayPlan,
          meals: updatedMeals
        };
      });
      
      setSuccessMessage(`Meal marked as ${eaten ? 'eaten' : 'not eaten'}. Don't forget to submit!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      handleApiError(err, 'Error updating meal status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const submitDailyProgress = async () => {
    if (!dietTracker || !currentDayPlan) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      // Log the meals we're about to send
      console.log("Current day meals:", currentDayPlan.meals);
      
      // Process each meal in the current day for the tracker
      const mealUpdates = currentDayPlan.meals.map(meal => {
        if (!meal._id) {
          console.error('Meal is missing ID:', meal);
          return Promise.reject(new Error('Meal is missing ID'));
        }
  
        return axios.post(
          `${API_BASE_URL}/diet-trackers/track-meal`,
          {
            trackerId: dietTracker._id,
            dayNumber: currentDayPlan.dayNumber,
            mealId: meal._id,
            eaten: meal.eaten
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: API_TIMEOUT
          }
        ).catch(err => {
          console.error(`Failed to update meal ${meal._id}:`, err.response?.data || err.message);
          return Promise.reject(err);
        });
      });
      
      // Execute all meal updates with better error handling
      const results = await Promise.allSettled(mealUpdates);
      
      // Check for failures
      const failedUpdates = results.filter(r => r.status === 'rejected');
      if (failedUpdates.length > 0) {
        console.error('Some meal updates failed:', failedUpdates);
        throw new Error(`${failedUpdates.length} meal updates failed`);
      }
      
      // All succeeded
      const successfulUpdates = results.filter(r => r.status === 'fulfilled');
      const lastResult = successfulUpdates[successfulUpdates.length - 1].value.data;
      
      setDietTracker(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          overallCompletionPercentage: lastResult.dietTracker.overallCompletionPercentage,
          streak: lastResult.dietTracker.streak,
          adherenceScore: lastResult.dietTracker.adherenceScore,
          dailyTrackers: lastResult.dietTracker.dailyTrackers
        };
      });
      
      setSuccessMessage('Daily progress saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (err) {
      console.error('Error in submitDailyProgress:', err);
      handleApiError(err, 'Error submitting daily progress');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleApiError = (err: any, defaultMsg: string) => {
    console.error(defaultMsg, err);
    
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      setError('Request timed out. Please try again.');
      return;
    }
    
    if (err.response) {
      const status = err.response.status;
      const errorData = err.response.data;
      
      if (status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      if (errorData.error?.details) {
        setError(errorData.error.details);
      } else if (errorData.message) {
        setError(errorData.message);
      } else {
        setError(defaultMsg);
      }
    } else if (err.request) {
      setError('No response from server. Please check your internet connection.');
    } else {
      setError(err.message || defaultMsg);
    }
  };

  // Calculate the completion percentages for a day's nutrition
  const getDailyNutritionProgress = (dayTracker: DietTracker['dailyTrackers'][0]) => {
    return {
      calories: Math.round((dayTracker.caloriesConsumed / dayTracker.targetCalories) * 100),
      protein: Math.round((dayTracker.nutrition.protein.consumed / dayTracker.nutrition.protein.target) * 100),
      carbs: Math.round((dayTracker.nutrition.carbs.consumed / dayTracker.nutrition.carbs.target) * 100),
      fat: Math.round((dayTracker.nutrition.fat.consumed / dayTracker.nutrition.fat.target) * 100)
    };
  };

  const getCurrentDayTracker = () => {
    if (!dietTracker || !selectedDay || !currentDayPlan) return null;
    
    // Find existing day tracker or create default one
    let dayTracker = dietTracker.dailyTrackers.find(dt => dt.dayNumber === selectedDay);
    
    // Calculate current values from the meal plan
    const currentNutrition = calculateCurrentNutrition();
    const eatenMealsCount = currentDayPlan.meals.filter(m => m.eaten).length;
    const totalMeals = currentDayPlan.meals.length;
    const completionPercentage = Math.round((eatenMealsCount / totalMeals) * 100);
    
    // If we have a day tracker, merge with current values
    if (dayTracker) {
      return {
        ...dayTracker,
        completedMeals: eatenMealsCount,
        totalMeals: totalMeals,
        completionPercentage: completionPercentage,
        caloriesConsumed: currentNutrition.calories,
        nutrition: {
          protein: {
            consumed: currentNutrition.protein,
            target: dayTracker.nutrition.protein.target
          },
          carbs: {
            consumed: currentNutrition.carbs,
            target: dayTracker.nutrition.carbs.target
          },
          fat: {
            consumed: currentNutrition.fat,
            target: dayTracker.nutrition.fat.target
          }
        }
      };
    }
    
    // No existing tracker - create a new one with current values
    return {
      _id: '',
      date: new Date().toISOString(),
      dayNumber: selectedDay,
      completedMeals: eatenMealsCount,
      totalMeals: totalMeals,
      completionPercentage: completionPercentage,
      caloriesConsumed: currentNutrition.calories,
      targetCalories: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.calories, 0),
      nutrition: {
        protein: {
          consumed: currentNutrition.protein,
          target: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.protein, 0)
        },
        carbs: {
          consumed: currentNutrition.carbs,
          target: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.carbs, 0)
        },
        fat: {
          consumed: currentNutrition.fat,
          target: currentDayPlan.meals.reduce((sum, meal) => sum + meal.nutrition.fat, 0)
        }
      }
    };
  };

  // Add this helper function near your other utility functions
const getDateForDay = (startDate: string, dayNumber: number) => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + (dayNumber - 1)); // Subtract 1 since dayNumber starts at 1
  return date;
};

// Format date as short string (e.g., "Mon, Jun 5")
const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};
  
const MEAL_REMINDERS: MealReminder[] = [
  { id: 1, message: "🍳 Time for your breakfast! Don't skip the most important meal of the day.", time: "8:00" },
  { id: 2, message: "🥗 Your lunch time is now! Stay consistent with your diet plan.", time: "13:00" },
  { id: 3, message: "🍗 Dinner time! Complete your daily nutrition goals.", time: "20:00" }
];

  // Helper function to get status color
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Add these helper functions after the existing utility functions
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Add these functions after the existing functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isDateInMealPlan = (date: Date) => {
    if (!Dietplanss.length || !Dietplanss[0]?.createdAt || !Dietplanss[0]?.planDuration) return false;
  
    // Create a date-only version of the start date (ignoring time)
    const startDate = new Date(Dietplanss[0].createdAt);
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    // Create date-only version of the input date
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calculate end date (start date + duration - 1 day)
    const endDate = new Date(startDateOnly);
    endDate.setDate(endDate.getDate() + (Dietplanss[0].planDuration - 1));
    
    return dateOnly >= startDateOnly && dateOnly <= endDate;
  };

  const getDayNumberForDate = (date: Date) => {
    if (!Dietplanss.length || !Dietplanss[0]?.createdAt || !Dietplanss[0]?.planDuration) return null;
    
    // Create date-only versions for comparison
    const startDate = new Date(Dietplanss[0].createdAt);
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = dateOnly.getTime() - startDateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays > 0 && diffDays <= Dietplanss[0].planDuration ? diffDays : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your diet tracker...</p>
        </div>
      </div>
    );
  }

  // No active tracker - offer to create one
  if (!dietTracker) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 max-w-4xl mx-auto">
        <div className="text-center">
          <Activity className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Track Your Diet Progress</h2>
          <p className="text-gray-600 mb-6">
            You don't have an active diet tracker. Create a tracker to monitor your progress and adherence to your meal plan.
          </p>
          
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <button
            onClick={createTrackerForLatestPlan}
            disabled={isCreatingTracker}
            className={`px-6 py-3 rounded-md text-white font-medium ${
              isCreatingTracker ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
            } transition-colors flex items-center mx-auto`}
          >
            {isCreatingTracker ? (
              <>
                <Loader className="animate-spin mr-2 h-5 w-5" />
                Creating Tracker...
              </>
            ) : (
              <>
                Start Tracking My Diet
                <ChevronRight className="ml-1 h-5 w-5" />
              </>
            )}
          </button>
          
          <p className="mt-4 text-sm text-gray-500">
            This will create a tracker for your latest diet plan. You need to have an active diet plan first.
          </p>
        </div>
      </div>
    );
  }
  

  const currentDayTracker = getCurrentDayTracker();
  
  const setupMealReminders = () => {
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(now.getTime() + offset);
    const currentHours = istTime.getUTCHours();
    const currentMinutes = istTime.getUTCMinutes();
    const currentTimeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
  
    // Check each reminder
    MEAL_REMINDERS.forEach(reminder => {
      // Only show if it's the exact time and we haven't shown it today
      if (reminder.time === currentTimeString) {
        const lastShown = localStorage.getItem(`lastShown_${reminder.id}`);
        const today = new Date().toDateString();
        
        if (!lastShown || lastShown !== today) {
          toast.info(reminder.message, {
            position: "top-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          localStorage.setItem(`lastShown_${reminder.id}`, today);
        }
      }
    });
  
    // Check again in 1 minute
    setTimeout(setupMealReminders, 60000);
  };
  
 
  
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-xl p-4">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
        {plans.map(plan => (
            <span key={plan._id} className="font-medium gap-2">{plan.planName}</span>
        ))}
        </h1>
        <p className="text-green-100 text-sm">
          Track your meals and monitor your progress
        </p>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow-sm flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

<div className="max-w-7xl mx-auto p-6">
  <h1 className="text-2xl font-bold mb-6">Your Dietplanss</h1>

  <div className="flex flex-col lg:flex-row gap-6">
    {/* Dietplans Section */}
    <div className="flex-1">
      {Dietplanss.map((plan) => (
        <div key={plan._id} className="border border-gray-300 p-4 rounded-xl shadow mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">{plan.planName}</h2>
            <button
              onClick={() => handleDelete(plan._id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {plan.dailyCalories} calories/day • {plan.planDuration} days • Goal: {plan.goal}
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>Protein: {plan.dailyMacros.protein}g</div>
            <div>Carbs: {plan.dailyMacros.carbs}g</div>
            <div>Fat: {plan.dailyMacros.fat}g</div>
          </div>
        </div>
      ))}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {loading ? (
              <div className="p-6 text-center">
                <Loader className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading your meal data...</p>
              </div>
            ) : currentDayPlan && dietTracker ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  {/* <h2 className="text-xl font-bold flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-500" />
                    {formatShortDate(getDateForDay(dietTracker.startDate, currentDayPlan.dayNumber))}
                  </h2> */}
                  
                  {currentDayTracker && (
                    <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                      {currentDayTracker.completionPercentage}% Complete
                    </span>
                  )}
                </div>
                
                {/* Nutrition progress for the day */}
                {currentDayTracker && (
                  <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Daily Nutrition Progress</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Calories</span>
                          <span className="text-sm font-medium text-gray-700">
                            {currentDayTracker.caloriesConsumed} / {currentDayTracker.targetCalories} kcal
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${getStatusColor(getDailyNutritionProgress(currentDayTracker).calories)}`} 
                            style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).calories, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Protein</span>
                            <span className="text-sm font-medium text-gray-700">
                              {currentDayTracker.nutrition.protein.consumed}g / {currentDayTracker.nutrition.protein.target}g
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full bg-blue-600" 
                              style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).protein, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Carbs</span>
                            <span className="text-sm font-medium text-gray-700">
                              {currentDayTracker.nutrition.carbs.consumed}g / {currentDayTracker.nutrition.carbs.target}g
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full bg-yellow-500" 
                              style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).carbs, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Fat</span>
                            <span className="text-sm font-medium text-gray-700">
                              {currentDayTracker.nutrition.fat.consumed}g / {currentDayTracker.nutrition.fat.target}g
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full bg-green-600" 
                              style={{ width: `${Math.min(getDailyNutritionProgress(currentDayTracker).fat, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Meals list */}
                <div className="space-y-4">
                  {currentDayPlan.meals.map((meal) => (
                    <div key={meal._id} className="border rounded-lg overflow-hidden shadow-sm">
                      <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="font-medium text-gray-800 flex items-center">
                          <Utensils className="h-4 w-4 mr-2 text-green-500" />
                          {meal.type}
                        </h3>
                        <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          {meal.nutrition.calories} kcal
                        </span>
                      </div>
                      
                      <div className="p-5">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-lg mb-2 text-gray-800">{meal.dishName}</h4>
                          <div className="flex">
                            <button
                              onClick={() => handleMealStatusUpdate(meal._id, true)}
                              disabled={updateLoading || meal.eaten === true}
                              className={`p-2 rounded-full mr-1 ${
                                meal.eaten === true
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-600'
                              }`}
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleMealStatusUpdate(meal._id, false)}
                              disabled={updateLoading || meal.eaten === false}
                              className={`p-2 rounded-full ${
                                meal.eaten === false
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600'
                              }`}
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 text-sm">{meal.description}</p>
                        
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div className="text-center p-3 bg-blue-50 rounded-md border border-blue-100">
                            <span className="block text-xs font-medium text-blue-700 mb-1">Protein</span>
                            <span className="block font-bold text-lg text-blue-800">{meal.nutrition.protein}g</span>
                          </div>
                          <div className="text-center p-3 bg-yellow-50 rounded-md border border-yellow-100">
                            <span className="block text-xs font-medium text-yellow-700 mb-1">Carbs</span>
                            <span className="block font-bold text-lg text-yellow-800">{meal.nutrition.carbs}g</span>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-md border border-green-100">
                            <span className="block text-xs font-medium text-green-700 mb-1">Fat</span>
                            <span className="block font-bold text-lg text-green-800">{meal.nutrition.fat}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit button for saving all meal updates */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={submitDailyProgress}
                    disabled={updateLoading}
                    className={`px-6 py-3 rounded-lg text-white font-medium flex items-center ${
                      updateLoading 
                        ? 'bg-green-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all'
                    }`}
                  >
                    {updateLoading ? (
                      <>
                        <Loader className="animate-spin mr-2 h-5 w-5" />
                        Saving Progress...
                      </>
                    ) : (
                      <>
                        Save Daily Progress
                      </>
                    )}
                  </button>
                </div>

                {/* Success/Error messages */}
                {successMessage && (
                  <div className="mt-4 bg-green-50 text-green-700 p-4 rounded-lg flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}
                
                {updateError && (
                  <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{updateError}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <RefreshCcw className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No meal data available</h3>
                <p className="text-gray-600 mb-4">
                  There was a problem fetching your meal data for this day.
                </p>
                <button
                  onClick={() => fetchDayPlanDetails(selectedDay || 1)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
    </div>

    {/* Calendar Section */}
    <div className="w-full lg:w-[350px]">
      <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
        <h2 className="text-xl font-bold mb-4">Plan Calendar</h2>

        {/* Month navigation */}
        <div className="bg-white rounded-lg mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-base font-medium text-gray-900">
              {getMonthName(currentMonth)}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-1 text-xs sm:text-sm">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
              <div key={`empty-${index}`} className="h-8" />
            ))}
            {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1);
              return renderCalendarCell(date, index);
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Legend:</p>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
              <span className="text-sm text-gray-600">Partially completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
              <span className="text-sm text-gray-600">Missed</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

      
      {/* Main content with side-by-side layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<ToastContainer
  position="top-right"
  aria-label="Toast notifications"
  autoClose={10000}
  newestOnTop={false}
  closeOnClick
  rtl={false}
  pauseOnFocusLoss
  draggable
  pauseOnHover
  theme="light"
/>
        
      </div>
    </div>
  );
};

export default DietTrackerComponent;
