import { Brain, Rocket, Target, Leaf, ChevronRight, Heart, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function HeroSection() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('neutroUserId');
    const token = localStorage.getItem('neutroToken');
    
    if (userId && token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Gradient Background Splash for Visual Interest */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-green-50 to-white -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 pt-12 gap-12 items-center mb-20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 pb-6">
              <Leaf className="w-8 h-8 text-green-600 animate-pulse" />
              <h1 className="text-3xl font-bold text-green-800">Nutri-Guide</h1>
            </div>
            
            <h2 className="text-5xl font-bold text-start leading-tight mb-6 text-gray-900">
              Nourish Your Body, <span className="text-green-600">Elevate Your Health</span>
            </h2>
            
            <p className="text-lg text-start text-gray-600 mb-8 max-w-lg">
              AI-powered personalized nutrition that adapts to your lifestyle. Get custom meal plans, 
              track progress, and discover recipes that make healthy eating effortless and enjoyable.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              {!isLoggedIn ? (
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-3 bg-green-600 text-white rounded-full text-lg font-semibold hover:bg-green-700 transition-all hover:shadow-lg flex items-center gap-2"
                >
                  Start Your Journey <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 bg-green-600 text-white rounded-full text-lg font-semibold hover:bg-green-700 transition-all hover:shadow-lg flex items-center gap-2"
                >
                  Go to Dashboard <ChevronRight className="w-5 h-5" />
                </button>
              )}
              
              {!isLoggedIn && (
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 border-2 border-green-600 bg-transparent rounded-full text-lg font-semibold text-green-700 hover:bg-green-50 transition-all hover:shadow-md flex items-center gap-2"
                >
                  Try Demo <Rocket className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-8">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-yellow-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-200 border-2 border-white"></div>
                </div>
                <span className="text-sm text-gray-600">100+ Happy Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600">Nutritionist Approved</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration Area - Enhanced */}
          <div className="relative">
            <div className="bg-green-100 rounded-3xl shadow-xl w-full h-[400px] flex items-center justify-center overflow-hidden relative">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-20 left-20 w-16 h-16 rounded-full bg-green-300"></div>
                <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-yellow-200"></div>
              </div>
              
              <div className="text-center p-6 relative z-10">
                <div className="relative inline-block">
                  <Leaf className="w-16 h-16 text-green-600 mx-auto mb-4 animate-float" />
                  <Heart className="absolute -top-2 -right-2 w-6 h-6 text-pink-500 animate-pulse" />
                </div>
                <p className="text-2xl font-bold text-green-800 mb-2">Your Health Journey Starts Here</p>
                <p className="text-gray-600 max-w-md mx-auto">
                  Fresh, delicious meals tailored to your body's needs and your taste preferences.
                </p>
              </div>
            </div>
            
            {/* Floating Food Icons (Optional) */}
            <div className="absolute -bottom-6 -left-6 bg-white p-3 rounded-full shadow-md">
              <span role="img" aria-label="Avocado" className="text-2xl">🥑</span>
            </div>
            <div className="absolute -top-6 -right-6 bg-white p-3 rounded-full shadow-md">
              <span role="img" aria-label="Salad" className="text-2xl">🥗</span>
            </div>
          </div>
        </div>

        {/* Features Section - Enhanced */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Smart Planning</h3>
            <p className="text-gray-600 mb-4">
              Our AI learns your preferences to create the perfect meal plan that actually works for you.
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>Learn how it works</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Time-Saving</h3>
            <p className="text-gray-600 mb-4">
              No more meal prep stress. We handle the planning so you can focus on eating well.
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>See meal plans</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-800">Goal-Oriented</h3>
            <p className="text-gray-600 mb-4">
              Whether it's weight loss or muscle gain, we tailor everything to help you succeed.
            </p>
            <div className="flex items-center text-green-600 font-medium">
              <span>Set your goals</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>

        {/* Testimonial/Stats Section (Optional) */}
        <div className="mt-24 bg-green-50 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">Trusted by Health-Conscious People</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">User Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
              <div className="text-gray-600">Meals Planned</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-gray-600">Nutritionist Approved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;