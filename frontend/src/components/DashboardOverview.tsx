import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadialBarChart, RadialBar
} from 'recharts';

// Types
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profileCompleted: boolean;
  restrictionsAndAllergies: string[];
  age: number;
  bmi: number;
  dietType: string;
  fitnessGoal: string;
  gender: string;
  height: number;
  mealsPerDay: number;
  planDuration: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];

const ProfileOverview = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile');
        setProfile(response.data.user);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;
  if (!profile) return <NoDataScreen />;

  // Calculate BMI category and color
  const bmiCategory = getBmiCategory(profile.bmi);
  const bmiColor = getBmiColor(profile.bmi);

  // Data for BMI radial chart
  const bmiData = [
    {
      name: 'BMI',
      value: profile.bmi,
      fill: bmiColor.replace('text-', '').replace('-600', '')
    }
  ];

  // Data for goals chart
  const goalsData = [
    { name: 'Weight', current: profile.weight, target: getTargetWeight(profile) },
    { name: 'BMI', current: profile.bmi, target: getTargetBmi(profile) }
  ];

  // Calculate daily calorie target based on fitness goal
  const dailyCalories = calculateDailyCalories(profile);

  function calculateProtein(profile: UserProfile): { value: number; isCapped: boolean } {
    const proteinPerKg = profile.fitnessGoal === 'weight-loss' ? 2.2 : 1.6;
    const calculatedProtein = profile.weight * proteinPerKg;
    const cappedValue = Math.min(Math.round(calculatedProtein), 150);
    return {
      value: cappedValue,
      isCapped: calculatedProtein > 150
    };
  }
  
  function calculateCarbs(profile: UserProfile): { value: number; isCapped: boolean } {
    const calories = calculateDailyCalories(profile);
    let carbPercentage = 0.4;
    if (profile.fitnessGoal === 'weight-loss') carbPercentage = 0.3;
    if (profile.fitnessGoal === 'weight-gain') carbPercentage = 0.5;
    
    const calculatedCarbs = (calories * carbPercentage) / 4;
    const cappedValue = Math.min(Math.round(calculatedCarbs), 150);
    return {
      value: cappedValue,
      isCapped: calculatedCarbs > 150
    };
  }
  
  function calculateFats(profile: UserProfile): { value: number; isCapped: boolean } {
    const calories = calculateDailyCalories(profile);
    const calculatedFats = (calories * 0.3) / 9;
    const cappedValue = Math.min(Math.round(calculatedFats), 150);
    return {
      value: cappedValue,
      isCapped: calculatedFats > 150
    };
  }
  
  function getMacroSplit(profile: UserProfile): string {
    const protein = calculateProtein(profile).value;
    const carbs = calculateCarbs(profile).value;
    const fats = calculateFats(profile).value;
    const total = protein + carbs + fats;
    
    const proteinPct = Math.round((protein / total) * 100);
    const carbsPct = Math.round((carbs / total) * 100);
    const fatsPct = Math.round((fats / total) * 100);
    
    return `${carbsPct}% Carbs, ${proteinPct}% Protein, ${fatsPct}% Fat`;
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Your Profile Overview</h1>

        {/* Basic Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <InfoCard 
            title="Personal Details"
            items={[
              { label: 'Name', value: profile.name },
              { label: 'Email', value: profile.email },
              { label: 'Age', value: `${profile.age} years` },
              { label: 'Gender', value: profile.gender }
            ]}
            icon="👤"
          />

          <InfoCard 
            title="Body Metrics"
            items={[
              { label: 'Height', value: `${profile.height} cm` },
              { label: 'Weight', value: `${profile.weight} kg` },
              { label: 'BMI', value: profile.bmi.toFixed(1), highlight: bmiColor },
              { label: 'Category', value: bmiCategory }
            ]}
            icon="📏"
          />

          <InfoCard 
            title="Diet Preferences"
            items={[
              { label: 'Diet Type', value: profile.dietType },
              { label: 'Meals/Day', value: profile.mealsPerDay },
              { label: 'Plan Duration', value: `${profile.planDuration} days` },
              { label: 'Allergies', value: profile.restrictionsAndAllergies.join(', ') || 'None' }
            ]}
            icon="🍽️"
          />

          <InfoCard 
            title="Fitness Goals"
            items={[
              { label: 'Primary Goal', value: profile.fitnessGoal },
              { label: 'Daily Calories', value: dailyCalories.toFixed(0) },
              { label: 'Target BMI', value: getTargetBmi(profile).toFixed(1) }
            ]}
            icon="🏋️"
          />
        </div>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* BMI Radial Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">BMI Analysis</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  innerRadius="20%" 
                  outerRadius="100%" 
                  barSize={20} 
                  data={bmiData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10} // Added for better visual
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}`, 'BMI']}
                  />
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className={`text-2xl font-bold ${bmiColor}`}
                  >
                    {profile.bmi.toFixed(1)}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <p className={`font-medium ${bmiColor}`}>{bmiCategory}</p>
              <p className="text-sm text-gray-600">Healthy range: 18.5 - 24.9</p>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Goals Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#8884d8" name="Current" />
                  <Bar dataKey="target" fill="#82ca9d" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <p className="text-sm text-gray-600">
                {getProgressMessage(profile)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Detailed Health Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard 
              title="Body Composition"
              items={[
                { label: 'Ideal Weight Range', value: getIdealWeightRange(profile) },
                { label: 'Body Fat Percentage', value: estimateBodyFat(profile) },
                { label: 'Basal Metabolic Rate', value: `${calculateBMR(profile)} kcal/day` },
                { label: 'Daily Calorie Needs', value: `${dailyCalories.toFixed(0)} kcal` }
              ]}
            />
            <MetricCard 
  title="Nutrition Plan"
  items={[
    { label: 'Macro Split', value: getMacroSplit(profile) },
    { 
      label: 'Recommended Protein', 
      value: `${calculateProtein(profile).value}g${calculateProtein(profile).isCapped ? ' (max reached)' : ''}` 
    },
    { 
      label: 'Recommended Carbs', 
      value: `${calculateCarbs(profile).value}g${calculateCarbs(profile).isCapped ? ' (max reached)' : ''}` 
    },
    { 
      label: 'Recommended Fats', 
      value: `${calculateFats(profile).value}g${calculateFats(profile).isCapped ? ' (max reached)' : ''}` 
    }
  ]}
/>
          </div>
        </div>

        {/* Plan Summary */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Plan Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-bold text-blue-800 mb-2">Fitness Goal</h4>
              <p className="text-blue-700">{capitalizeFirstLetter(profile.fitnessGoal)} program for {profile.planDuration} days</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <h4 className="font-bold text-green-800 mb-2">Diet Plan</h4>
              <p className="text-green-700">{capitalizeFirstLetter(profile.dietType)} diet with {profile.mealsPerDay} meals per day</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-xl font-semibold text-blue-600">Loading your profile...</div>
  </div>
);

const ErrorScreen = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-xl font-semibold text-red-600">Error: {message}</div>
  </div>
);

