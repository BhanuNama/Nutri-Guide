import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Scale, Target, Heart, Clock, Activity, AlertCircle, ArrowRight } from 'lucide-react';

function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bmi: '',
    dietType: '',
    fitnessGoal: '',
    restrictionsAndAllergies: '',
    mealsPerDay: '',
    planDuration: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('neutroToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Try to fetch existing user data
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.user) {
          const userData = response.data.user;
          
          // If user already has a completed profile, pre-fill the form
          if (userData.profileCompleted) {
            setIsUpdate(true);
            
            // Pre-fill form with existing user data
            setFormData({
              name: userData.name || '',
              age: userData.age ? String(userData.age) : '',
              gender: userData.gender || '',
              height: userData.height ? String(userData.height) : '',
              weight: userData.weight ? String(userData.weight) : '',
              bmi: userData.bmi ? String(userData.bmi) : '',
              dietType: userData.dietType || '',
              fitnessGoal: userData.fitnessGoal || '',
              restrictionsAndAllergies: userData.restrictionsAndAllergies?.join(', ') || '',
              mealsPerDay: userData.mealsPerDay ? String(userData.mealsPerDay) : '',
              planDuration: userData.planDuration ? String(userData.planDuration) : ''
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If there's an error, we'll just continue with an empty form
      }
    };
    
    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (formData.height && formData.weight) {
      const heightInMeters = Number(formData.height) / 100;
      const weightInKg = Number(formData.weight);
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      setFormData(prev => ({ ...prev, bmi: bmi.toFixed(2) }));
    }
  }, [formData.height, formData.weight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Make sure all required fields are filled
      const requiredFields = ['name', 'age', 'gender', 'height', 'weight', 'bmi', 'dietType', 'fitnessGoal', 'mealsPerDay', 'planDuration'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      const dataToSend = {
        ...formData,
        restrictionsAndAllergies: formData.restrictionsAndAllergies ? 
          formData.restrictionsAndAllergies.split(',').map(item => item.trim()) : [],
        age: Number(formData.age),
        height: Number(formData.height),
        weight: Number(formData.weight),
        bmi: Number(formData.bmi),
        mealsPerDay: Number(formData.mealsPerDay),
        planDuration: Number(formData.planDuration)
      };
      
      // Log the data being sent for debugging
      console.log('Sending data:', dataToSend);
      
      const token = localStorage.getItem('neutroToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Use the update profile endpoint to update existing user
      const response = await axios.post('http://localhost:3000/api/users/update-profile', dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response:', response.data);
      
      // Navigate to dashboard
      setError('');
      alert(isUpdate ? 'Profile updated successfully!' : 'Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Update failed';
      setError(`Failed: ${errorMessage}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
              {isUpdate ? 'Update Your Profile' : 'Complete Registration'}
            </h2>
            <p className="text-gray-400">Help us create your personalized diet plan</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
              </div>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-300">Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="age" className="text-sm font-medium text-gray-300">Age</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    required
                    min="1"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="gender" className="text-sm font-medium text-gray-300">Gender</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-gray-800">Select gender</option>
                    <option value="male" className="bg-gray-800">Male</option>
                    <option value="female" className="bg-gray-800">Female</option>
                    <option value="other" className="bg-gray-800">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label htmlFor="height" className="text-sm font-medium text-gray-300">Height (cm)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Scale className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    required
                    min="1"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Height in cm"
                    value={formData.height}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="weight" className="text-sm font-medium text-gray-300">Weight (kg)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Scale className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    required
                    min="1"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Weight in kg"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="bmi" className="text-sm font-medium text-gray-300">BMI</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="bmi"
                    name="bmi"
                    readOnly
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={formData.bmi}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="dietType" className="text-sm font-medium text-gray-300">Diet Type</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Heart className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="dietType"
                    name="dietType"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    value={formData.dietType}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-gray-800">Select diet type</option>
                    <option value="veg" className="bg-gray-800">Vegetarian</option>
                    <option value="non-veg" className="bg-gray-800">Non-Vegetarian</option>
                    <option value="vegan" className="bg-gray-800">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="fitnessGoal" className="text-sm font-medium text-gray-300">Fitness Goal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="fitnessGoal"
                    name="fitnessGoal"
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                    value={formData.fitnessGoal}
                    onChange={handleChange}
                  >
                    <option value="" className="bg-gray-800">Select fitness goal</option>
                    <option value="weight-loss" className="bg-gray-800">Weight Loss</option>
                    <option value="weight-gain" className="bg-gray-800">Weight Gain</option>
                    <option value="muscle-building" className="bg-gray-800">Muscle Building</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="restrictionsAndAllergies" className="text-sm font-medium text-gray-300">
                Restrictions & Allergies
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3">
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="restrictionsAndAllergies"
                  name="restrictionsAndAllergies"
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.restrictionsAndAllergies}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Enter any dietary restrictions or allergies (comma-separated)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="mealsPerDay" className="text-sm font-medium text-gray-300">Meals per Day</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="mealsPerDay"
                    name="mealsPerDay"
                    required
                    min="2"
                    max="6"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Number of meals"
                    value={formData.mealsPerDay}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="planDuration" className="text-sm font-medium text-gray-300">Plan Duration (days)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="planDuration"
                    name="planDuration"
                    required
                    min="3"
                    max="60"
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Duration in days"
                    value={formData.planDuration}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                loading 
                  ? 'bg-blue-500/50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isUpdate ? 'Update Profile' : 'Complete Registration'}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistrationForm;