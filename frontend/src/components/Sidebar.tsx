import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Brain } from 'lucide-react'; // or your relevant icon library
import { FaStethoscope } from 'react-icons/fa';
import { FaUtensils } from 'react-icons/fa';


import { 
  Home, 
  Menu, 
  X, 
  Settings, 
  FileText, 
  User, 
  LogOut, 
  ShoppingCart, 
  Utensils,
  BarChart,
  Calendar,
  Info,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const isActive = (path: string) => router.pathname === path;

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const sidebarItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} /> },
    { name: 'Diet Planner', path: '/diet-planner', icon: <Utensils size={20} /> },
    { name: 'Shopping List', path: '/shopping', icon: <ShoppingCart size={20} /> },
    { name: 'Progress', path: '/progress', icon: <BarChart size={20} /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
    { name: 'Reports', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Community Wall', path: '/reports', icon: <FileText size={20} /> },
    { name: 'Fix My Meal', path: '/fix-my-meal', icon: <Utensils size={20} /> },
    { name: 'Mindful Eating Score', path: '/mindful-score', icon: <Brain size={20} /> },
    { name: 'Food Doctor', path: '/food-doctor', icon: <FaStethoscope size={20} /> },
    { name: 'Cooking Companion', path: '/cooking-companion', icon: <FaUtensils size={20} /> },


  ];

  const bottomItems = [
    { name: 'Account', path: '/account', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    { name: 'Help & Support', path: '/help', icon: <Info size={20} /> },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button
          className="p-2 rounded-lg bg-white shadow-md text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed  top-0 left-0 h-full z-40 bg-white  shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:sticky lg:top-0 lg:h-screen overflow-y-auto flex flex-col`}
      >
        <div className="p-5 border-b  flex items-center justify-between">
          <Link href="/dashboard">
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                N
              </div>
              <span className="ml-2.5 text-xl font-semibold text-gray-800">Neutro</span>
            </div>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
            onClick={toggleSidebar}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 py-6 px-4">
          <div className="px-2 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            Main Menu
          </div>
          <div className="space-y-1.5">
            {sidebarItems.map((item) => (
              <Link href={item.path} key={item.path}>
                <div
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mr-3.5 ${isActive(item.path) ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                  {isActive(item.path) ? (
                    <div className="ml-auto h-2 w-2 rounded-full bg-green-500"></div>
                  ) : (
                    <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-60 text-gray-400" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t py-4 px-4">
          <div className="px-2 mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            User
          </div>
          <div className="space-y-1.5">
            {bottomItems.map((item) => (
              <Link href={item.path} key={item.path}>
                <div
                  className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`mr-3.5 ${isActive(item.path) ? 'text-green-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    {item.icon}
                  </div>
                  <span>{item.name}</span>
                  {isActive(item.path) ? (
                    <div className="ml-auto h-2 w-2 rounded-full bg-green-500"></div>
                  ) : (
                    <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-60 text-gray-400" />
                  )}
                </div>
              </Link>
            ))}

            <button className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 mt-2 group">
              <LogOut size={20} className="mr-3.5" />
              <span>Logout</span>
              <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-60 text-red-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-t">
          <div className="flex items-center p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 cursor-pointer">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
              <img src="/placeholder-avatar.png" alt="Profile" className="h-full w-full object-cover" onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff';
              }} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs font-medium text-green-600">Premium Plan</p>
            </div>
            <ChevronRight size={16} className="ml-auto text-gray-400" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 