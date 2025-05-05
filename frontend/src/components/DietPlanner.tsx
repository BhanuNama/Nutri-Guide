import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, AlertCircle, ChevronRight, Utensils, Calendar, Loader, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import DietPlannerForm from './DietPlannerForm';


// Constants for API configuration
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 2;

// Error code mapping for user-friendly messages
const ERROR_MESSAGES = {
  GEMINI_API_ERROR: "Our meal planning AI is temporarily unavailable.",
  GEMINI_NOT_INITIALIZED: "Our meal planning service is currently initializing.",
  NUTRITION_API_ERROR: "Nutrition data service is currently unavailable.",
  DATABASE_ERROR: "There was an issue saving your meal plan data.",
  INVALID_JSON_RESPONSE: "There was an issue processing your meal plan data.",
  NOT_FOUND: "The requested resource was not found.",
  INTERNAL_ERROR: "Something went wrong on our servers.",
  TIMEOUT: "The request took too long to complete.",
  UNAUTHORIZED: "Your session has expired. Please login again."
};

interface DietPlan {
  _id: string;
  planDuration: number;
  dailyCalories: number;
  dailyMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  days: Array<{
    dayNumber: number;
    meals: Array<{
      type: string;
      dishName: string;
      description: string;
      nutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    }>;
  }>;
}

interface DayMeal {
  type: string;
  dishName: string;
  description: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface DayData {
  day: {
    dayNumber: number;
    meals: DayMeal[];
  };
  dailyCalories: number;
  dailyMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface UserProfile {
  user: {
    name: string;
    age: number;
    gender: string;
  };
  stats: {
    currentWeight: number;
    currentBmi: number;
    height: number;
    dietType: string;
    fitnessGoal: string;
    mealsPerDay: number;
    restrictionsAndAllergies?: string[];
  };
}

interface ApiError {
  code: string;
  details?: string;
  maxDays?: number;
}

const DietPlanner: React.FC = () => {
  const navigate = useNavigate();
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDayLoading, setIsDayLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dayError, setDayError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [warning, setWarning] = useState<{ title: string; message: string } | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for token
    const token = localStorage.getItem('neutroToken');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user profile data
    fetchUserProfile();
    
    // Check if the user already has a diet plan
    fetchLatestDietPlan();
  }, [navigate]);

  useEffect(() => {
    // When diet plan or selected day changes, fetch day data
    if (dietPlan) {
      fetchDayData(selectedDay);
    }
  }, [dietPlan, selectedDay]);

  // Auto-retry logic for API timeouts
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    
    if (isRetrying && retryCount < MAX_RETRIES) {
      retryTimer = setTimeout(() => {
        console.log(`Auto-retrying (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
        handleRetry();
      }, 3000); // Wait 3 seconds before retrying
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [isRetrying, retryCount]);

  // Clear success message after 5 seconds
  useEffect(() => {
    let messageTimer: NodeJS.Timeout;
    
    if (successMessage) {
      messageTimer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }
    
    return () => {
      if (messageTimer) clearTimeout(messageTimer);
    };
  }, [successMessage]);

  // Helper function to handle API errors
  const handleApiError = (error: any, defaultMsg: string, setErrorFn: React.Dispatch<React.SetStateAction<string | null>>) => {
    console.error(defaultMsg, error);
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      setErrorFn(ERROR_MESSAGES.TIMEOUT);
      return 'timeout';
    }
    
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      if (status === 401) {
        setErrorFn(ERROR_MESSAGES.UNAUTHORIZED);
        setTimeout(() => navigate('/login'), 2000);
        return 'auth';
      }
      
      if (status === 404) {
        if (errorData.error?.maxDays) {
          setErrorFn(`Day not found. This meal plan only has ${errorData.error.maxDays} days.`);
        } else {
          setErrorFn(ERROR_MESSAGES.NOT_FOUND);
        }
        return 'not_found';
      }
      
      if (status === 500 && errorData.error?.code) {
        const errorCode = errorData.error.code;
        const errorMsg = ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || errorData.message;
        setErrorFn(errorMsg);
        return errorCode;
      }
      
      setErrorFn(errorData.message || defaultMsg);
      return 'response';
    }
    
    if (error.request) {
      setErrorFn('No response from server. Please check your internet connection.');
      return 'network';
    }
    
    setErrorFn(error.message || defaultMsg);
    return 'unknown';
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('neutroToken');
      
      const response = await axios.get(`${API_BASE_URL}/users/me/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      setUserProfile(response.data);
    } catch (err: any) {
      // Only show profile errors if they're authentication related
      handleApiError(err, 'Error fetching user profile', 
        (msg) => err.response?.status === 401 ? setError(msg) : console.log(msg));
    }
  };

  const fetchLatestDietPlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('neutroToken');
      
      const response = await axios.get(`${API_BASE_URL}/diet-plans/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT 
      });
      
      setDietPlan(response.data);
      setShowForm(false);
      setRetryCount(0);
      setIsRetrying(false);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        // No plan found, but not an error - we'll show the generate option
        console.log('No existing diet plan found');
        setShowForm(true);
        setRetryCount(0);
        setIsRetrying(false);
      } else {
        const errorType = handleApiError(err, 'Error fetching diet plan', setError);
        
        if (errorType === 'timeout') {
          setIsRetrying(true);
          setRetryCount(prev => prev + 1);
          
          if (retryCount >= MAX_RETRIES) {
            setError('Could not connect to the server after multiple attempts. Please try again later or check your internet connection.');
            setIsRetrying(false);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDayData = async (dayNumber: number) => {
    try {
      setIsDayLoading(true);
      setDayError(null);
      
      if (!dietPlan) return;
      
      // Validate day number is within range
      if (dayNumber < 1 || dayNumber > dietPlan.planDuration) {
        setDayError(`Day ${dayNumber} is not within the valid range (1-${dietPlan.planDuration}).`);
        setIsDayLoading(false);
        return;
      }
      
      const token = localStorage.getItem('neutroToken');
      
      const response = await axios.get(`${API_BASE_URL}/diet-plans/days/${dayNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_TIMEOUT
      });
      
      setDayData(response.data);
    } catch (err: any) {
      const errorType = handleApiError(err, `Error fetching day ${dayNumber} data`, setDayError);
      
      if (errorType === 'timeout') {
        // Auto-retry day data fetch once after a short delay
        setTimeout(() => {
          if (dayError?.includes('timeout')) { // Only retry if still showing timeout error
            fetchDayData(dayNumber);
          }
        }, 2000);
      } 
    } finally {
      setIsDayLoading(false);
    }
  };

