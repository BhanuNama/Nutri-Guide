
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain } from 'lucide-react'; // or your relevant icon library
import { FaStethoscope } from 'react-icons/fa';
// adjust path if needed
import { FaUtensils } from 'react-icons/fa';


import { 
  Home, Activity, Calendar, User, LineChart, Flame, Utensils, 
  LogOut, ChevronRight, Bell, Search, TrendingDown, TrendingUp, 
  Menu, X, ChevronDown, Settings,
  MessageCircle,
  Hotel
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import DietPlanner from './DietPlanner';
import DietTracker from './DietTracker';
import CommunityWall from './CommunityWall';
import Profile from './Profile';
import EditProfile from './EditProfile';
import Macros from './Macros';
import MealPlanner from './CustomMealPlan';
import TwoComponentToggle from './Schedule';
import Progress from './Progress';
import ConversationGraphs from './ConversationalGraphs';
import ProgressCombined from './ProgressCombined';
import ProfileOverview from './DashboardOverview';
import FixMyMeal from './FixMyMeal';
import MindfulEatingScore from './MindfulEatingScore';
import FoodDoctor from './FoodDoctor';
import CookingCompanion from './CookingCompanion'; 

interface DashboardData {
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
  };
  trends: {
    weightChange: number;
    bmiChange: number;
    avgDailyCalories: number;
  };
}

