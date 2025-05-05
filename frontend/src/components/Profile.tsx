import type React from "react"
import { useEffect, useState } from "react"
import axios from "axios"

interface User {
  _id: string
  name: string
  email: string
  age: number
  gender: string
  height: number
  weight: number
  bmi: number
  dietType: string
  fitnessGoal: string
  mealsPerDay: number
  planDuration: number
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .get<{ user: User }>("http://localhost:3000/api/auth/profile")
      .then((res) => {
        setUser(res.data.user)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching user profile:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>
          <div className="h-6 w-48 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 w-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find your profile information.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const initial = user.name.charAt(0).toUpperCase()
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "bg-blue-500", text: "text-blue-800" }
    if (bmi < 25) return { label: "Normal", color: "bg-green-500", text: "text-green-800" }
    if (bmi < 30) return { label: "Overweight", color: "bg-yellow-500", text: "text-yellow-800" }
    return { label: "Obese", color: "bg-red-500", text: "text-red-800" }
  }

  const bmiInfo = getBmiCategory(user.bmi)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-600">{initial}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Age</span>
                    <span className="font-medium">{user.age} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-medium">{capitalize(user.gender)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Plan Duration</span>
                    <span className="font-medium">{user.planDuration} days</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium">{new Date().getFullYear()}</span>
                </div>
              </div>
            </div>

            {/* Diet Plan */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Diet Plan
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Diet Type</p>
                    <p className="font-medium text-indigo-600">{capitalize(user.dietType)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Meals Per Day</p>
                    <div className="flex items-center gap-2">
                      {[...Array(user.mealsPerDay)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Fitness Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fitness Goals */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Fitness Goals
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Primary Goal</p>
                  <p className="text-lg font-medium text-gray-800">{formatLabel(user.fitnessGoal)}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {user.fitnessGoal.includes("weight-loss") && (
                    <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                      Weight Loss
                    </span>
                  )}
                  {user.fitnessGoal.includes("muscle") && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Muscle Building
                    </span>
                  )}
                  {user.fitnessGoal.includes("health") && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      General Health
                    </span>
                  )}
                  {user.fitnessGoal.includes("endurance") && (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                      Endurance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Health Metrics */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Health Metrics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">Height</span>
                      <span className="text-indigo-600 font-medium">{user.height} cm</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(user.height / 250) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">Weight</span>
                      <span className="text-indigo-600 font-medium">{user.weight} kg</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${(user.weight / 150) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-sm text-indigo-600 font-medium mb-1">Body Mass Index (BMI)</p>
                        <div className="flex items-center gap-3">
                          <p className="text-3xl font-bold text-gray-800">{user.bmi.toFixed(1)}</p>
                          <span className={`${bmiInfo.color} ${bmiInfo.text} text-xs font-medium px-3 py-1 rounded-full`}>
                            {bmiInfo.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-1/2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Underweight</span>
                          <span>Normal</span>
                          <span>Overweight</span>
                          <span>Obese</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
                          <div className="absolute inset-0 flex">
                            <div className="w-1/4 bg-blue-500"></div>
                            <div className="w-1/4 bg-green-500"></div>
                            <div className="w-1/4 bg-yellow-500"></div>
                            <div className="w-1/4 bg-red-500"></div>
                          </div>
                          <div 
                            className="absolute top-0 h-3 w-1 bg-black -ml-0.5"
                            style={{ left: `${(user.bmi / 40) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress Summary */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Plan Progress
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 font-medium">Plan Completion</span>
                      <span className="text-gray-600">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <p className="text-sm text-indigo-600 font-medium">Days Completed</p>
                      <p className="text-2xl font-bold text-gray-800">7</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Days Remaining</p>
                      <p className="text-2xl font-bold text-gray-800">{user.planDuration - 7}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Profile last updated: {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>
    </div>
  )
}

// Utility functions
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const formatLabel = (str: string) => str.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

export default Profile