const NoDataScreen = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-xl font-semibold text-gray-600">No profile data found</div>
  </div>
);

const InfoCard = ({ title, items, icon }: { 
  title: string; 
  items: { label: string; value: string | number; highlight?: string }[]; 
  icon: string 
}) => (
  <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
    <div className="flex items-center mb-4">
      <span className="text-2xl mr-3">{icon}</span>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    </div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between">
          <span className="text-gray-600">{item.label}:</span>
          <span className={`font-medium ${item.highlight || 'text-gray-800'}`}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MetricCard = ({ title, items }: { title: string; items: { label: string; value: string }[] }) => (
  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
    <h4 className="font-bold text-gray-800 mb-4">{title}</h4>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index}>
          <p className="text-sm font-medium text-gray-600">{item.label}</p>
          <p className="text-lg font-semibold text-gray-800">{item.value}</p>
        </div>
      ))}
    </div>
  </div>
);

// Helper Functions
function getBmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal weight';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
}

function getBmiColor(bmi: number): string {
  if (bmi < 18.5) return 'text-blue-600';
  if (bmi >= 18.5 && bmi < 25) return 'text-green-600';
  if (bmi >= 25 && bmi < 30) return 'text-yellow-600';
  return 'text-red-600';
}

function calculateDailyCalories(profile: UserProfile): number {
  // Harris-Benedict equation for BMR
  let bmr;
  if (profile.gender.toLowerCase() === 'male') {
    bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  } else {
    bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  }

  // Adjust for activity level (assuming moderately active)
  const activityFactor = 1.55;
  let maintenanceCalories = bmr * activityFactor;

  // Adjust for goal
  if (profile.fitnessGoal === 'weight-loss') {
    return maintenanceCalories - 500; // 500 calorie deficit
  } else if (profile.fitnessGoal === 'weight-gain') {
    return maintenanceCalories + 500; // 500 calorie surplus
  }
  return maintenanceCalories;
}

function calculateBMR(profile: UserProfile): number {
  if (profile.gender.toLowerCase() === 'male') {
    return 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
  }
  return 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
}

function getTargetWeight(profile: UserProfile): number {
  const targetBmi = 22; // Healthy BMI target
  const heightInMeters = profile.height / 100;
  return targetBmi * (heightInMeters * heightInMeters);
}

function getTargetBmi(profile: UserProfile): number {
  // For weight loss, target BMI of 22 (middle of healthy range)
  if (profile.fitnessGoal === 'weight-loss') return 22;
  // For weight gain, target BMI of 24 (upper end of healthy range)
  if (profile.fitnessGoal === 'weight-gain') return 24;
  // For maintenance, aim for current BMI if in healthy range, otherwise edge of healthy range
  return Math.min(Math.max(profile.bmi, 18.5), 24.9);
}

function getIdealWeightRange(profile: UserProfile): string {
  const heightInMeters = profile.height / 100;
  const lower = 18.5 * (heightInMeters * heightInMeters);
  const upper = 24.9 * (heightInMeters * heightInMeters);
  return `${lower.toFixed(1)} - ${upper.toFixed(1)} kg`;
}

function estimateBodyFat(profile: UserProfile): string {
  // Very rough estimation
  if (profile.gender.toLowerCase() === 'male') {
    if (profile.bmi < 18.5) return '8-12%';
    if (profile.bmi < 25) return '12-20%';
    if (profile.bmi < 30) return '20-25%';
    return '25%+';
  } else {
    if (profile.bmi < 18.5) return '14-18%';
    if (profile.bmi < 25) return '18-28%';
    if (profile.bmi < 30) return '28-33%';
    return '33%+';
  }
}

function getMacroSplit(goal: string): string {
  switch (goal) {
    case 'weight-loss': return '40% Carbs, 30% Protein, 30% Fat';
    case 'weight-gain': return '50% Carbs, 25% Protein, 25% Fat';
    default: return '45% Carbs, 25% Protein, 30% Fat';
  }
}

function calculateProtein(profile: UserProfile): number {
  // 2.2g per kg for weight loss, 1.6g for others
  const factor = profile.fitnessGoal === 'weight-loss' ? 2.2 : 1.6;
  return Math.round(profile.weight * factor);
}

function calculateCarbs(profile: UserProfile): number {
  const calories = calculateDailyCalories(profile);
  let carbPercentage = 0.4; // 40% by default
  if (profile.fitnessGoal === 'weight-loss') carbPercentage = 0.3;
  if (profile.fitnessGoal === 'weight-gain') carbPercentage = 0.5;
  return Math.round((calories * carbPercentage) / 4); // 4 calories per gram
}

function calculateFats(profile: UserProfile): number {
  const calories = calculateDailyCalories(profile);
  return Math.round((calories * 0.3) / 9); // 9 calories per gram, 30% from fat
}

function getProgressMessage(profile: UserProfile): string {
  if (profile.fitnessGoal === 'weight-loss') {
    return `Aim to lose ${(profile.weight - getTargetWeight(profile)).toFixed(1)} kg to reach healthy BMI`;
  }
  if (profile.fitnessGoal === 'weight-gain') {
    return `Aim to gain ${(getTargetWeight(profile) - profile.weight).toFixed(1)} kg to reach healthy BMI`;
  }
  return `Maintain your weight with balanced nutrition and exercise`;
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default ProfileOverview;