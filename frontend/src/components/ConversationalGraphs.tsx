import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

const ConversationGraphs = () => {
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/meal-plan/');
        if (response.data.mealPlans && response.data.mealPlans.length > 0) {
          setMealPlan(response.data.mealPlans[0]);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchMealPlan();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold text-blue-600 animate-pulse">
        Loading your meal plan...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold text-red-600">
        Error: {error}
      </div>
    </div>
  );

  if (!mealPlan) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl font-semibold text-gray-600">
        No meal plan found
      </div>
    </div>
  );

  // Calculate daily nutrition
  const calculateDailyNutrition = (dayIndex: number) => {
    const result = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    mealPlan.days[dayIndex].meals.forEach((meal: any) => {
      result.calories += meal.nutrition.calories;
      result.protein += meal.nutrition.protein;
      result.carbs += meal.nutrition.carbs;
      result.fat += meal.nutrition.fat;
    });
    return result;
  };

  // Calculate weekly nutrition
  const calculateWeeklyNutrition = () => {
    const weeklyData = mealPlan.days.map((day: any, index: number) => {
      const dayNutrition = calculateDailyNutrition(index);
      return {
        dayNumber: day.dayNumber,
        ...dayNutrition
      };
    });

    const totals = weeklyData.reduce((acc: any, curr: any) => {
      acc.calories += curr.calories;
      acc.protein += curr.protein;
      acc.carbs += curr.carbs;
      acc.fat += curr.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return { dailyData: weeklyData, totals };
  };

  const dailyNutrition = calculateDailyNutrition(selectedDay);
  const weeklyData = calculateWeeklyNutrition();

  // Data for macros pie chart
  const macrosData = [
    { name: 'Protein', value: dailyNutrition.protein },
    { name: 'Carbs', value: dailyNutrition.carbs },
    { name: 'Fat', value: dailyNutrition.fat }
  ];

  // Data for meal type distribution
  const mealTypeData = mealPlan.days[selectedDay].meals.map((meal: any) => ({
    name: meal.type,
    calories: meal.nutrition.calories,
    protein: meal.nutrition.protein,
    carbs: meal.nutrition.carbs,
    fat: meal.nutrition.fat
  }));

  // Data for weekly trend
  const weeklyTrendData = weeklyData.dailyData.map((day: any) => ({
    name: `Day ${day.dayNumber}`,
    calories: day.calories,
    protein: day.protein,
    carbs: day.carbs,
    fat: day.fat
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Meal Plan Analytics
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Daily View
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Weekly Overview
            </button>
          </div>
        </div>

        {/* Day Selector */}
        {activeTab === 'daily' && (
          <div className="flex justify-center mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4">
              <label className="font-medium text-gray-700">Select Day:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              >
                {mealPlan.days.map((day: any, index: number) => (
                  <option key={index} value={index}>
                    Day {day.dayNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Calories</h3>
            <p className="text-3xl font-bold text-gray-800">
              {activeTab === 'daily' ? dailyNutrition.calories : weeklyData.totals.calories}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'daily' ? 'Daily intake' : 'Weekly total'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Protein</h3>
            <p className="text-3xl font-bold text-gray-800">
              {activeTab === 'daily' ? dailyNutrition.protein : weeklyData.totals.protein}g
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'daily' ? 'Daily intake' : 'Weekly total'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Carbs</h3>
            <p className="text-3xl font-bold text-gray-800">
              {activeTab === 'daily' ? dailyNutrition.carbs : weeklyData.totals.carbs}g
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'daily' ? 'Daily intake' : 'Weekly total'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Fat</h3>
            <p className="text-3xl font-bold text-gray-800">
              {activeTab === 'daily' ? dailyNutrition.fat : weeklyData.totals.fat}g
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {activeTab === 'daily' ? 'Daily intake' : 'Weekly total'}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        {activeTab === 'daily' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Macros Pie Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Macronutrient Distribution</h3>
              <div className="h-80">
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Meal Type Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Meal Type Breakdown</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={mealTypeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="calories" fill="#0088FE" name="Calories" />
                    <Bar dataKey="protein" fill="#00C49F" name="Protein (g)" />
                    <Bar dataKey="carbs" fill="#FFBB28" name="Carbs (g)" />
                    <Bar dataKey="fat" fill="#FF8042" name="Fat (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 mb-8">
            {/* Weekly Trend Line Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Weekly Nutrition Trend</h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#0088FE"
                      activeDot={{ r: 8 }}
                      name="Calories"
                    />
                    <Line
                      type="monotone"
                      dataKey="protein"
                      stroke="#00C49F"
                      name="Protein (g)"
                    />
                    <Line
                      type="monotone"
                      dataKey="carbs"
                      stroke="#FFBB28"
                      name="Carbs (g)"
                    />
                    <Line
                      type="monotone"
                      dataKey="fat"
                      stroke="#FF8042"
                      name="Fat (g)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Meals List */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {activeTab === 'daily' ? `Day ${selectedDay + 1} Meals` : 'All Meals Overview'}
          </h3>
          
          {activeTab === 'daily' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mealPlan.days[selectedDay].meals.map((meal: any, index: number) => (
                <MealCard key={index} meal={meal} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {mealPlan.days.map((day: any, dayIndex: number) => (
                <div key={dayIndex} className="mb-8">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">Day {day.dayNumber}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {day.meals.map((meal: any, mealIndex: number) => (
                      <MealCard key={mealIndex} meal={meal} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total Meal Graph */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Total Meal Distribution</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mealPlan.days.map((day: any) => ({
                  name: `Day ${day.dayNumber}`,
                  meals: day.meals.length
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="meals"
                  fill="#8884d8"
                  name="Number of Meals"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MealCard = ({ meal }: { meal: any }) => {
  return (
    <div className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800">{meal.type}</h4>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          meal.eaten ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {meal.eaten ? '✓ Consumed' : 'Pending'}
        </span>
      </div>
      <h5 className="font-bold text-gray-900 mb-1">{meal.dishName}</h5>
      <p className="text-sm text-gray-600 mb-3">{meal.description}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
          <span className="font-medium">Calories:</span> {meal.nutrition.calories}
        </div>
        <div className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded">
          <span className="font-medium">Protein:</span> {meal.nutrition.protein}g
        </div>
        <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded">
          <span className="font-medium">Carbs:</span> {meal.nutrition.carbs}g
        </div>
        <div className="text-xs bg-red-50 text-red-800 px-2 py-1 rounded">
          <span className="font-medium">Fat:</span> {meal.nutrition.fat}g
        </div>
      </div>
    </div>
  );
};

export default ConversationGraphs;