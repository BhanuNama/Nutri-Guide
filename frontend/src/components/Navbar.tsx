import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Leaf } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Function to check auth status
  const checkAuthStatus = () => {
    // Check if user is logged in - require all auth items
    const token = localStorage.getItem('neutroToken');
    const userId = localStorage.getItem('neutroUserId');
    const storedUserName = localStorage.getItem('neutroUserName');
    
    if (token && userId && storedUserName) {
      setIsLoggedIn(true);
      setUserName(storedUserName);
    } else {
      // Clear any partial auth data
      localStorage.removeItem('neutroToken');
      localStorage.removeItem('neutroUserId');
      localStorage.removeItem('neutroUserName');
      setIsLoggedIn(false);
      setUserName('');
    }
  };

  useEffect(() => {
    // Check auth status when component mounts
    checkAuthStatus();
    
    // Add event listener for storage changes (in case user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    // Add event listener for auth-change event (from login/signup components)
    window.addEventListener('auth-change', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('auth-change', checkAuthStatus);
    };
  }, []);

  // Re-check auth status on location changes (e.g., after login/registration)
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('neutroToken');
    localStorage.removeItem('neutroUserId');
    localStorage.removeItem('neutroUserName');
    setIsLoggedIn(false);
    setUserName('');
    navigate('/');
    
    // Dispatch auth-change event when logging out
    window.dispatchEvent(new Event('auth-change'));
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-green-600" />
              <span className="text-xl font-bold">Nutri-Guide</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <span className="text-gray-700">Welcome, {userName}</span>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-md"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-green-700 hover:bg-green-50 rounded-md"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 