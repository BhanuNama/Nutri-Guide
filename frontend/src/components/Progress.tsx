import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import LoadingScreen from './LoadingScreen';
import ErrorScreen from './ErrorScreen';
import NoDataScreen from './NoDataScreen';

// Types (same as before)
interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  _id: string;
  type: string;
  dishName: string;
  description: string;
  nutrition: Nutrition;
  eaten: boolean;
}

interface Day {
  _id: string;
  dayNumber: number;
  meals: Meal[];
}

interface DietPlan {
  _id: string;
  planName: string;
  dailyCalories: number;
  dailyMacros: Nutrition;
  days: Day[];
  goal: 'weight-loss' | 'weight-gain' | 'maintenance';
  height: number;
  weight: number;
  planDuration: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

const Progress: React.FC = () => {
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'daily' | 'total'>('daily');

  useEffect(() => {
    const fetchDietPlan = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/diet-plans');
        if (response.data.dietPlans?.length > 0) {
          setDietPlan(response.data.dietPlans[0]);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDietPlan();
  }, []);

  const SummaryCard = ({
    title,
    value,
    subtitle,
    borderColor,
    textColor,
  }: {
    title: string;
    value: string;
    subtitle: string;
    borderColor: string;
    textColor?: string;
  }) => (
    <div className={`p-4 rounded-lg shadow-md border ${borderColor}`}>
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <p className={`text-xl font-bold ${textColor ?? 'text-gray-900'}`}>{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );  

  const getBmiCategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };
  
   const getBmiColor = (bmi: number): string => {
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md h-[400px]">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
      {children}
    </div>
  );
  
  // Calculate total statistics across all days
  const calculateTotalStats = () => {
    if (!dietPlan) return {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalEaten: 0,
      totalMeals: 0,
      dailyProgress: []
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalEaten = 0;
    let totalMeals = 0;
    const dailyProgress: {
        day: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        completion: number;
    }[] = [];
      
    dietPlan.days.forEach((day, dayIndex) => {
      let dayCalories = 0;
      let dayProtein = 0;
      let dayCarbs = 0;
      let dayFat = 0;
      let dayEaten = 0;

      day.meals.forEach(meal => {
        if (meal.eaten) {
          dayCalories += meal.nutrition.calories;
          dayProtein += meal.nutrition.protein;
          dayCarbs += meal.nutrition.carbs;
          dayFat += meal.nutrition.fat;
          dayEaten++;
          totalEaten++;
        }
        totalMeals++;
      });

      totalCalories += dayCalories;
      totalProtein += dayProtein;
      totalCarbs += dayCarbs;
      totalFat += dayFat;

      dailyProgress.push({
        day: dayIndex + 1,
        calories: dayCalories,
        protein: dayProtein,
        carbs: dayCarbs,
        fat: dayFat,
        completion: Math.round((dayEaten / day.meals.length) * 100)
      });
    });

    return {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      totalEaten,
      totalMeals,
      dailyProgress
    };
  };

  const totalStats = calculateTotalStats();

  // Calculate daily statistics (for the selected day)
  const calculateDailyStats = () => {
    if (!dietPlan) return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      eaten: 0,
      total: 0
    };

    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    let eaten = 0;
    const total = dietPlan.days[selectedDay]?.meals.length || 0;

    dietPlan.days[selectedDay]?.meals.forEach(meal => {
      if (meal.eaten) {
        consumed.calories += meal.nutrition.calories;
        consumed.protein += meal.nutrition.protein;
        consumed.carbs += meal.nutrition.carbs;
        consumed.fat += meal.nutrition.fat;
        eaten++;
      }
    });

    return {
      ...consumed,
      eaten,
      total
    };
  };

  const dailyStats = calculateDailyStats();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!dietPlan) return <NoDataScreen />;

  // Common calculations
  const heightInMeters = dietPlan.height / 100;
  const bmi = parseFloat((dietPlan.weight / (heightInMeters * heightInMeters)).toFixed(1));
  const calorieDeficitPerDay = dietPlan.goal === 'weight-loss' ? 500 : dietPlan.goal === 'weight-gain' ? -500 : 0;
  const predictedWeightChange = parseFloat(((calorieDeficitPerDay * dietPlan.planDuration) / 7700).toFixed(1));
  const predictedWeight = (dietPlan.weight + predictedWeightChange).toFixed(1);

  // Data for charts
  const macrosData = [
    { name: 'Protein', value: dietPlan.dailyMacros.protein },
    { name: 'Carbs', value: dietPlan.dailyMacros.carbs },
    { name: 'Fat', value: dietPlan.dailyMacros.fat }
  ];

  // View-specific data
  const progressData = viewMode === 'daily' ? [
    {
      name: 'Calories',
      target: dietPlan.dailyCalories,
      consumed: dailyStats.calories,
      remaining: dietPlan.dailyCalories - dailyStats.calories
    },
    {
      name: 'Protein',
      target: dietPlan.dailyMacros.protein,
      consumed: dailyStats.protein,
      remaining: dietPlan.dailyMacros.protein - dailyStats.protein
    },
    {
      name: 'Carbs',
      target: dietPlan.dailyMacros.carbs,
      consumed: dailyStats.carbs,
      remaining: dietPlan.dailyMacros.carbs - dailyStats.carbs
    },
    {
      name: 'Fat',
      target: dietPlan.dailyMacros.fat,
      consumed: dailyStats.fat,
      remaining: dietPlan.dailyMacros.fat - dailyStats.fat
    }
  ] : [
    {
      name: 'Calories',
      target: dietPlan.dailyCalories * dietPlan.planDuration,
      consumed: totalStats.totalCalories,
      remaining: (dietPlan.dailyCalories * dietPlan.planDuration) - totalStats.totalCalories
    },
    {
      name: 'Protein',
      target: dietPlan.dailyMacros.protein * dietPlan.planDuration,
      consumed: totalStats.totalProtein,
      remaining: (dietPlan.dailyMacros.protein * dietPlan.planDuration) - totalStats.totalProtein
    },
    {
      name: 'Carbs',
      target: dietPlan.dailyMacros.carbs * dietPlan.planDuration,
      consumed: totalStats.totalCarbs,
      remaining: (dietPlan.dailyMacros.carbs * dietPlan.planDuration) - totalStats.totalCarbs
    },
    {
      name: 'Fat',
      target: dietPlan.dailyMacros.fat * dietPlan.planDuration,
      consumed: totalStats.totalFat,
      remaining: (dietPlan.dailyMacros.fat * dietPlan.planDuration) - totalStats.totalFat
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">{dietPlan.planName} Progress</h1>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                viewMode === 'daily' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Daily View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('total')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                viewMode === 'total' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Plan Overview
            </button>
          </div>
        </div>

        {/* Day Selector (only in daily view) */}
        {viewMode === 'daily' && (
          <div className="flex justify-center mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <label className="mr-2 font-medium text-gray-700">Select Day:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dietPlan.days.map((day, index) => (
                  <option key={day._id} value={index}>
                    Day {day.dayNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title={viewMode === 'daily' ? 'Daily Calories' : 'Total Calories'}
            value={
              viewMode === 'daily' 
                ? `${dailyStats.calories} / ${dietPlan.dailyCalories}` 
                : `${totalStats.totalCalories} / ${dietPlan.dailyCalories * dietPlan.planDuration}`
            }
            subtitle={
              viewMode === 'daily'
                ? `Remaining: ${dietPlan.dailyCalories - dailyStats.calories}`
                : `Daily avg: ${Math.round(totalStats.totalCalories / (selectedDay + 1))}`
            }
            borderColor="border-blue-500"
          />
          <SummaryCard
            title="Current BMI"
            value={bmi.toString()}
            subtitle={getBmiCategory(bmi)}
            borderColor="border-green-500"
            textColor={getBmiColor(bmi)}
          />
          <SummaryCard
            title="Predicted Weight"
            value={`${predictedWeight} kg`}
            subtitle={`${dietPlan.goal === 'weight-loss' ? 'Loss' : 'Gain'}: ${Math.abs(predictedWeightChange)} kg`}
            borderColor="border-purple-500"
          />
          <SummaryCard
            title={viewMode === 'daily' ? 'Meal Completion' : 'Overall Completion'}
            value={
              viewMode === 'daily'
                ? `${dailyStats.eaten} / ${dailyStats.total}`
                : `${totalStats.totalEaten} / ${totalStats.totalMeals}`
            }
            subtitle={
              viewMode === 'daily'
                ? `${Math.round((dailyStats.eaten / dailyStats.total) * 100)}% completed`
                : `${Math.round((totalStats.totalEaten / totalStats.totalMeals) * 100)}% completed`
            }
            borderColor="border-amber-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Macros Chart */}
          <ChartCard title={viewMode === 'daily' ? 'Daily Macros Target' : 'Total Macros Distribution'}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macrosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {macrosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}g`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Progress Chart */}
          <ChartCard title={viewMode === 'daily' ? 'Daily Nutrition Progress' : 'Overall Nutrition Progress'}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={progressData} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === 'consumed' ? '' : ' remaining'}`,
                    name === 'consumed' ? 'Consumed' : 'Remaining'
                  ]} 
                />
                <Legend />
                <Bar dataKey="consumed" stackId="a" fill="#00C49F" name="Consumed" />
                <Bar dataKey="remaining" stackId="a" fill="#FFBB28" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Additional Charts for Total View */}
        {viewMode === 'total' && (
          <div className="grid grid-cols-1 gap-8 mb-8">
            <ChartCard title="Daily Calorie Intake Progress">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={totalStats.dailyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#8884d8" 
                    name="Calories" 
                    strokeWidth={2} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey={dietPlan.dailyCalories} 
                    stroke="#82ca9d" 
                    name="Daily Target" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Meal Completion by Day">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={totalStats.dailyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completion" fill="#8884d8" name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Meals Section */}
        {viewMode === 'daily' ? (
          <DailyMealsView 
            day={dietPlan.days[selectedDay]} 
            dayNumber={selectedDay + 1} 
          />
        ) : (
          <TotalMealsView days={dietPlan.days} />
        )}
      </div>
    </div>
  );
};

// Daily Meals View Component
const DailyMealsView = ({ day, dayNumber }: { day: Day, dayNumber: number }) => (
  <div className="bg-white p-6 rounded-xl shadow-md">
    <h3 className="text-xl font-semibold text-gray-800 mb-6">Meals for Day {dayNumber}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {day.meals.map((meal) => (
        <MealCard key={meal._id} meal={meal} />
      ))}
    </div>
  </div>
);

// Total Meals View Component
const TotalMealsView = ({ days }: { days: Day[] }) => {
  // Calculate meal type statistics across all days
  const mealStats = days.reduce((acc, day) => {
    day.meals.forEach(meal => {
      if (!acc[meal.type]) {
        acc[meal.type] = { eaten: 0, total: 0 };
      }
      acc[meal.type].total++;
      if (meal.eaten) {
        acc[meal.type].eaten++;
      }
    });
    return acc;
  }, {} as Record<string, { eaten: number, total: number }>);

  const mealTypes = Object.entries(mealStats).map(([type, stats]) => ({
    type,
    ...stats,
    percentage: Math.round((stats.eaten / stats.total) * 100)
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">All Meals Overview</h3>
      
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-700 mb-4">Meal Type Completion</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mealTypes.map((meal) => (
            <div key={meal.type} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h5 className="font-bold text-lg text-gray-800 mb-2">{meal.type}</h5>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completion:</span>
                <span className="font-semibold">{meal.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${meal.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>{meal.eaten} eaten</span>
                <span>{meal.total} total</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-700 mb-4">All Days Meals</h4>
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day._id} className="border border-gray-200 rounded-lg p-4">
              <h5 className="font-bold text-lg text-gray-800 mb-3">Day {day.dayNumber}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {day.meals.map((meal) => (
                  <MealCard key={meal._id} meal={meal} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Compact Meal Card variant
const MealCard = ({ meal, compact = false }: { meal: Meal, compact?: boolean }) => (
  <div className={`p-3 rounded-lg border ${meal.eaten ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} ${
    compact ? '' : 'h-full'
  }`}>
    <div className="flex justify-between items-start mb-1">
      <h4 className={`font-medium text-gray-800 ${compact ? 'text-sm' : ''}`}>{meal.type}</h4>
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
        meal.eaten ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        {meal.eaten ? '✓' : '•'}
      </span>
    </div>
    <h5 className={`font-bold text-gray-900 ${compact ? 'text-sm' : 'text-lg'}`}>{meal.dishName}</h5>
    {!compact && <p className="text-sm text-gray-600 mb-2">{meal.description}</p>}
    <div className="flex flex-wrap gap-1">
      <NutritionPill label="Cal" value={meal.nutrition.calories} color="blue" compact={compact} />
      <NutritionPill label="P" value={meal.nutrition.protein} color="green" compact={compact} />
      <NutritionPill label="C" value={meal.nutrition.carbs} color="yellow" compact={compact} />
      <NutritionPill label="F" value={meal.nutrition.fat} color="red" compact={compact} />
    </div>
  </div>
);

// Compact Nutrition Pill variant
const NutritionPill = ({ label, value, color, compact = false }: { 
  label: string; 
  value: number; 
  color: string; 
  compact?: boolean 
}) => (
  <span className={`${compact ? 'text-xxs px-1.5 py-0.5' : 'text-xs px-2 py-1'} bg-${color}-100 text-${color}-800 rounded`}>
    {label}: {value}
  </span>
);

// ... (keep all other helper components and functions from previous implementation)

export default Progress;