interface NutritionRequirements {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [nutritionReqs, setNutritionReqs] = useState<NutritionRequirements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const [, setLoggedInUserName] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('neutroToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('neutroUserId');
    const storedUserName = localStorage.getItem('neutroUserName');
    const token = localStorage.getItem('neutroToken');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (storedUserId) {
      setLoggedInUserId(storedUserId);
    }
    
    if (storedUserName) {
      setLoggedInUserName(storedUserName);
    }
  }, [navigate]);

  const calculateBMR = (weight: number, height: number, age: number, gender: string): number => {
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  };

  const calculateTDEE = (bmr: number): number => {
    return bmr * 1.55;
  };

  const calculateCalories = (tdee: number, fitnessGoal: string): number => {
    switch (fitnessGoal) {
      case 'weight-loss':
        return tdee - 500;
      case 'weight-gain':
        return tdee + 500;
      case 'muscle-building':
        return tdee + 300;
      default:
        return tdee;
    }
  };

  const calculateMacros = (calories: number, weight: number, fitnessGoal: string): { protein: number, carbs: number, fats: number } => {
    let proteinPerKg: number;
    let fatPercent: number;
    
    switch (fitnessGoal) {
      case 'weight-loss':
        proteinPerKg = 2.0;
        fatPercent = 0.25;
        break;
      case 'weight-gain':
        proteinPerKg = 1.8;
        fatPercent = 0.30;
        break;
      case 'muscle-building':
        proteinPerKg = 2.2;
        fatPercent = 0.25;
        break;
      default:
        proteinPerKg = 1.6;
        fatPercent = 0.30;
    }
    
    const protein = Math.round(weight * proteinPerKg);
    const fats = Math.round((calories * fatPercent) / 9);
    
    const proteinCalories = protein * 4;
    const fatCalories = fats * 9;
    const carbCalories = calories - proteinCalories - fatCalories;
    const carbs = Math.round(carbCalories / 4);
    
    return { protein, carbs, fats };
  };

  useEffect(() => {
    if (dashboardData) {
      const { gender, age } = dashboardData.user;
      const { currentWeight, height, fitnessGoal } = dashboardData.stats;
      
      const bmr = calculateBMR(currentWeight, height, age, gender);
      const tdee = calculateTDEE(bmr);
      const calories = Math.round(calculateCalories(tdee, fitnessGoal));
      const macros = calculateMacros(calories, currentWeight, fitnessGoal);
      
      setNutritionReqs({
        calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fats: macros.fats
      });
    }
  }, [dashboardData]);

  useEffect(() => {
    if (!loggedInUserId) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('neutroToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const endpoint = 'http://localhost:3000/api/users/me/dashboard';
        
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setDashboardData(response.data);
        setError('');
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('neutroToken');
          localStorage.removeItem('neutroUserId');
          localStorage.removeItem('neutroUserName');
          navigate('/login');
        } else {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, loggedInUserId]);
  
  const handleLogout = () => {
    localStorage.removeItem('neutroToken');
    localStorage.removeItem('neutroUserId');
    localStorage.removeItem('neutroUserName');
    setLoggedInUserId(null);
    setLoggedInUserName(null);
    navigate('/');
  };

  const formatWeightChange = (change: number) => {
    if (change === 0) return "No change";
    const absChange = Math.abs(change);
    return change < 0 ? `${absChange} kg lost` : `${absChange} kg gained`;
  };

  const formatBmiChange = (change: number) => {
    if (change === 0) return "No change";
    const absChange = Math.abs(change);
    return change < 0 ? `${absChange} decrease` : `${absChange} increase`;
  };

  const getChangeColor = (change: number, metric: 'weight' | 'bmi') => {
    if (change === 0) return "text-gray-500";
    
    if (metric === 'weight' || metric === 'bmi') {
      return change < 0 ? "text-green-500" : "text-red-500";
    }
    
    return "text-gray-500";
  };
  
  const getTrendIcon = (change: number) => {
    if (change === 0) return null;
    return change < 0 ? <TrendingDown className="ml-1 h-4 w-4" /> : <TrendingUp className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 flex flex-col w-64 z-30 transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 transition duration-300 ease-in-out`}>
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-blue-600 to-indigo-700 shadow-xl">
          {/* Close button (mobile only) */}
          
          <div className="flex items-center justify-between p-4 lg:hidden">
            <Link to="/">
              <div className="flex items-center">
                <Flame className="h-8 w-8 text-white" />
                <span className="ml-3 text-xl font-bold text-white">Nutri Guide</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Logo (desktop) */}
          <Link to="/">
          <div className="hidden lg:flex items-center px-6 py-6">
            <Flame className="h-8 w-8 text-white" />
            <span className="ml-3 text-2xl font-bold text-white">Nutri Guide</span>
          </div>
          </Link>
          {/* User profile in sidebar */}
          {dashboardData && (
            <div className="px-4  py-4 border-t border-indigo-500 border-opacity-30">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-400 bg-opacity-30 flex items-center justify-center text-white font-semibold">
                  {dashboardData.user.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{dashboardData.user.name}</p>
                  <p className="text-xs text-indigo-200">{dashboardData.stats.fitnessGoal.replace(/-/g, ' ')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="mt-5 flex-1 px-3 space-y-6">
            <div>
              <p className="px-3 text-xs font-medium text-indigo-200 uppercase tracking-wider">
                Main Menu
              </p>
              <div className="mt-2 space-y-1">
                <NavItem 
                  icon={<Home size={20} />} 
                  text="Overview" 
                  active={activeSection === 'overview'} 
                  onClick={() => {
                    setActiveSection('overview');
                    setSidebarOpen(false);
                  }}
                />
                <NavItem 
                  icon={<Utensils size={20} />} 
                  text="Diet Planner" 
                  active={activeSection === 'diet-planner'} 
                  onClick={() => {
                    setActiveSection('diet-planner');
                    setSidebarOpen(false);
                  }}
                />
                <NavItem 
                  icon={<Activity size={20} />} 
                  text="Activity" 
                  active={activeSection === 'activity'} 
                  onClick={() => {
                    setActiveSection('activity');
                    setSidebarOpen(false);
                  }}
                />
              </div>
            </div>
            
            <div>
              <p className="px-3 text-xs font-medium text-indigo-200 uppercase tracking-wider">
                Personal
              </p>
              <div className="mt-2 space-y-1">
                <NavItem 
                  icon={<Calendar size={20} />} 
                  text="Schedule" 
                  active={activeSection === 'schedule'} 
                  onClick={() => {
                    setActiveSection('schedule');
                    setSidebarOpen(false);
                  }}
                />
                <NavItem 
                  icon={<User size={20} />} 
                  text="Profile" 
                  active={activeSection === 'profile'} 
                  onClick={() => {
                    setActiveSection('profile');
                    setSidebarOpen(false);
                  }}
                />
                <NavItem 
                  icon={<LineChart size={20} />} 
                  text="Progress" 
                  active={activeSection === 'progress'} 
                  onClick={() => {
                    setActiveSection('progress');
                    setSidebarOpen(false);
                  }}
                />
                <NavItem 
                  icon={<Hotel size={20} />} 
                  text="Macros Tracker" 
                  active={activeSection === 'macros'} 
                  onClick={() => {
                    setActiveSection('macros');
                    setSidebarOpen(false);
                  }}
                />
                <NavItem 
  icon={<Utensils size={20} />} 
  text="Fix My Meal" 
  active={activeSection === 'fix-my-meal'} 
  onClick={() => {
    setActiveSection('fix-my-meal');
    setSidebarOpen(false);
  }}
/>
<NavItem 
  icon={<Brain size={20} />} 
  text="Mindful Score" 
  active={activeSection === 'mindful'} 
  onClick={() => {
    setActiveSection('mindful');
    setSidebarOpen(false);
  }}
/>
<NavItem 
  icon={<FaStethoscope size={20} />} 
  text="Food Doctor" 
  active={activeSection === 'food-doctor'} 
  onClick={() => {
    setActiveSection('food-doctor');
    setSidebarOpen(false);
  }}
/>
<NavItem 
  icon={<FaUtensils size={20} />} 
  text="Cooking Companion" 
  active={activeSection === 'cooking-companion'} 
  onClick={() => {
    setActiveSection('cooking-companion');
    setSidebarOpen(false);
  }}
/>





              </div>
            </div>

            <div>
              <p className="px-3 text-xs font-medium text-indigo-200 uppercase tracking-wider">
                Settings
              </p>
              <div className="mt-2 space-y-1">
                <NavItem 
                  icon={<MessageCircle size={20} />} 
                  text="Community Wall" 
                  active={activeSection === 'community'} 
                  onClick={() => {
                    setActiveSection('community');
                    setSidebarOpen(false);
                  }}
                />
              </div>
              <div className="mt-2 space-y-1">
                <NavItem 
                  icon={<User size={20} />} 
                  text="Edit Profile" 
                  active={activeSection === 'editprofile'} 
                  onClick={() => {
                    setActiveSection('editprofile');
                    setSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          </nav>
          
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 transition-colors"
            >
              <LogOut size={18} className="mr-2" />
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1  flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search */}
            <div className="flex-1 max-w-md ml-6 lg:ml-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Search"
                />
              </div>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex items-center ml-4 sm:ml-6">
              {/* Notification button */}
              <button className="p-1 ml-3 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex">
                  <button className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span className="sr-only">Open user menu</span>
                    {dashboardData && (
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center text-white font-medium">
                          {dashboardData.user.name.charAt(0)}
                        </div>
                        <span className="hidden md:flex ml-2 items-center">
                          <span className="text-sm font-medium text-gray-700 mr-1">
                            {dashboardData.user.name}
                          </span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
                    <p className="mt-6 text-base text-gray-600">Loading your dashboard...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-lg bg-red-50 p-6 shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <X className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
                      <div className="mt-2 text-base text-red-700">{error}</div>
                      <div className="mt-4">
                        <button
                          onClick={() => setError('')}
                          className="px-4 py-2 rounded-md text-sm font-medium text-red-800 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeSection === 'diet-planner' ? (
                <DietPlanner />
              )
              : activeSection === 'schedule' ? (
                <TwoComponentToggle />
              )
              : activeSection === 'progress' ? (
                <ProgressCombined />
              )
              : activeSection === 'community' ? (
                <CommunityWall />
              )
              :  activeSection === 'profile' ? (
                  <Profile />
              )
              : activeSection === 'editprofile' ? (
                <EditProfile />
              )
              : activeSection === 'macros' ? (
                <Macros />
              )
              : activeSection === 'fix-my-meal' ? (
                <FixMyMeal />
              )
               : activeSection === 'mindful' ? (
              <MindfulEatingScore />
            )
            : activeSection === 'food-doctor' ? (
              <FoodDoctor />
            )
            : activeSection === 'cooking-companion' ? (
              <CookingCompanion />
            ) 
              : dashboardData && (
                <div className="space-y-8">
                  {/* Welcome section with greeting and time */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                          Welcome back, {dashboardData.user.name}! 👋
                        </h1>
                        <p className="mt-2 text-indigo-100">
                          Here's your health summary for {new Date().toLocaleDateString('en-US', {
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <button
                          onClick={() => setActiveSection('diet-planner')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-100 transition-colors"
                        >
                          <Utensils className="h-4 w-4 mr-2" />
                          Create Meal Plan
                        </button>
                      </div>
                    </div>
                  </div>
                    <ProfileOverview />      
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ 
  icon, 
  text, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode, 
  text: string, 
  active?: boolean, 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center  w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-indigo-800 bg-opacity-50 text-white'
          : 'text-indigo-100 hover:bg-indigo-800 hover:bg-opacity-50 hover:text-white'
      }`}
    >
      <span className="mr-3 flex-shrink-0 text-indigo-300">
        {icon}
      </span>
      <span className="flex-1 text-start">{text}</span>
      {active && <ChevronRight className="ml-3 h-4 w-4 text-indigo-300" />}
    </button>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeColor, 
  icon,
  trendIcon
}: { 
  title: string, 
  value: string, 
  change: string, 
  changeColor: string, 
  icon: React.ReactNode,
  trendIcon?: React.ReactNode 
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 p-2 rounded-lg bg-gray-50">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="flex items-baseline mt-1">
              <p className="text-xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 rounded-b-xl">
        <div className="text-sm">
          <div className={`flex items-center ${changeColor}`}>
            <span className="font-medium">{change}</span>
            {trendIcon}
          </div>
        </div>
      </div>
    </div>
  );
}

const colorClasses = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200'
};

function NutrientCard({ 
  title, 
  value, 
  unit, 
  color, 
  icon,
  description 
}: { 
  title: string, 
  value: number, 
  unit: string, 
  color: keyof typeof colorClasses, 
  icon: React.ReactNode,
  description: string
}) {
  return (
    <div className={`rounded-lg  ${colorClasses[color]} p-4 ring-1 ring-inset`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-xl font-semibold">
              {value}
              <span className="text-sm ml-1">{unit}</span>
            </p>
          </div>
          <p className="text-xs mt-1 opacity-75">{description}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileDetail({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-base font-medium text-gray-900">{value}</dd>
    </div>
  );
}

export default Dashboard;
