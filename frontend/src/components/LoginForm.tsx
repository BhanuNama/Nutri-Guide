import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Make sure all required fields are filled
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      
      console.log('Attempting login with:', { email: formData.email });
      
      // Use the correct endpoint URL for login
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      
      // Store auth token and user info in localStorage
      if (response.data && response.data.token) {
        localStorage.setItem('neutroToken', response.data.token);
        localStorage.setItem('neutroUserId', response.data.user._id);
        localStorage.setItem('neutroUserName', response.data.user.name);
        
        console.log('Stored in localStorage:', {
          token: response.data.token,
          userId: response.data.user._id,
          userName: response.data.user.name,
          profileCompleted: response.data.profileCompleted
        });
        
        // Dispatch a custom event to notify that auth state has changed
        window.dispatchEvent(new Event('auth-change'));
        
        // Redirect based on profile completion status
        if (response.data.profileCompleted) {
          // If profile is complete, go to dashboard
          navigate('/dashboard');
        } else {
          // If profile is not complete, go to registration form
          navigate('/register');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Helper function to manually set login data (for development/testing)
  const setManualLoginData = () => {
    localStorage.setItem('neutroToken', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX');
    localStorage.setItem('neutroUserId', '67ff0c361963d35adea4bb70');
    localStorage.setItem('neutroUserName', 'Karan Kendre');
    
    // Dispatch a custom event to notify that auth state has changed
    window.dispatchEvent(new Event('auth-change'));
    
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
              } transition-colors`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          {/* For temporary use - will be removed in production */}
          <div className="mt-2">
            <button
              type="button"
              onClick={setManualLoginData}
              className="w-full py-2 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Use Test Account
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-green-600 hover:text-green-700 font-medium">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm; 