  const handlePlanGenerated = (planData: any) => {
    setDietPlan(planData);
    setSelectedDay(1);
    setShowForm(false);
    setSuccessMessage("Your personalized meal plan has been created successfully!");
    
    // Handle warnings from backend if any
    if (planData._warnings) {
      setWarning({
        title: "Notice",
        message: planData._warnings.message || "Your meal plan was generated with some adjustments."
      });
    } else {
      setWarning(null);
    }
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
  };

  const handleCreateNewPlan = () => {
    setShowForm(true);
    setError(null);
    setWarning(null);
  };

  const handleRetry = () => {
    setError(null);
    setDayError(null);
    
    // If showing form, just reset errors
    if (showForm) {
      return;
    }
    
    // If there's a day error, retry fetching that day
    if (dayError && selectedDay) {
      fetchDayData(selectedDay);
      return;
    }

    // Otherwise retry fetching the latest plan
    fetchLatestDietPlan();
  };

  const handleCancelForm = () => {
    if (dietPlan) {
      setShowForm(false);
    } else {
      fetchLatestDietPlan();
    }
  };

  // Helper function to determine loading message
  const getLoadingMessage = () => {
    if (isRetrying) {
      return `Retrying (attempt ${retryCount}/${MAX_RETRIES})...`;
    }
    
    if (showForm) {
      return "Please fill out the form to generate your meal plan...";
    }
    
    return "Loading your diet plan...";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{getLoadingMessage()}</p>
          {isRetrying && (
            <p className="text-xs text-gray-500 mt-2">
              This is taking longer than expected. Please wait...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl shadow-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Diet Planner
            </h1>
            <p className="mt-2 text-teal-100">
              Your personalized meal plan based on your nutrition needs
            </p>
          </div>
          {dietPlan && !showForm && (
            <button 
              onClick={handleCreateNewPlan}
              className="mt-4 md:mt-0 bg-white/20 hover:bg-white/30 text-white border-white/30 px-4 py-2 rounded-md flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Create New Plan
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Top Navigation Tabs - Day selector */}
        {dietPlan && !showForm && (
          <div className="mt-4 border-t border-white/20 pt-4">
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: dietPlan.planDuration }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => handleDaySelect(day)}
                  disabled={isDayLoading}
                  className={`px-4 py-2 rounded-md flex-shrink-0 flex items-center transition-all ${
                    isDayLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    selectedDay === day
                      ? 'bg-white text-teal-600 font-medium shadow-md'
                      : 'bg-teal-600/20 hover:bg-teal-600/30 text-white'
                  }`}
                >
                  <Calendar size={16} className="mr-2" />
                  Day {day}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl shadow-sm border border-green-200 flex items-center">
          <CheckCircle2 size={20} className="mr-2 text-green-500 flex-shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}
      
      {/* Warning banner */}
      {warning && (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-xl shadow-sm border border-yellow-200 flex items-center">
          <AlertTriangle size={20} className="mr-2 text-yellow-500 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">{warning.title}</h3>
            <p className="text-sm">{warning.message}</p>
          </div>
        </div>
      )}
      
      {/* Error message with retry button */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl shadow-sm border border-red-100">
          <div className="flex items-start">
            <AlertOctagon size={20} className="mr-2 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              
              {/* Only show this for connection/timeout errors */}
              {(error.includes('timeout') || error.includes('connect') || error.includes('internet')) && (
                <p className="text-sm text-red-600/80 mt-1">
                  This might be due to internet connectivity issues or our servers being temporarily busy.
                </p>
              )}
            </div>
            
            {!isRetrying && (
              <button 
                onClick={handleRetry}
                className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-md flex items-center flex-shrink-0"
              >
                <RefreshCcw size={14} className="mr-1" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Day error message */}
      {dayError && (
        <div className="bg-orange-50 text-orange-700 p-4 rounded-xl shadow-sm border border-orange-100 flex items-center">
          <AlertOctagon size={20} className="mr-2 text-orange-500 flex-shrink-0" />
          <span>{dayError}</span>
        </div>
      )}

      {/* Main Content Area */}
      {showForm ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Create Your Meal Plan</h2>
            {dietPlan && (
              <button 
                onClick={handleCancelForm}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
          
          <DietPlannerForm onPlanGenerated={handlePlanGenerated} />
        </div>
      ) : dietPlan ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isDayLoading ? (
            <div className="p-6 flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading meal plan for day {selectedDay}...</p>
              </div>
            </div>
          ) : dayError ? (
            <div className="p-6">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-start">
                <AlertCircle size={20} className="mr-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{dayError}</p>
                  <p className="text-sm text-red-600/80 mt-1">
                    {dayError.includes('not found') ? 
                      "Try selecting a different day or creating a new meal plan." : 
                      "This could be a temporary issue. Please try again."}
                  </p>
                </div>
                <button 
                  onClick={() => fetchDayData(selectedDay)}
                  className="ml-4 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-md flex items-center whitespace-nowrap flex-shrink-0"
                  disabled={isDayLoading}
                >
                  <RefreshCcw size={14} className="mr-1" />
                  Retry
                </button>
              </div>
            </div>
          ) : dayData ? (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <Calendar size={20} className="mr-2 text-teal-500" />
                Day {dayData.day.dayNumber} Meal Plan
              </h2>
              
              {/* Daily nutrition summary */}
              <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Daily Nutrition Target</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-3 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Calories</p>
                    <p className="text-2xl font-bold text-teal-600">{dayData.dailyCalories} <span className="text-sm font-normal text-gray-500">kcal</span></p>
                  </div>
                  <div className="p-3 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Protein</p>
                    <p className="text-2xl font-bold text-blue-600">{dayData.dailyMacros.protein} <span className="text-sm font-normal text-gray-500">g</span></p>
                  </div>
                  <div className="p-3 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Carbs</p>
                    <p className="text-2xl font-bold text-yellow-600">{dayData.dailyMacros.carbs} <span className="text-sm font-normal text-gray-500">g</span></p>
                  </div>
                  <div className="p-3 bg-white rounded-md shadow-sm">
                    <p className="text-xs text-gray-500 mb-1">Fat</p>
                    <p className="text-2xl font-bold text-green-600">{dayData.dailyMacros.fat} <span className="text-sm font-normal text-gray-500">g</span></p>
                  </div>
                </div>
              </div>
              
              {/* Meals */}
              <div className="space-y-6">
                {dayData.day.meals.map((meal, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 flex items-center">
                        <Utensils size={16} className="mr-2 text-teal-500" />
                        {meal.type}
                      </h3>
                      {meal.nutrition && (
                        <span className="text-sm font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                          {meal.nutrition.calories} kcal
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h4 className="font-bold text-lg mb-2 text-gray-800">{meal.dishName}</h4>
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">{meal.description}</p>
                      
                      {meal.nutrition && (
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
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 flex justify-center items-center h-64">
              <div className="text-center text-gray-500">
                <Calendar size={24} className="mx-auto mb-2 text-teal-500" />
                <p>Select a day to view your meal plan</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {error ? (
            <div className="max-w-md mx-auto">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">There was a problem</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleRetry} 
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                disabled={isRetrying}
              >
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          ) : (
            <>
              <Utensils size={48} className="mx-auto text-teal-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Create Your Diet Plan</h3>
              <p className="text-gray-600 mb-6">Get a personalized meal plan based on your nutrition goals and preferences.</p>
              <button
                onClick={handleCreateNewPlan} 
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">
                      <Loader size={16} />
                    </span>
                    Generating Plan...
                  </>
                ) : (
                  'Generate Diet Plan'
                )}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DietPlanner;